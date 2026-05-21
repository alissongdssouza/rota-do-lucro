/* ═══════════════════════════════════════
   ROTA DO LUCRO v2 — debts.js
   Dívidas · Metas · Relatórios
═══════════════════════════════════════ */
'use strict';

/* ── DÍVIDAS ── */
function addDivida(evt){
  rip(evt,evt.currentTarget);
  const nome   =document.getElementById('d-n')?.value.trim()||'';
  const total  =parseFloat(document.getElementById('d-t')?.value||'0');
  const pago   =parseFloat(document.getElementById('d-pg')?.value||'0')||0;
  const parcela=parseFloat(document.getElementById('d-p')?.value||'0')||0;
  const dia    =parseInt(document.getElementById('d-d')?.value||'10')||10;
  const tipo   =document.getElementById('d-tp')?.value||'Outro';
  if(!nome||isNaN(total)||total<=0){shake('d-t');toast('Preencha nome e valor total');return;}
  D.dividas.push({id:Date.now(),nome,total,pago,parcela,dia,tipo});
  log('divida','Dívida: '+nome+' R$'+total.toFixed(2));
  save(); rndrD(); upM();
  ['d-n','d-t','d-pg','d-p','d-d'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  toast('Dívida cadastrada');
}

function delD(id){
  D.dividas=D.dividas.filter(d=>d.id!==id);
  save(); rndrD(); upM();
}

function pagarParcela(id){
  const d=D.dividas.find(x=>x.id===id); if(!d)return;
  if(d.parcela>0){
    d.pago=Math.min(d.total,d.pago+(d.parcela));
    log('pagamento','Parcela paga: '+d.nome);
    save(); rndrD(); upM(); toast('Parcela registrada!');
  }
}

function rndrD(){
  const el=document.getElementById('lista-d'); if(!el)return;
  if(!D.dividas.length){el.innerHTML='<div class="empty">Nenhuma dívida cadastrada.<br>Adicione abaixo.</div>';return;}
  const hj=new Date().getDate();
  el.innerHTML=D.dividas.map((d,i)=>{
    const r=Math.max(0,d.total-d.pago);
    const pct=Math.min(100,Math.round((d.pago/d.total)*100));
    const barC=pct>=70?'var(--acc)':pct>=40?'var(--amb)':'var(--red)';
    const diff=d.dia-hj;
    let vL,vC;
    if(diff<0&&diff>-5){vL='Atrasado';vC='vat';}
    else if(diff===0){vL='Vence hoje';vC='vs';}
    else if(diff>0&&diff<=5){vL='Vence em '+diff+'d';vC='vs';}
    else{vL='Dia '+d.dia+'/mês';vC='vok';}
    const nP=d.parcela>0?`~${Math.ceil(r/d.parcela)}x`:'—';
    const btPagar=d.parcela>0&&r>0?`<button onclick="pagarParcela(${d.id})" style="font-size:var(--fxs);padding:2px 8px;background:var(--acc-d);color:var(--acc);border:1px solid var(--acc-d2);border-radius:var(--rxs);cursor:pointer;white-space:nowrap">+parcela</button>`:'';
    return `<div class="dcard" style="animation-delay:${i*.05}s">
      <div class="dtop">
        <div><div class="dname">${ico(d.tipo)} ${d.nome}</div><span class="dbadge">${d.tipo}</span></div>
        <div style="text-align:right">
          <div class="drest">R$ ${r.toFixed(2)}</div>
          <div class="dde">de R$${d.total.toFixed(2)}</div>
          <button class="del" style="margin-top:3px" onclick="delD(${d.id})">${dico()}</button>
        </div>
      </div>
      <div class="prog-bg"><div class="prog-fill" style="width:${pct}%;background:${barC}"></div></div>
      <div class="dfooter">
        <span>${pct}% pago</span>
        <span class="${vC}">${vL}</span>
        <span style="display:flex;align-items:center;gap:4px">${nP} ${btPagar}</span>
      </div>
    </div>`;
  }).join('');
}

/* ── METAS ── */
function addMeta(evt){
  rip(evt,evt.currentTarget);
  const nome=document.getElementById('mt-nome')?.value.trim()||'';
  const alvo=parseFloat(document.getElementById('mt-alvo')?.value||'0');
  const tipo=document.getElementById('mt-tipo')?.value||'economia';
  if(!nome||isNaN(alvo)||alvo<=0){shake('mt-alvo');toast('Preencha nome e valor alvo');return;}
  if(!Array.isArray(D.metas)) D.metas=[];
  D.metas.push({id:Date.now(),nome,alvo,tipo,criadoEm:new Date().toLocaleDateString('pt-BR')});
  log('meta','Meta criada: '+nome);
  save(); rndrMetas();
  const mn=document.getElementById('mt-nome'); if(mn)mn.value='';
  const ma=document.getElementById('mt-alvo'); if(ma)ma.value='';
  toast('Meta criada!');
}

function delMeta(id){
  D.metas=D.metas.filter(m=>m.id!==id);
  save(); rndrMetas();
}

function _metaProgresso(m){
  const {saldo,ent,sai,gU,cU}=calcSaldo();
  const tP=D.dividas.reduce((a,b)=>a+(b.parcela||0),0);
  if(m.tipo==='economia') return {atual:Math.max(0,saldo),pct:Math.min(100,Math.round(Math.max(0,saldo)/m.alvo*100))};
  if(m.tipo==='limite')   return {atual:sai+cU,pct:Math.min(100,Math.round((sai+cU)/m.alvo*100)),inv:true};
  if(m.tipo==='receita')  return {atual:ent+gU,pct:Math.min(100,Math.round((ent+gU)/m.alvo*100))};
  if(m.tipo==='divida'){
    const tD=D.dividas.reduce((a,b)=>a+Math.max(0,b.total-b.pago),0);
    return {atual:tD,pct:Math.min(100,Math.round((1-tD/m.alvo)*100)),inv:true};
  }
  return {atual:0,pct:0};
}

function rndrMetas(){
  const el=document.getElementById('lista-metas'); if(!el)return;
  if(!Array.isArray(D.metas)||!D.metas.length){
    el.innerHTML='<div class="empty">Nenhuma meta criada.<br>Adicione abaixo.</div>';return;
  }
  const tipos={'economia':'Economia','limite':'Limite de gastos','receita':'Meta de receita','divida':'Quitar dívida'};
  el.innerHTML=D.metas.map((m,i)=>{
    const {atual,pct,inv}=_metaProgresso(m);
    const barC=inv?(pct<50?'var(--acc)':pct<80?'var(--amb)':'var(--red)'):(pct>=80?'var(--acc)':pct>=50?'var(--amb)':'var(--red)');
    const atingida=inv?pct<=30:pct>=100;
    return `<div class="meta-card" style="animation-delay:${i*.05}s">
      <div class="meta-hdr">
        <div><div class="meta-nome">${m.nome}</div><div class="meta-tipo">${tipos[m.tipo]||m.tipo}</div></div>
        <div style="text-align:right">
          <div class="meta-pct" style="color:${barC}">${pct}%</div>
          ${atingida?'<div style="font-size:var(--fxs);color:var(--acc)">✓ Atingida!</div>':''}
          <button class="del" onclick="delMeta(${m.id})" style="margin-top:2px">${dico()}</button>
        </div>
      </div>
      <div class="prog-bg"><div class="prog-fill" style="width:${pct}%;background:${barC}"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:var(--fxs);color:var(--mu)">
        <span>R$${atual.toFixed(2)}</span><span>Alvo: R$${m.alvo.toFixed(2)}</span>
      </div>
    </div>`;
  }).join('');
}

/* ── RELATÓRIOS ── */
function rndrRelatorio(){
  const el=document.getElementById('lista-relatorio'); if(!el)return;

  // Agrupar gastos por mês/ano
  const meses={};
  [...D.gastos,...D.corridas.map(c=>({...c,tipo:'e',val:c.ganho,cat:'Corrida'})),
   ...D.abast.map(a=>({...a,tipo:'g',cat:'Abastecimento'}))].forEach(g=>{
    if(!g.data)return;
    const [dia,mes,ano]=g.data.split('/');
    const key=`${ano}-${mes}`;
    if(!meses[key]) meses[key]={key,label:_mesLabel(mes,ano),ent:0,sai:0,gastosCat:{}};
    if(g.tipo==='e') meses[key].ent+=(g.val||0);
    else{ meses[key].sai+=(g.val||0); meses[key].gastosCat[g.cat]=(meses[key].gastosCat[g.cat]||0)+(g.val||0); }
  });

  const sorted=Object.values(meses).sort((a,b)=>b.key.localeCompare(a.key));
  if(!sorted.length){el.innerHTML='<div class="empty">Nenhum dado para gerar relatório.</div>';return;}

  el.innerHTML=sorted.map(m=>{
    const saldo=m.ent-m.sai;
    const topCat=Object.entries(m.gastosCat).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([c,v])=>c+' R$'+Math.round(v)).join(' · ');
    return `<div class="rel-row" onclick="toggleRelMes('${m.key}')">
      <div>
        <div class="rel-mes">${m.label}</div>
        <div class="rel-det">
          <span class="vg">↑ R$${Math.round(m.ent)}</span>
          <span class="vr">↓ R$${Math.round(m.sai)}</span>
          ${topCat?`<span>${topCat}</span>`:''}
        </div>
      </div>
      <div class="rel-saldo ${saldo>=0?'vg':'vr'}">${saldo>=0?'+':''}R$${Math.abs(saldo).toFixed(0)}</div>
    </div>`;
  }).join('');
}

function _mesLabel(mes,ano){
  const nomes=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return (nomes[parseInt(mes)-1]||mes)+' '+ano;
}

function toggleRelMes(key){ /* expansão futura */ }

function exportarRelatorio(){
  const {ent,sai,gU,cU,saldo}=calcSaldo();
  const csv=['Tipo,Descrição,Categoria,Valor,Pagamento,Data',
    ...D.gastos.map(g=>[g.tipo==='e'?'Entrada':'Saída',`"${g.desc}"`,g.cat,g.val.toFixed(2),g.pag||'',g.data].join(',')),
    ...D.corridas.map(c=>['Corrida',`"Corrida${c.obs?' '+c.obs:''}"`,  'Uber',c.ganho.toFixed(2),'',c.data].join(',')),
    ...D.abast.map(a=>['Saída','Abastecimento','Combustível',a.val.toFixed(2),'',a.data].join(','))
  ].join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='relatorio-rdl-'+new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')+'.csv';
  a.click(); URL.revokeObjectURL(url);
  toast('Relatório exportado!');
}

window.addDivida=addDivida; window.delD=delD; window.pagarParcela=pagarParcela; window.rndrD=rndrD;
window.addMeta=addMeta; window.delMeta=delMeta; window.rndrMetas=rndrMetas;
window.rndrRelatorio=rndrRelatorio; window.exportarRelatorio=exportarRelatorio;

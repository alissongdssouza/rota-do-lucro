/* ═══════════════════════════════════════
   ROTA DO LUCRO v2 — finance.js
   Gastos · Corridas · Abastecimento · Veículo
═══════════════════════════════════════ */
'use strict';

let _tg = 'e';  // tipo gasto atual
let _filtroGasto = 'todos';
let _buscaGasto  = '';
let _editando    = null;

/* ── ÍCONES POR CATEGORIA ── */
const IC = {
  'Salário/Renda':'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  'Freela/Extra' :'<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  'Moradia'      :'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  'Alimentação'  :'<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>',
  'Transporte'   :'<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  'Saúde'        :'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  'Educação'     :'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  'Lazer'        :'<circle cx="12" cy="12" r="10"/>',
  'Roupas'       :'<polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
  'Dívida/Parcela':'<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  'Outros'       :'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>',
  'Corrida'      :'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'Abastecimento':'<line x1="3" y1="22" x2="3" y2="2"/><line x1="13" y1="22" x2="13" y2="2"/><line x1="3" y1="12" x2="13" y2="12"/>',
  'Cartão'       :'<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  'Empréstimo'   :'<line x1="12" y1="1" x2="12" y2="23"/>',
  'Financiamento':'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  'Cheque esp.'  :'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>',
  'Amigo/Fam.'   :'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
};
function ico(c){ return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'+(IC[c]||IC['Outros'])+'</svg>'; }
function dico(){ return '<svg viewBox="0 0 24 24" stroke-width="2" fill="none" stroke="currentColor" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'; }
function eico(){ return '<svg viewBox="0 0 24 24" stroke-width="2" fill="none" stroke="currentColor" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'; }

/* ── TIPO GASTO ── */
function setTG(t){
  _tg=t;
  const e=document.getElementById('tg-e'), g=document.getElementById('tg-g');
  if(e) e.className='tipo-btn'+(t==='e'?' on-g':'');
  if(g) g.className='tipo-btn'+(t==='g'?' on-r':'');
}

/* ── ADICIONAR GASTO ── */
function addGasto(evt){
  rip(evt,evt.currentTarget);
  const desc=document.getElementById('g-desc')?.value.trim()||'';
  const val =parseFloat(document.getElementById('g-val')?.value||'0');
  const cat =document.getElementById('g-cat')?.value||'Outros';
  const pag =document.getElementById('g-pag')?.value||'Pix';
  if(!desc||isNaN(val)||val<=0){shake('g-val');toast('Preencha descrição e valor');return;}
  if(_editando){
    const idx=D.gastos.findIndex(g=>g.id===_editando);
    if(idx>=0) D.gastos[idx]={...D.gastos[idx],desc,val,cat,pag,tipo:_tg};
    _editando=null; document.getElementById('g-add-btn').textContent='Adicionar';
  }else{
    D.gastos.push({id:Date.now(),desc,val,cat,pag,tipo:_tg,data:new Date().toLocaleDateString('pt-BR')});
    log('gasto',(_tg==='e'?'+':'-')+' R$'+val.toFixed(2)+' '+desc);
  }
  save(); rndrG(); upM(); drawChart();
  document.getElementById('g-desc').value='';
  document.getElementById('g-val').value='';
  toast(_tg==='e'?'Entrada registrada':'Gasto registrado');
}

/* ── EDITAR GASTO ── */
function editG(id){
  const g=D.gastos.find(x=>x.id===id); if(!g)return;
  _editando=id;
  const desc=document.getElementById('g-desc'), val=document.getElementById('g-val');
  const cat=document.getElementById('g-cat'), pag=document.getElementById('g-pag');
  const btn=document.getElementById('g-add-btn');
  if(desc)desc.value=g.desc; if(val)val.value=g.val;
  if(cat)cat.value=g.cat;   if(pag)pag.value=g.pag||'Pix';
  if(btn)btn.textContent='Salvar edição';
  setTG(g.tipo);
  showP('gastos');
  desc?.focus();
}

function delG(id){
  D.gastos=D.gastos.filter(g=>g.id!==id);
  save(); rndrG(); upM(); drawChart();
}

/* ── FILTRO + BUSCA ── */
function setFiltroGasto(f,el){
  _filtroGasto=f;
  document.querySelectorAll('.filter-chip[data-fg]').forEach(c=>c.classList.toggle('on',c.dataset.fg===f));
  rndrG();
}
function setBuscaGasto(v){ _buscaGasto=v.toLowerCase(); rndrG(); }

function _filtrarGastos(){
  let list=[...D.gastos];
  if(_filtroGasto==='entrada')  list=list.filter(g=>g.tipo==='e');
  if(_filtroGasto==='saida')    list=list.filter(g=>g.tipo==='g');
  if(_filtroGasto!=='todos'&&_filtroGasto!=='entrada'&&_filtroGasto!=='saida')
    list=list.filter(g=>g.cat===_filtroGasto);
  if(_buscaGasto) list=list.filter(g=>(g.desc||'').toLowerCase().includes(_buscaGasto)||(g.cat||'').toLowerCase().includes(_buscaGasto));
  return list.reverse();
}

/* ── RENDERIZAR GASTOS ── */
function rndrG(){
  const el=document.getElementById('lista-g'); if(!el)return;
  const list=_filtrarGastos();
  if(!list.length){el.innerHTML='<div class="empty">Nenhum lançamento'+((_buscaGasto||_filtroGasto!=='todos')?' encontrado':'ainda.')+'</div>';return;}
  el.innerHTML=list.map((g,i)=>`
    <div class="txcard" style="animation-delay:${Math.min(i,8)*.04}s">
      <div class="txico ${g.tipo==='e'?'txg':'txr'}">${ico(g.cat)}</div>
      <div class="txbody">
        <div class="txdesc">${g.desc}</div>
        <div class="txmeta">${g.cat} · ${g.pag||''} · ${g.data}</div>
      </div>
      <div class="txval ${g.tipo==='e'?'vg':'vr'}">${g.tipo==='e'?'+':'-'}R$${g.val.toFixed(2)}</div>
      <button class="edit-btn" onclick="editG(${g.id})" title="Editar">${eico()}</button>
      <button class="del" onclick="delG(${g.id})" title="Excluir">${dico()}</button>
    </div>`).join('');
}

/* ── CORRIDAS ── */
function addCorrida(evt){
  rip(evt,evt.currentTarget);
  const g=parseFloat(document.getElementById('ub-g')?.value||'0');
  const k=parseFloat(document.getElementById('ub-k')?.value||'0')||0;
  const o=document.getElementById('ub-o')?.value.trim()||'';
  if(isNaN(g)||g<=0){shake('ub-g');return;}
  D.corridas.push({id:Date.now(),ganho:g,km:k,obs:o,data:new Date().toLocaleDateString('pt-BR')});
  if(k>0&&D.config?.veiculo) D.config.veiculo.km=(D.config.veiculo.km||0)+k;
  log('corrida','+R$'+g.toFixed(2)+(k?' '+k+'km':''));
  save(); rndrC(); upM(); gerarInsights();
  ['ub-g','ub-k','ub-o'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  toast('Corrida registrada');
}
function delC(id){ D.corridas=D.corridas.filter(c=>c.id!==id); save(); rndrC(); upM(); }
function rndrC(){
  const el=document.getElementById('lista-c'); if(!el)return;
  if(!D.corridas.length){el.innerHTML='<div class="empty">Nenhuma corrida registrada.</div>';return;}
  el.innerHTML=[...D.corridas].reverse().map((c,i)=>`
    <div class="txcard" style="animation-delay:${i*.04}s">
      <div class="txico txg">${ico('Corrida')}</div>
      <div class="txbody">
        <div class="txdesc">Corrida${c.obs?' · '+c.obs:''}</div>
        <div class="txmeta">${c.km?c.km+'km · ':''}${c.data}</div>
      </div>
      <div class="txval vg">+R$${c.ganho.toFixed(2)}</div>
      <button class="del" onclick="delC(${c.id})">${dico()}</button>
    </div>`).join('');
  _upUber();
}

/* ── ABASTECIMENTO ── */
function addAbast(evt){
  rip(evt,evt.currentTarget);
  const v=parseFloat(document.getElementById('ab-v')?.value||'0');
  const l=parseFloat(document.getElementById('ab-l')?.value||'0')||0;
  const k=parseFloat(document.getElementById('ab-k')?.value||'0')||0;
  if(isNaN(v)||v<=0){shake('ab-v');return;}
  D.abast.push({id:Date.now(),val:v,litros:l,km:k,data:new Date().toLocaleDateString('pt-BR')});
  if(k>0&&D.config?.veiculo) D.config.veiculo.km=Math.max(D.config.veiculo.km||0,k);
  log('abast','-R$'+v.toFixed(2)+(l?' '+l+'L':''));
  save(); rndrA(); upM();
  ['ab-v','ab-l','ab-k'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  toast('Abastecimento registrado');
}
function delA(id){ D.abast=D.abast.filter(a=>a.id!==id); save(); rndrA(); upM(); }
function rndrA(){
  const el=document.getElementById('lista-a'); if(!el)return;
  if(!D.abast.length){el.innerHTML='<div class="empty">Nenhum abastecimento.</div>';return;}
  el.innerHTML=[...D.abast].reverse().map((a,i)=>`
    <div class="txcard" style="animation-delay:${i*.04}s">
      <div class="txico txr">${ico('Abastecimento')}</div>
      <div class="txbody">
        <div class="txdesc">Abastecimento</div>
        <div class="txmeta">${a.litros?a.litros+'L · ':''}${a.km?'km '+a.km+' · ':''}${a.data}</div>
      </div>
      <div class="txval vr">-R$${a.val.toFixed(2)}</div>
      <button class="del" onclick="delA(${a.id})">${dico()}</button>
    </div>`).join('');
}

/* ── UBER STATS ── */
function _upUber(){
  const gM=D.corridas.reduce((a,b)=>a+(b.ganho||0),0);
  const kM=D.corridas.reduce((a,b)=>a+(b.km||0),0);
  const cM=D.abast.reduce((a,b)=>a+(b.val||0),0);
  const lc=gM-cM, ck=kM>0?cM/kM:0;
  const hj=new Date().toLocaleDateString('pt-BR');
  const gh=D.corridas.filter(c=>c.data===hj).reduce((a,b)=>a+(b.ganho||0),0);
  const sEl=id=>document.getElementById(id);
  if(sEl('us-hj'))sEl('us-hj').textContent='R$'+gh.toFixed(2);
  if(sEl('us-km'))sEl('us-km').textContent=kM.toFixed(0)+' km';
  if(sEl('us-ck'))sEl('us-ck').textContent='R$'+ck.toFixed(2);
  const ulc=sEl('us-lc');
  if(ulc){ulc.textContent='R$'+lc.toFixed(2);ulc.className='usval '+(lc>=0?'vg':'vr');}
}

/* ── VEÍCULO INFO ── */
function rndrVei(){
  const el=document.getElementById('vinfo'); if(!el)return;
  const v=D.config?.veiculo;
  if(!v){el.innerHTML='<div class="empty">Nenhum veículo configurado.</div>';return;}
  const kmR=D.corridas.reduce((a,b)=>a+(b.km||0),0);
  const itv=v.oleo||2500;
  const kmMod=kmR%itv; const falta=Math.max(0,itv-kmMod);
  const oc=falta<300?'vr':falta<700?'va':'vg';
  const ah=falta<400?`<div class="ab ab-a" style="display:block;margin:var(--spx) 0 0">${D.usuario?.nome||'Você'}, troca de óleo próxima — ~${falta.toFixed(0)} km!</div>`:'';
  el.innerHTML=`<div class="ugrid">
    <div class="ustat"><div class="uslbl">Veículo</div><div class="usval">${v.tipo}</div><div class="ussub">${v.modelo||'—'}</div></div>
    <div class="ustat"><div class="uslbl">KM atual</div><div class="usval">${(v.km||0).toLocaleString('pt-BR')}</div></div>
    <div class="ustat"><div class="uslbl">Falta p/ óleo</div><div class="usval ${oc}">${falta.toFixed(0)} km</div><div class="ussub">${falta<300?'Urgente!':'A cada '+itv+'km'}</div></div>
    <div class="ustat"><div class="uslbl">Consumo</div><div class="usval">${v.consumo||35} km/L</div></div>
  </div>${ah}`;
}

/* ── UBER SUBTABS ── */
function uTab(i){
  [0,1,2].forEach(j=>{
    const p=document.getElementById('up'+j), b=document.getElementById('st'+j);
    if(p)p.style.display=j===i?'flex':'none';
    if(b)b.classList.toggle('on',j===i);
  });
  if(i===2) rndrVei();
}

window.ico=ico; window.dico=dico; window.eico=eico;
window.setTG=setTG; window.addGasto=addGasto; window.editG=editG; window.delG=delG;
window.setFiltroGasto=setFiltroGasto; window.setBuscaGasto=setBuscaGasto; window.rndrG=rndrG;
window.addCorrida=addCorrida; window.delC=delC; window.rndrC=rndrC;
window.addAbast=addAbast; window.delA=delA; window.rndrA=rndrA;
window.rndrVei=rndrVei; window.uTab=uTab;

/* ═══════════════════════════════════════
   ROTA DO LUCRO v2 — dashboard.js
   Métricas · Gráfico · Insights · IA
═══════════════════════════════════════ */
'use strict';

/* ── HELPERS DOM SEGUROS ── */
function $t(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}
function $h(id,v){const e=document.getElementById(id);if(e)e.innerHTML=v;}
function $c(id,v){const e=document.getElementById(id);if(e)e.style.cssText=v;}

/* ── ATUALIZAR MÉTRICAS ── */
function upM(){
  if(!document.getElementById('hs-num'))return;
  try{
    const {ent,sai,gU,cU,renda,saldo}=calcSaldo();
    const tP=D.dividas.reduce((a,b)=>a+(b.parcela||0),0);
    const tD=D.dividas.reduce((a,b)=>a+Math.max(0,(b.total||0)-(b.pago||0)),0);

    // Hero
    const hn=document.getElementById('hs-num');
    if(hn){
      hn.textContent=(saldo<0?'- ':'')+' R$ '+Math.abs(saldo).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
      hn.className='hero-num '+(saldo>=0?'pos':'neg');
      hn.classList.add('bump'); setTimeout(()=>hn.classList.remove('bump'),300);
    }
    $t('hs-div','R$ '+tD.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}));
    $t('p-ent','R$'+Math.round(renda).toLocaleString('pt-BR'));
    $t('p-sai','R$'+Math.round(sai+cU).toLocaleString('pt-BR'));
    $t('p-parc','R$'+Math.round(tP).toLocaleString('pt-BR'));
    $t('p-uber','R$'+Math.round(gU).toLocaleString('pt-BR'));
    $t('hg-gas','R$'+Math.round(sai).toLocaleString('pt-BR'));
    $t('hg-parc','R$'+Math.round(tP).toLocaleString('pt-BR'));
    $t('hg-uber','R$'+Math.round(gU).toLocaleString('pt-BR'));
    $t('hg-comb','R$'+Math.round(cU).toLocaleString('pt-BR'));
    $t('chart-val','R$'+Math.round(sai).toLocaleString('pt-BR'));

    // Score saúde
    let sc=50;
    const cR=renda>0?tP/renda:1;
    if(saldo>0)sc+=15; if(saldo<0)sc-=25;
    if(cR<0.3)sc+=15; else if(cR>0.7)sc-=20; else if(cR>0.5)sc-=10;
    if(!D.dividas.length)sc+=10; if(tD>renda*6)sc-=15;
    const mL=D.config?.metas?.limite||0;
    if(mL>0&&sai>mL)sc-=10;
    sc=Math.max(3,Math.min(100,sc));
    const sC=sc>=60?'var(--acc)':sc>=35?'var(--amb)':'var(--red)';
    const sL=sc>=60?'Boa':sc>=35?'Atenção':'Crítica';
    $c('hg-sbar','width:'+sc+'%;background:'+sC+';height:100%;border-radius:4px;transition:width .7s');
    const stxt=document.getElementById('hg-stxt');
    if(stxt){stxt.textContent=sL;stxt.style.color=sC;}

    // IA Score
    $c('ia-sf','width:'+sc+'%;background:'+sC);
    const isn=document.getElementById('ia-sn');
    if(isn){isn.textContent=sL;isn.style.color=sC;}

    // Alerta banner
    const nome=D.usuario?.nome||'Você';
    const ab=document.getElementById('ab');
    if(ab){
      if(saldo<0){ab.style.display='block';ab.className='ab ab-r';ab.textContent=nome+', suas saídas superaram as entradas em R$ '+Math.abs(saldo).toFixed(2)+' este mês.';}
      else if(mL>0&&sai>mL*0.85){ab.style.display='block';ab.className='ab ab-a';ab.textContent=nome+', você está perto do limite de gastos ('+Math.round(sai/mL*100)+'% usado).';}
      else if(saldo>0&&!D.dividas.length){ab.style.display='block';ab.className='ab ab-g';ab.textContent=nome+', você está no positivo! Continue assim.';}
      else{ab.style.display='none';}
    }

    // Uber stats
    _upUberStats(gU,cU);
  }catch(e){console.warn('upM:',e.message);}
}

function _upUberStats(gU,cU){
  if(!document.getElementById('us-hj'))return;
  const kM=D.corridas.reduce((a,b)=>a+(b.km||0),0);
  const lc=gU-cU, ck=kM>0?cU/kM:0;
  const hj=new Date().toLocaleDateString('pt-BR');
  const gh=D.corridas.filter(c=>c.data===hj).reduce((a,b)=>a+(b.ganho||0),0);
  $t('us-hj','R$'+gh.toFixed(2));
  $t('us-km',kM.toFixed(0)+' km');
  $t('us-ck','R$'+ck.toFixed(2));
  const ulc=document.getElementById('us-lc');
  if(ulc){ulc.textContent='R$'+lc.toFixed(2);ulc.className='usval '+(lc>=0?'vg':'vr');}
}

/* ── GRÁFICO ── */
function drawChart(){
  const cv=document.getElementById('chart-main'); if(!cv)return;
  try{
    const ctx=cv.getContext('2d');
    const dpr=window.devicePixelRatio||1;
    const w=cv.parentElement?.offsetWidth||300, h=90;
    cv.width=w*dpr; cv.height=h*dpr; ctx.scale(dpr,dpr); ctx.clearRect(0,0,w,h);
    const dias=31, hj=new Date().getDate();
    const acc=new Array(dias).fill(0), prev=new Array(dias).fill(0);
    D.gastos.filter(g=>g.tipo==='g').forEach(g=>{
      const d=parseInt((g.data||'').split('/')[0])-1;
      if(d>=0&&d<dias) acc[d]+=(g.val||0);
    });
    for(let i=0;i<dias;i++) prev[i]=acc[i]*(0.8+Math.random()*.4);
    for(let i=1;i<dias;i++){acc[i]+=acc[i-1];prev[i]+=prev[i-1];}
    const mx=Math.max(...acc.slice(0,hj),...prev.slice(0,hj),100);
    const px=i=>(i/(Math.max(hj-1,1)))*(w-24)+12;
    const py=v=>h-8-(v/mx)*(h-20);
    const ac=getComputedStyle(document.documentElement).getPropertyValue('--acc').trim()||'#4ade80';
    const mc=getComputedStyle(document.documentElement).getPropertyValue('--mu').trim()||'#505050';
    // Grade
    ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1;
    for(let i=0;i<3;i++){const y=10+(h-20)*i/2;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    // Área
    const gr=ctx.createLinearGradient(0,0,0,h);
    gr.addColorStop(0,'rgba(74,222,128,.15)'); gr.addColorStop(1,'rgba(74,222,128,0)');
    ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(px(0),h);
    for(let i=0;i<hj;i++) ctx.lineTo(px(i),py(acc[i]));
    ctx.lineTo(px(hj-1),h); ctx.closePath(); ctx.fill();
    // Linha anterior
    ctx.strokeStyle=mc; ctx.lineWidth=1.5; ctx.setLineDash([3,3]);
    ctx.beginPath();
    for(let i=0;i<hj;i++){i===0?ctx.moveTo(px(i),py(prev[i])):ctx.lineTo(px(i),py(prev[i]));}
    ctx.stroke(); ctx.setLineDash([]);
    // Linha atual
    ctx.strokeStyle=ac; ctx.lineWidth=2; ctx.beginPath();
    for(let i=0;i<hj;i++){i===0?ctx.moveTo(px(i),py(acc[i])):ctx.lineTo(px(i),py(acc[i]));}
    ctx.stroke();
    // Ponto
    if(hj>0){
      ctx.fillStyle=ac; ctx.beginPath(); ctx.arc(px(hj-1),py(acc[hj-1]),4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(px(hj-1),py(acc[hj-1]),2,0,Math.PI*2); ctx.fill();
    }
  }catch(e){console.warn('drawChart:',e.message);}
}

/* ── INSIGHTS ── */
function gerarInsights(){
  if(!document.getElementById('ins-list'))return;
  try{
    const nome=D.usuario?.nome||'Você';
    const {ent,sai,gU,cU,renda,saldo}=calcSaldo();
    const hj=new Date().getDate(), hjS=new Date().toLocaleDateString('pt-BR');
    const catMap={};
    D.gastos.filter(g=>g.tipo==='g').forEach(g=>{catMap[g.cat]=(catMap[g.cat]||0)+(g.val||0);});
    const ct=Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
    const ins=[];

    if(ct.length&&renda>0&&ct[0][1]>renda*0.35)
      ins.push({t:'danger',msg:`<b>${nome}</b>, "${ct[0][0]}" consumiu <b>R$${ct[0][1].toFixed(2)}</b> — ${Math.round(ct[0][1]/renda*100)}% da renda!`});

    D.dividas.forEach(d=>{
      const diff=d.dia-hj;
      if(diff>=0&&diff<=3) ins.push({t:'warn',msg:`<b>${nome}</b>, parcela de <b>${d.nome}</b> vence ${diff===0?'hoje':'em '+diff+'d'} (R$${(d.parcela||0).toFixed(2)}).`});
    });

    const v=D.config?.veiculo;
    if(v&&v.tipo!=='Nenhum'){
      const kmR=D.corridas.reduce((a,b)=>a+(b.km||0),0);
      const falta=Math.max(0,(v.oleo||2500)-(kmR%(v.oleo||2500)));
      if(falta<400) ins.push({t:'warn',msg:`<b>${nome}</b>, troca de óleo próxima — ~${falta.toFixed(0)} km restantes.`});
    }

    if(!D.corridas.filter(c=>c.data===hjS).length&&D.corridas.length>0)
      ins.push({t:'info',msg:`<b>${nome}</b>, você ainda não registrou corridas hoje.`});

    const mE=D.config?.metas?.economia||0;
    if(mE>0&&saldo>=mE) ins.push({t:'info',msg:`<b>${nome}</b>, meta de economia atingida! R$${saldo.toFixed(2)} no positivo.`});

    // Backup
    const diasSemBackup=D.backup?.ultimo?Math.floor((Date.now()-D.backup.ultimo)/(1000*60*60*24)):999;
    if(diasSemBackup>7) ins.push({t:'warn',msg:`<b>${nome}</b>, seu último backup foi há ${diasSemBackup} dias. Faça um backup!`});

    const tL=document.getElementById('ins-title'), lE=document.getElementById('ins-list');
    if(!ins.length){if(lE)lE.innerHTML='';if(tL)tL.style.display='none';return;}
    if(tL) tL.style.display='block';
    const iI='<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
          iW='<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/>',
          iD='<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>';
    if(lE) lE.innerHTML=ins.map((ins2,idx)=>`
      <div class="ins-card" style="animation-delay:${idx*.06}s">
        <div class="ins-ico ${ins2.t==='warn'?'warn':ins2.t==='danger'?'danger':''}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            ${ins2.t==='warn'?iW:ins2.t==='danger'?iD:iI}
          </svg>
        </div>
        <div><div class="ins-txt">${ins2.msg}</div><div class="ins-time">agora</div></div>
      </div>`).join('');

    // Notif badge
    const dot=document.getElementById('nb-dot-home');
    if(dot) dot.classList.toggle('on', ins.some(i=>i.t==='danger'||i.t==='warn'));
  }catch(e){console.warn('gerarInsights:',e.message);}
}

/* ── ANÁLISE IA ── */
function gerarIA(){
  if(!document.getElementById('ia-area'))return;
  try{
    const nome=D.usuario?.nome||'Você';
    const ar=document.getElementById('ia-area');
    const {ent,sai,gU,cU,renda,saldo}=calcSaldo();
    const tD=D.dividas.reduce((a,b)=>a+Math.max(0,(b.total||0)-(b.pago||0)),0);
    const tP=D.dividas.reduce((a,b)=>a+(b.parcela||0),0);
    const cR=renda>0?tP/renda:0;

    if(!D.gastos.length&&!D.corridas.length&&!D.dividas.length){
      ar.innerHTML='<div class="empty">Adicione gastos e dívidas para sua análise.</div>'; return;
    }

    const catM={};
    D.gastos.filter(g=>g.tipo==='g').forEach(g=>{catM[g.cat]=(catM[g.cat]||0)+(g.val||0);});
    const catS=Object.entries(catM).sort((a,b)=>b[1]-a[1]);
    const cores=['var(--red)','var(--amb)','var(--blu)','#a78bfa','var(--acc)','#fb923c'];

    let html='';
    // Situação
    let sit='';
    if(saldo<0) sit=`<p><span class="neg">${nome}, atenção.</span> Saídas superam entradas em <span class="neg">R$${Math.abs(saldo).toFixed(2)}</span>.</p>`;
    else if(cR>0.5) sit=`<p>Saldo positivo <span class="pos">R$${saldo.toFixed(2)}</span>, mas parcelas comprometem <span class="neg">${Math.round(cR*100)}%</span> da renda.</p>`;
    else sit=`<p>${nome}, saldo positivo de <span class="pos">R$${saldo.toFixed(2)}</span>. ${D.dividas.length?'Continue pagando as dívidas.':'Sem dívidas!'}</p>`;
    if(renda>0) sit+=`<p>Renda: <span class="pos">R$${renda.toFixed(2)}</span> · Gastos: <span class="neg">R$${(sai+cU).toFixed(2)}</span></p>`;
    html+=`<div class="ia-card"><div class="ia-t">Situação geral</div><div class="ia-b">${sit}</div></div>`;

    if(catS.length){
      const mx=catS[0][1];
      html+=`<div class="ia-card"><div class="ia-t">Distribuição de gastos</div>${catS.map(([c,v],i)=>`
        <div class="grow"><div class="glbl">${c}</div>
        <div class="gbg"><div class="gfill" style="width:${Math.round(v/mx*100)}%;background:${cores[i%cores.length]}"></div></div>
        <div class="gval">R$${Math.round(v)}</div></div>`).join('')}</div>`;
    }

    if(D.corridas.length){
      const km=D.corridas.reduce((a,b)=>a+(b.km||0),0), lucro=gU-cU, lkm=km>0?(lucro/km).toFixed(2):0;
      html+=`<div class="ia-card"><div class="ia-t">Análise Uber</div><div class="ia-b">
        <p>Bruto: <span class="pos">R$${gU.toFixed(2)}</span> · Combustível: <span class="neg">R$${cU.toFixed(2)}</span></p>
        <p>Lucro real: <span class="${lucro>=0?'pos':'neg'}">R$${lucro.toFixed(2)}</span>${km>0?' · R$'+lkm+'/km':''}</p>
        ${cU>gU*0.35?'<p><strong>Atenção:</strong> combustível acima de 35% da receita.</p>':''}
      </div></div>`;
    }

    if(D.dividas.length){
      const hjd=new Date().getDate();
      const sorted=[...D.dividas].filter(d=>Math.max(0,(d.total||0)-(d.pago||0))>0)
        .sort((a,b)=>{const ua=Math.abs(a.dia-hjd)<=5?-9999:0,ub=Math.abs(b.dia-hjd)<=5?-9999:0;
          return(ua-ub)||(Math.max(0,a.total-a.pago)-Math.max(0,b.total-b.pago));});
      html+=`<div class="ia-card"><div class="ia-t">Bola de Neve — Prioridade</div>${sorted.slice(0,5).map((d,i)=>{
        const r=Math.max(0,(d.total||0)-(d.pago||0)), urg=Math.abs(d.dia-hjd)<=5;
        return`<div class="pitem" style="animation-delay:${i*.05}s">
          <div class="pnum p${Math.min(i+1,3)}">${i+1}</div>
          <div class="pbody"><strong>${d.nome}</strong>${urg?' — urgente':''}<br>
          <span style="font-size:var(--fxs);color:var(--mu)">${d.tipo} · dia ${d.dia}</span></div>
          <div class="pval">R$${r.toFixed(2)}</div></div>`;}).join('')}</div>`;
    }

    const dicas=[];
    if(saldo<0) dicas.push('Corte gastos não-essenciais agora. Identifique os maiores e reduza.');
    if(cR>0.5)  dicas.push('Parcelas comprometem '+Math.round(cR*100)+'% da renda. Tente renegociar prazos.');
    if(catS.length&&renda>0&&catS[0][1]>renda*0.3) dicas.push('"'+catS[0][0]+'" é seu maior gasto. Avalie se há como reduzir.');
    if(saldo>0&&tP<saldo) dicas.push('R$'+(saldo-tP).toFixed(2)+' livres após parcelas. Aplique na menor dívida.');
    if(D.dividas.some(d=>d.tipo==='Cheque esp.')) dicas.push('Cheque especial ~8%/mês. Prioridade máxima!');
    if(!D.backup?.ultimo||(Date.now()-D.backup.ultimo)>7*24*60*60*1000) dicas.push('Faça um backup dos seus dados regularmente para não perder nada!');
    if(dicas.length) html+=`<div class="ia-card"><div class="ia-t">Recomendações</div><div class="ia-b">${dicas.map((d,i)=>'<p>'+(i+1)+'. '+d+'</p>').join('')}</div></div>`;

    if(D.dividas.length&&renda>0){
      const mT=D.dividas.reduce((t,d)=>{const r=Math.max(0,(d.total||0)-(d.pago||0));return t+(d.parcela>0?Math.ceil(r/d.parcela):12);},0);
      const extra=Math.max(0,saldo-tP);
      html+=`<div class="ia-card"><div class="ia-t">Projeção</div><div class="ia-b">
        <p>No ritmo atual, quitação em ~<strong>${mT} meses</strong>.</p>
        ${extra>0?`<p>Com <span class="pos">R$${extra.toFixed(2)}</span> livres mensais, aplique na menor dívida para reduzir o prazo.</p>`:''}
      </div></div>`;
    }
    ar.innerHTML=html;
  }catch(e){console.warn('gerarIA:',e.message);}
}

/* ── SIMULADOR ── */
function openSim(){const m=document.getElementById('modal-sim');if(m)m.classList.add('on');}
function closeSim(){const m=document.getElementById('modal-sim');if(m)m.classList.remove('on');}
function doSim(evt){
  rip(evt,evt.currentTarget);
  const val=parseFloat(document.getElementById('sim-v')?.value||'0');
  if(!val||isNaN(val)){shake('sim-v');return;}
  const {ent,sai,gU,cU,renda,saldo}=calcSaldo();
  const tP=D.dividas.reduce((a,b)=>a+(b.parcela||0),0);
  const sN=saldo-val, cA=renda>0?Math.round((tP/renda)*100):0;
  const cN=renda>0?Math.round(((tP+val)/renda)*100):0, ok=sN>0&&cN<60;
  const el=document.getElementById('sim-res'); if(!el)return;
  el.style.display='block';
  el.innerHTML=`
    <div class="sr-row"><span>Saldo atual</span><span class="${saldo>=0?'srok':'srbad'}">R$${saldo.toFixed(2)}</span></div>
    <div class="sr-row"><span>Novo compromisso</span><span class="srbad">-R$${val.toFixed(2)}/mês</span></div>
    <div class="sr-row"><span>Novo saldo</span><span class="${sN>=0?'srok':'srbad'}">R$${sN.toFixed(2)}</span></div>
    <div class="sr-row"><span>Comprom. renda</span><span class="${cN>50?'srbad':'srok'}">${cA}% → ${cN}%</span></div>
    <div class="sr-row"><span style="font-weight:700">Viável?</span><span class="${ok?'srok':'srbad'}" style="font-size:var(--fmd)">${ok?'Sim, dentro do limite':'Não recomendado'}</span></div>
    ${!ok?`<p style="font-size:var(--fxs);color:var(--red);margin-top:8px">${D.usuario?.nome||'Você'}, este compromisso comprometeria demais sua renda.</p>`:''}`;
}

window.$t=$t; window.$h=$h; window.$c=$c;
window.upM=upM; window.drawChart=drawChart;
window.gerarInsights=gerarInsights; window.gerarIA=gerarIA;
window.openSim=openSim; window.closeSim=closeSim; window.doSim=doSim;

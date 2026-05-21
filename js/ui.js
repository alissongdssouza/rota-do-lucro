/* ═══════════════════════════════════════
   ROTA DO LUCRO v2 — ui.js
   Navegação · Configurações · Utils · Boot
═══════════════════════════════════════ */
'use strict';

/* ── RIPPLE ── */
function rip(e,el){
  if(!e?.clientX||!el)return;
  const r=el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
  const d=document.createElement('span');
  d.className='rip-dot';
  d.style.cssText='width:60px;height:60px;left:'+(x-30)+'px;top:'+(y-30)+'px;';
  el.appendChild(d); setTimeout(()=>d.remove(),550);
}

/* ── SHAKE ── */
function shake(id){
  const el=document.getElementById(id); if(!el)return;
  el.style.animation='shake .4s ease'; el.style.borderColor='var(--red)';
  setTimeout(()=>{el.style.animation='';el.style.borderColor='';},500);
}

/* ── TOAST ── */
let _tt=null;
function toast(msg,dur=2500){
  const el=document.getElementById('toast'); if(!el)return;
  el.textContent=msg; el.classList.add('on');
  clearTimeout(_tt); _tt=setTimeout(()=>el.classList.remove('on'),dur);
}

/* ── MODAL CONFIRMAÇÃO ── */
let _mcCb=null;
function showConfirm(title,msg,okLabel,cb,danger=true){
  const titleEl=document.getElementById('mc-title');
  const msgEl  =document.getElementById('mc-msg');
  const okBtn  =document.getElementById('mc-ok');
  const modal  =document.getElementById('modal-confirm');
  if(!titleEl||!msgEl||!okBtn||!modal){
    if(window.confirm(title+'\n\n'+msg)){if(cb)cb();}
    return;
  }
  titleEl.textContent=title; msgEl.textContent=msg;
  okBtn.textContent=okLabel||'Confirmar';
  okBtn.style.background=danger?'var(--red)':'var(--acc)';
  okBtn.style.color=danger?'#fff':'#000';
  okBtn.onclick=()=>{mcCancel();if(cb)cb();};
  modal.classList.add('on'); _mcCb=cb;
}
function mcCancel(){
  const m=document.getElementById('modal-confirm'); if(m)m.classList.remove('on'); _mcCb=null;
}

/* ── TELAS ── */
function showS(id){
  document.querySelectorAll('.screen').forEach(s=>{
    s.classList.toggle('hidden',s.id!==id);
    s.classList.remove('slide-back');
  });
}
function goConfig(){
  loadCfg();
  const cfg=document.getElementById('s-cfg'); if(cfg)cfg.classList.remove('hidden');
  const main=document.getElementById('s-main'); if(main)main.classList.add('slide-back');
}
function backMain(){
  const cfg=document.getElementById('s-cfg'); if(cfg)cfg.classList.add('hidden');
  const main=document.getElementById('s-main'); if(main){main.classList.remove('hidden');main.classList.remove('slide-back');}
}

/* ── NAVEGAÇÃO PAINÉIS ── */
const _PM={home:'ip-home',gastos:'ip-gastos',uber:'ip-uber',div:'ip-div',ia:'ip-ia',metas:'ip-metas',relatorio:'ip-relatorio',backup:'ip-backup'};
let _curP='home';

function showP(name){
  Object.entries(_PM).forEach(([k,id])=>{ const el=document.getElementById(id); if(el)el.classList.toggle('on',k===name); });
  // Nav bar
  const temVei=D.config?.veiculo!=null;
  const navNames=['home','gastos',...(temVei?['uber']:[]),'div','ia'];
  document.querySelectorAll('.nb').forEach((b,i)=>{
    if(b.style.display!=='none') b.classList.toggle('on',navNames[i]===name);
  });
  _curP=name;
  // Ações por painel
  if(name==='ia')        setTimeout(()=>{ gerarIA(); },50);
  if(name==='uber')      uTab(0);
  if(name==='metas')     rndrMetas();
  if(name==='relatorio') rndrRelatorio();
  if(name==='backup')    rndrBackup();
  // Renovar sessão
  renovarSessao(); save();
}

/* ── INICIAR APP ── */
function startApp(){
  showS('s-main');
  const u=D.usuario, h=new Date().getHours();
  const saudEl=document.getElementById('saud');
  if(saudEl)saudEl.textContent=h<12?'Bom dia,':h<18?'Boa tarde,':'Boa noite,';
  const nomeEl=document.getElementById('mh-nome');
  if(nomeEl)nomeEl.innerHTML='<span>'+(u?.nome||'')+'</span>';
  if(u?.avatar) setAv(u.avatar);

  const temVei=D.config?.veiculo!=null;
  const els={
    'nb-uber':temVei, 'qb-corrida':temVei, 'qb-abast':temVei,
    'pill-uber':temVei, 'hc-uber':temVei, 'hc-comb':temVei
  };
  Object.entries(els).forEach(([id,show])=>{
    const el=document.getElementById(id);
    if(el)el.style.display=show?(el.classList.contains('nb')?'flex':'block'):'none';
  });

  // Sessão
  D.sessao={logado:true,expiraEm:Date.now()+30*60*1000,falhas:0,bloqueadoAte:null};

  try{ renderAll(); }catch(e){ console.warn('renderAll:',e); }
  setTimeout(()=>{ try{gerarInsights();}catch(e){} },100);
  setTimeout(()=>{ try{gerarIA();}catch(e){} },200);
  setTimeout(()=>{ try{drawChart();}catch(e){} },300);
  if(D.prefs?.updates&&D.prefs?.updUrl) setTimeout(()=>checkUpdate(true),5000);
  if(D.prefs?.notif) setTimeout(agendarNotificacoes,3000);
}

function setAv(src){
  const m=document.getElementById('av-mini'); if(m)m.innerHTML='<img src="'+src+'" alt="av">';
}

function renderAll(){
  rndrG(); rndrD(); rndrC(); rndrA(); upM();
}

/* ── CONFIGURAÇÕES ── */
function loadCfg(){
  const u=D.usuario, c=D.config;
  const el=id=>document.getElementById(id);
  if(u){
    if(el('cfg-nome'))el('cfg-nome').value=u.nome||'';
    if(u.avatar&&el('cfg-av'))el('cfg-av').innerHTML='<img src="'+u.avatar+'" alt="av">';
    // PIN status
    const pinLbl=el('cfg-pin-label'), pinBtn=el('cfg-pin-btn');
    if(pinLbl)pinLbl.textContent=u.pinHash?'Configurado':'Não configurado';
    if(pinBtn){
      if(u.pinHash){pinBtn.textContent='Remover PIN';pinBtn.onclick=removerPin;}
      else{pinBtn.textContent='Configurar PIN';pinBtn.onclick=()=>showPin('set');}
    }
  }
  if(c?.veiculo){
    if(el('cv-t'))el('cv-t').value=c.veiculo.tipo||'Moto';
    if(el('cv-m'))el('cv-m').value=c.veiculo.modelo||'';
    if(el('cv-k'))el('cv-k').value=c.veiculo.km||'';
    if(el('cv-c'))el('cv-c').value=c.veiculo.consumo||'';
    if(el('cv-o'))el('cv-o').value=c.veiculo.oleo||'';
  }
  if(c?.metas){
    if(el('cm-e'))el('cm-e').value=c.metas.economia||'';
    if(el('cm-l'))el('cm-l').value=c.metas.limite||'';
  }
  const ap=D.ap||{};
  if(el('tg-dark'))el('tg-dark').checked=ap.tema!=='light';
  document.querySelectorAll('.cdot').forEach(d=>d.classList.toggle('on',d.dataset.acc===(ap.acc||'verde')));
  document.querySelectorAll('.fopt').forEach(d=>d.classList.toggle('on',d.dataset.font===(ap.font||'default')));
  const pr=D.prefs||{};
  if(el('tg-notif'))el('tg-notif').checked=pr.notif===true;
  if(el('tg-upd'))  el('tg-upd').checked=pr.updates!==false;
  if(el('upd-url')) el('upd-url').value=pr.updUrl||'';
  if(D.backup?.lastCheck&&el('upd-lbl'))
    el('upd-lbl').textContent='Verificado: '+new Date(D.backup.lastCheck).toLocaleString('pt-BR');
  cfgSelVei(c?.veiculo?'sim':'nao');
}

function cfgSelVei(v){
  const sim=document.getElementById('cfg-vt-sim'), nao=document.getElementById('cfg-vt-nao');
  if(sim)sim.classList.toggle('sel',v==='sim');
  if(nao)nao.classList.toggle('sel',v==='nao');
  const fields=document.getElementById('cfg-vei-fields');
  if(fields)fields.style.display=v==='sim'?'block':'none';
}

function updAv(inp){
  const f=inp.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=e=>{
    D.usuario.avatar=e.target.result; save(); setAv(e.target.result);
    const av=document.getElementById('cfg-av'); if(av)av.innerHTML='<img src="'+e.target.result+'" alt="av">';
  };
  r.readAsDataURL(f);
}
function updNome(v){
  if(!v.trim())return; D.usuario.nome=v.trim(); save();
  const el=document.getElementById('mh-nome'); if(el)el.innerHTML='<span>'+v.trim()+'</span>';
  toast('Nome atualizado');
}
function updSenha(v){ if(!v)return; D.usuario.senha=v; save(); toast('Senha atualizada'); }

function saveVei(){
  if(!D.config)D.config={fixas:[],metas:{}};
  const el=id=>document.getElementById(id);
  if(el('cfg-vt-sim')?.classList.contains('sel')){
    D.config.veiculo={tipo:el('cv-t')?.value||'Moto',modelo:el('cv-m')?.value||'',km:parseFloat(el('cv-k')?.value||'0')||0,consumo:parseFloat(el('cv-c')?.value||'35')||35,oleo:parseFloat(el('cv-o')?.value||'2500')||2500};
    D.prefs.temVeiculo=true;
  }else{D.config.veiculo=null;D.prefs.temVeiculo=false;}
  log('config','Veículo atualizado'); save(); startApp(); toast('Veículo salvo');
}

function saveMetas(){
  if(!D.config)D.config={fixas:[],veiculo:null};
  const el=id=>document.getElementById(id);
  D.config.metas={economia:parseFloat(el('cm-e')?.value||'0')||0,limite:parseFloat(el('cm-l')?.value||'0')||0};
  log('config','Metas atualizadas'); save(); upM(); toast('Metas salvas');
}

function savePref(){
  const el=id=>document.getElementById(id);
  D.prefs.updates=el('tg-upd')?.checked!==false;
  D.prefs.updUrl=el('upd-url')?.value.trim()||'';
  save();
}

/* ── APARÊNCIA ── */
function togTema(dark){ D.ap.tema=dark?'dark':'light'; document.documentElement.setAttribute('data-theme',dark?'':'light'); save(); }
function setAcc(acc,el){ D.ap.acc=acc; document.documentElement.setAttribute('data-acc',acc); document.querySelectorAll('.cdot').forEach(d=>d.classList.toggle('on',d===el)); save(); setTimeout(drawChart,80); }
function setFont(font,el){ D.ap.font=font; document.documentElement.setAttribute('data-font',font==='default'?'':font); document.querySelectorAll('.fopt').forEach(d=>d.classList.toggle('on',d===el)); save(); }

function apAp(){
  const ap=D.ap||{};
  if(ap.tema==='light')document.documentElement.setAttribute('data-theme','light');
  document.documentElement.setAttribute('data-acc',ap.acc||'verde');
  if(ap.font&&ap.font!=='default')document.documentElement.setAttribute('data-font',ap.font);
}

/* ── BOOT ── */
window.addEventListener('DOMContentLoaded',()=>{
  load(); apAp(); validar();

  // Splash
  setTimeout(()=>{
    const sp=document.getElementById('s-splash');
    if(sp){sp.classList.add('exit');setTimeout(()=>sp.classList.add('hidden'),500);}
    if(!D.usuario){ showS('s-ob'); }
    else if(!D.config){ showS('s-setup'); }
    else if(D.usuario.pinHash&&!sessaoOk()){ showPin('login'); }
    else{ startApp(); }
  },2200);

  // Resize chart
  window.addEventListener('resize',()=>{ if(_curP==='home')setTimeout(drawChart,50); });

  // Renovar sessão em interação
  document.addEventListener('touchstart',renovarSessao,{passive:true});
  document.addEventListener('click',renovarSessao);

  // Service Worker
  if('serviceWorker'in navigator){
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  }
});

window.rip=rip; window.shake=shake; window.toast=toast;
window.showConfirm=showConfirm; window.mcCancel=mcCancel;
window.showS=showS; window.goConfig=goConfig; window.backMain=backMain;
window.showP=showP; window.startApp=startApp; window.renderAll=renderAll;
window.loadCfg=loadCfg; window.cfgSelVei=cfgSelVei;
window.updAv=updAv; window.updNome=updNome; window.updSenha=updSenha;
window.saveVei=saveVei; window.saveMetas=saveMetas; window.savePref=savePref;
window.togTema=togTema; window.setAcc=setAcc; window.setFont=setFont; window.apAp=apAp;

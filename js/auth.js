/* ═══════════════════════════════════════
   ROTA DO LUCRO v2 — auth.js
   PIN · Sessão · Onboarding · Wizard
═══════════════════════════════════════ */
'use strict';

let _pinBuf = '';
let _pinMode = 'login';   // 'login' | 'set' | 'confirm'
let _pinNew  = '';
let _avB64   = null;
let _fixasT  = [];
let _selPerf = 'outro';
let _temVei  = 'nao';
let _vTipo   = 'Moto';
let _wPage   = 0;

/* ── PIN HASH ── */
function hashPin(pin){
  let h=0; const s=pin+'rdl2025';
  for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}
  return Math.abs(h).toString(36);
}

/* ── SESSÃO ── */
function sessaoOk(){
  if(!D.usuario?.pinHash) return true;
  if(!D.sessao?.logado)  return false;
  if(D.sessao.expiraEm && Date.now()>D.sessao.expiraEm){
    D.sessao.logado=false; save(); return false;
  }
  return true;
}
function renovarSessao(){ if(D.sessao) D.sessao.expiraEm=Date.now()+30*60*1000; }

/* ── VERIFICAR PIN ── */
function checkPin(pin){
  if(D.sessao?.bloqueadoAte && Date.now()<D.sessao.bloqueadoAte){
    const s=Math.ceil((D.sessao.bloqueadoAte-Date.now())/1000);
    return {ok:false,bloqueado:true,restante:s};
  }
  const ok = hashPin(pin)===D.usuario.pinHash;
  if(ok){
    D.sessao={logado:true,expiraEm:Date.now()+30*60*1000,falhas:0,bloqueadoAte:null};
    save(); return {ok:true};
  }
  D.sessao.falhas=(D.sessao.falhas||0)+1;
  if(D.sessao.falhas>=5) D.sessao.bloqueadoAte=Date.now()+2*60*1000;
  save(); return {ok:false,falhas:D.sessao.falhas};
}

/* ── TELA PIN ── */
function showPin(mode='login'){
  _pinBuf=''; _pinMode=mode;
  _renderPinDots();
  const el=document.getElementById('pin-error'); if(el) el.textContent='';
  const sub=document.getElementById('pin-sub');
  if(sub){
    if(mode==='login')   sub.textContent='Digite seu PIN para continuar';
    if(mode==='set')     sub.textContent='Crie um PIN de 4 a 6 dígitos';
    if(mode==='confirm') sub.textContent='Confirme seu novo PIN';
  }
  showS('s-pin');
}

function pinPress(v){
  if(v==='del'){ _pinBuf=_pinBuf.slice(0,-1); }
  else if(v==='ok'){ _pinSubmit(); return; }
  else if(_pinBuf.length<6){ _pinBuf+=v; }
  _renderPinDots();
  if(_pinBuf.length>=4 && _pinMode==='login') setTimeout(_pinSubmit,120);
  if(_pinBuf.length>=4 && (_pinMode==='set'||_pinMode==='confirm')) {/* aguarda ok */}
}

function _renderPinDots(){
  for(let i=0;i<6;i++){
    const el=document.getElementById('pd'+i);
    if(!el) continue;
    el.classList.toggle('filled',i<_pinBuf.length);
    el.classList.remove('err');
  }
}

function _pinError(msg){
  const el=document.getElementById('pin-error'); if(el) el.textContent=msg;
  for(let i=0;i<6;i++){const el=document.getElementById('pd'+i);if(el)el.classList.add('err');}
  if(navigator.vibrate) navigator.vibrate([100,50,100]);
  setTimeout(()=>{ _pinBuf=''; _renderPinDots(); const e=document.getElementById('pin-error');if(e)e.textContent=''; },800);
}

function _pinSubmit(){
  if(_pinBuf.length<4){ _pinError('Mínimo 4 dígitos'); return; }
  if(_pinMode==='login'){
    const r=checkPin(_pinBuf);
    if(r.bloqueado){ document.getElementById('pin-error').textContent=`Bloqueado por ${r.restante}s. Tente novamente.`; _pinBuf=''; _renderPinDots(); return; }
    if(r.ok){ startApp(); }
    else{ _pinError(`PIN incorreto (${r.falhas}/5)`); }
  }else if(_pinMode==='set'){
    _pinNew=_pinBuf; _pinBuf=''; showPin('confirm');
  }else if(_pinMode==='confirm'){
    if(_pinBuf===_pinNew){
      D.usuario.pinHash=hashPin(_pinBuf); save();
      toast('PIN configurado com sucesso!');
      startApp();
    }else{ _pinNew=''; _pinBuf=''; _pinError('PINs não conferem. Tente novamente.'); showPin('set'); }
  }
}

function removerPin(){
  showConfirm('Remover PIN','O app ficará sem proteção por PIN. Continuar?','Remover',()=>{
    if(D.usuario) delete D.usuario.pinHash;
    D.sessao={logado:true,expiraEm:null,falhas:0,bloqueadoAte:null};
    save(); toast('PIN removido');
    const el=document.getElementById('cfg-pin-label'); if(el) el.textContent='Não configurado';
    const bt=document.getElementById('cfg-pin-btn');
    if(bt){bt.textContent='Configurar PIN';bt.onclick=()=>showPin('set');}
  });
}

/* ── ONBOARDING TABS ── */
function obTab(t){
  document.querySelectorAll('.ob-tab').forEach((b,i)=>b.classList.toggle('on',i===(t==='login'?0:1)));
  const lg=document.getElementById('ob-login'), cd=document.getElementById('ob-cad');
  if(lg) lg.style.display=t==='login'?'flex':'none';
  if(cd) cd.style.display=t==='cad' ?'flex':'none';
}

/* ── AVATAR ── */
function prevAv(inp){
  const f=inp.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=e=>{ _avB64=e.target.result; const av=document.getElementById('av-prev'); if(av) av.innerHTML='<img src="'+e.target.result+'" alt="av">'; };
  r.readAsDataURL(f);
}

/* ── SENHA ── */
function toggleEye(id){
  const el=document.getElementById(id); if(!el)return;
  el.type=el.type==='password'?'text':'password';
}
function chkPw(){
  const pw=document.getElementById('cp')?.value||'';
  const bar=document.getElementById('pw-bar'), hint=document.getElementById('pw-hint');
  if(!bar||!hint)return;
  let s=0;
  if(pw.length>=4)s++; if(pw.length>=8)s++; if(/[0-9]/.test(pw))s++;
  if(/[!@#$%^&*]/.test(pw))s++; if(pw.length>=12)s++;
  const ws=['0%','25%','45%','70%','85%','100%'],cs=['','#f87171','#fb923c','#fbbf24','#4ade80','#22c55e'],ms=['','Muito fraca','Fraca','Média','Boa','Forte'];
  bar.style.width=ws[s]; bar.style.background=cs[s];
  hint.textContent=pw.length?ms[s]:''; hint.style.color=cs[s];
  chkMatch();
}
function chkMatch(){
  const p1=document.getElementById('cp')?.value||'', p2=document.getElementById('cp2')?.value||'';
  const h=document.getElementById('match-hint'); if(!h||!p2)return;
  if(p1===p2){h.textContent='Senhas coincidem';h.style.color='var(--acc)';const el=document.getElementById('cp2');if(el)el.className='ob-inp he ok';}
  else{h.textContent='Senhas não coincidem';h.style.color='var(--red)';const el=document.getElementById('cp2');if(el)el.className='ob-inp he err';}
}

/* ── CADASTRO / LOGIN ── */
function doCad(e){
  rip(e,e.currentTarget);
  const n=document.getElementById('cn')?.value.trim()||'';
  const p=document.getElementById('cp')?.value||'';
  const p2=document.getElementById('cp2')?.value||'';
  if(!n){shake('cn');toast('Informe seu nome');return;}
  if(p.length<4){shake('cp');toast('Senha precisa ter ao menos 4 caracteres');return;}
  if(p!==p2){shake('cp2');toast('As senhas não coincidem');return;}
  D.usuario={nome:n,senha:p,avatar:_avB64,criadoEm:new Date().toISOString()};
  save(); showS('s-setup');
}

function doLogin(e){
  rip(e,e.currentTarget);
  const n=document.getElementById('ln')?.value.trim()||'';
  const p=document.getElementById('lp')?.value||'';
  if(!D.usuario){toast('Crie uma conta primeiro');obTab('cad');return;}
  if(D.usuario.nome.toLowerCase()!==n.toLowerCase()||D.usuario.senha!==p){
    shake('lp');toast('Nome ou senha incorretos');return;
  }
  // Verificar PIN
  if(D.usuario.pinHash){ showPin('login'); }
  else{ D.config?startApp():showS('s-setup'); }
}

function doLogout(){
  showConfirm('Sair da conta','Seus dados ficam salvos no dispositivo. Pode entrar novamente quando quiser.','Sair',()=>{
    D.sessao={logado:false,expiraEm:null,falhas:0,bloqueadoAte:null}; save();
    const s=document.getElementById('s-cfg'); if(s) s.classList.add('hidden');
    const m=document.getElementById('s-main'); if(m){m.classList.remove('slide-back');m.classList.add('hidden');}
    showS('s-ob');
    const ln=document.getElementById('ln'); if(ln) ln.value='';
    const lp=document.getElementById('lp'); if(lp) lp.value='';
    obTab('login');
  });
}

function doReset(){
  showConfirm('Apagar todos os dados','Todos os gastos, dívidas, corridas e configurações serão apagados permanentemente. Esta ação não tem volta.','Apagar tudo',()=>{
    localStorage.clear(); location.reload();
  });
}

/* ── WIZARD ── */
function selPg(el){
  document.querySelectorAll('.pg-opt').forEach(o=>o.classList.remove('sel'));
  el.classList.add('sel'); _selPerf=el.dataset.p;
}
function selVei(v){
  _temVei=v;
  const sim=document.getElementById('vt-sim'), nao=document.getElementById('vt-nao');
  if(sim)sim.classList.toggle('sel',v==='sim'); if(nao)nao.classList.toggle('sel',v==='nao');
  const vf=document.getElementById('vei-fields'), ff=document.getElementById('fin-fields');
  if(vf)vf.style.display=v==='sim'?'flex':'none';
  if(ff)ff.style.display=v==='sim'?'flex':'none';
}
function selVT(t){
  _vTipo=t;
  ['Moto','Carro','Bicicleta'].forEach(x=>{
    const el=document.getElementById('vtm-'+x.toLowerCase()); if(el)el.classList.toggle('sel',x===t);
  });
}
function wNext(e){rip(e,e.currentTarget);_wGo(_wPage+1);}
function wPrev(){_wGo(_wPage-1);}
function _wGo(next){
  if(next>=3){doSetup();return;}
  const cur=document.getElementById('wp'+_wPage);
  if(cur){cur.classList.add('gone');setTimeout(()=>{cur.classList.add('hidden');cur.classList.remove('gone');},300);}
  _wPage=next;
  const nxt=document.getElementById('wp'+_wPage); if(nxt) nxt.classList.remove('hidden');
  const ts=['Seu perfil de uso','Veículo e combustível','Metas financeiras'];
  const tEl=document.getElementById('w-title'); if(tEl) tEl.textContent=ts[_wPage];
  const lEl=document.getElementById('w-lbl'); if(lEl) lEl.textContent='Passo '+(_wPage+1)+' de 3';
  [0,1,2].forEach(i=>{const s=document.getElementById('ws'+i);if(s)s.className='wz-step'+(i<_wPage?' done':i===_wPage?' active':'');});
  const back=document.getElementById('w-back'); if(back) back.style.display=_wPage>0?'block':'none';
  const next2=document.getElementById('w-next'); if(next2) next2.textContent=_wPage===2?'Concluir':'Próximo';
}

function addFixa(){
  const n=document.getElementById('fn')?.value.trim()||'', v=parseFloat(document.getElementById('fv')?.value||'0');
  if(!n||isNaN(v)||v<=0) return;
  _fixasT.push({nome:n,val:v,id:Date.now()});
  const fn=document.getElementById('fn'); if(fn)fn.value='';
  const fv=document.getElementById('fv'); if(fv)fv.value='';
  _rndrFixas();
}
function _rndrFixas(){
  const el=document.getElementById('fixas-list'); if(!el)return;
  el.innerHTML=_fixasT.map(f=>'<div style="display:flex;justify-content:space-between;background:var(--s2);padding:var(--spx) var(--sp);border-radius:var(--rxs);font-size:var(--fsm);margin-bottom:4px"><span>'+f.nome+'</span><span style="color:var(--acc)">R$ '+f.val.toFixed(2)+'</span></div>').join('');
}

function doSetup(){
  const parc=parseFloat(document.getElementById('sf-p')?.value||'0')||0;
  const pt  =parseInt(document.getElementById('sf-pt')?.value||'0')||0;
  const pp  =parseInt(document.getElementById('sf-pg')?.value||'0')||0;
  const sn  =document.getElementById('sf-n')?.value.trim()||'';
  D.prefs.perfil=_selPerf; D.prefs.temVeiculo=_temVei==='sim';
  D.config={
    veiculo:_temVei==='sim'?{tipo:_vTipo,modelo:document.getElementById('sv-m')?.value||'',km:parseFloat(document.getElementById('sv-k')?.value||'0')||0,consumo:parseFloat(document.getElementById('sv-c')?.value||'35')||35,oleo:parseFloat(document.getElementById('sv-o')?.value||'2500')||2500}:null,
    fixas:_fixasT,
    metas:{economia:parseFloat(document.getElementById('me')?.value||'0')||0,limite:parseFloat(document.getElementById('ml')?.value||'0')||0}
  };
  if(sn&&parc>0&&pt>0) D.dividas.push({id:Date.now(),nome:sn,tipo:'Financiamento',total:parc*pt,pago:parc*pp,parcela:parc,dia:parseInt(document.getElementById('sf-d')?.value||'15')||15,auto:true});
  save(); startApp();
}

window.hashPin=hashPin; window.sessaoOk=sessaoOk; window.renovarSessao=renovarSessao;
window.checkPin=checkPin; window.showPin=showPin; window.pinPress=pinPress;
window.removerPin=removerPin; window.obTab=obTab; window.prevAv=prevAv;
window.toggleEye=toggleEye; window.chkPw=chkPw; window.chkMatch=chkMatch;
window.doCad=doCad; window.doLogin=doLogin; window.doLogout=doLogout; window.doReset=doReset;
window.selPg=selPg; window.selVei=selVei; window.selVT=selVT;
window.wNext=wNext; window.wPrev=wPrev; window.addFixa=addFixa; window.doSetup=doSetup;

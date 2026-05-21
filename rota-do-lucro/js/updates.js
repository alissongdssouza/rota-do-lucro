/* ═══════════════════════════════════════
   ROTA DO LUCRO v2 — updates.js
   Verificação remota · Update obrigatório · Changelog
═══════════════════════════════════════ */
'use strict';

let _pendUpdate = null;

async function checkUpdate(silent=true){
  const url=D.prefs?.updUrl;
  if(!url||!D.prefs?.updates) return null;
  try{
    const r=await fetch(url+'?t='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(6000)});
    if(!r.ok) return null;
    const data=await r.json();
    if(D.backup) D.backup.lastCheck=Date.now();
    const lbl=document.getElementById('upd-lbl');
    if(lbl) lbl.textContent='Verificado: '+new Date().toLocaleTimeString('pt-BR');
    if(!data.versionCode||data.versionCode<=APP_CODE) return null;
    _pendUpdate=data;
    if(data.forceUpdate){
      showUpdateScreen(data,true); return data;
    }
    const banner=document.getElementById('upd-banner');
    if(banner){banner.textContent='🔄 Versão '+data.version+' disponível — toque para atualizar';banner.classList.add('on');}
    if(!silent) _showUpdateModal(data);
    return data;
  }catch(e){
    if(!silent) toast('Sem conexão para verificar atualizações');
    return null;
  }
}

function showUpdateScreen(data,forced){
  let el=document.getElementById('update-screen');
  if(!el){el=document.createElement('div');el.id='update-screen';document.body.appendChild(el);}
  el.style.cssText='position:fixed;inset:0;background:var(--bg);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;text-align:center;animation:fadeIn .4s ease';
  el.innerHTML=`
    <div style="font-size:52px;margin-bottom:1rem">🔄</div>
    <div style="font-family:var(--font-h);font-size:var(--f2xl);font-weight:800;color:var(--acc);margin-bottom:.5rem">${forced?'Atualização Obrigatória':'Nova Versão'}</div>
    <div style="font-size:var(--flg);color:var(--t2);margin-bottom:var(--sp)">Versão ${data.version}</div>
    ${data.changelog?`<div style="font-size:var(--fsm);color:var(--mu);background:var(--s1);border:1px solid var(--b1);border-radius:var(--rsm);padding:var(--sp);margin:var(--sp) 0;max-width:340px;text-align:left;line-height:1.7">${data.changelog.replace(/\n/g,'<br>')}</div>`:''}
    ${forced?'<div style="font-size:var(--fsm);color:var(--red);margin-bottom:var(--splg)">Esta versão não é mais suportada.</div>':''}
    <button onclick="doUpdate()" class="rip" style="width:100%;max-width:340px;padding:var(--spmd);background:var(--acc);color:#000;border:none;border-radius:var(--rsm);font-size:var(--fmd);font-weight:700;cursor:pointer;margin-bottom:var(--sp)">Atualizar agora</button>
    ${!forced?`<button onclick="document.getElementById('update-screen').remove()" style="width:100%;max-width:340px;padding:var(--sp);background:var(--s1);color:var(--t2);border:1px solid var(--b1);border-radius:var(--rsm);font-size:var(--fsm);cursor:pointer">Depois</button>`:''}
  `;
}

function _showUpdateModal(data){
  showConfirm(`Nova versão ${data.version}!`,
    (data.changelog||'Melhorias e correções.')+'\n\nDeseja atualizar agora?',
    'Atualizar',()=>doUpdate(),false);
}

async function doUpdate(){
  if(!_pendUpdate?.url){toast('URL de atualização não encontrada');return;}
  toast('Baixando atualização...');
  try{
    const r=await fetch(_pendUpdate.url,{cache:'no-store'});
    if(!r.ok){toast('Erro ao baixar');return;}
    const html=await r.text();
    localStorage.setItem('rdl_live_html',html);
    localStorage.setItem('rdl_live_ver',_pendUpdate.version);
    toast('Atualizado! Reiniciando...');
    setTimeout(()=>location.reload(),1500);
  }catch(e){toast('Sem conexão para baixar');}
}

async function checkUpdateManual(){
  const urlEl=document.getElementById('upd-url');
  if(urlEl) D.prefs.updUrl=urlEl.value.trim();
  D.prefs.updates=document.getElementById('tg-upd')?.checked!==false;
  save(); toast('Verificando...');
  const r=await checkUpdate(false);
  if(!r) toast('App já está na versão mais recente!');
}

window.checkUpdate=checkUpdate;
window.showUpdateScreen=showUpdateScreen;
window.doUpdate=doUpdate;
window.checkUpdateManual=checkUpdateManual;

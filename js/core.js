/* ═══════════════════════════════════════
   ROTA DO LUCRO v2 — core.js
   Estado global · Persistência · Validação
═══════════════════════════════════════ */
'use strict';

const APP_VER  = '2.0.0';
const APP_CODE = 200;
const STORE    = 'rdl_v2';

const _DEFAULT = {
  version:'2.0.0', usuario:null, config:null,
  gastos:[], dividas:[], corridas:[], abast:[], metas:[], historico:[],
  ap:{tema:'dark',acc:'verde',font:'default'},
  prefs:{updates:true,notif:false,updUrl:'',temVeiculo:false,perfil:'outro'},
  backup:{ultimo:null,auto:true},
  sessao:{logado:false,expiraEm:null,falhas:0,bloqueadoAte:null}
};

let D = JSON.parse(JSON.stringify(_DEFAULT));

/* ── PERSISTÊNCIA ── */
function save(){
  try{
    D.version = APP_VER;
    localStorage.setItem(STORE, JSON.stringify(D));
    const n = parseInt(localStorage.getItem('rdl_sc')||'0')+1;
    localStorage.setItem('rdl_sc', n);
    if(n%10===0 && D.backup?.auto) _autoBackup();
  }catch(e){console.warn('save:',e.message);}
}

function load(){
  try{
    const r = localStorage.getItem(STORE);
    if(r){ D = _merge(JSON.parse(JSON.stringify(_DEFAULT)), JSON.parse(r)); _fixArrays(); return true; }
    return _migrateOld();
  }catch(e){ console.warn('load:',e.message); return false; }
}

function _merge(t, s){
  const o={...t};
  for(const k of Object.keys(s)){
    if(s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])) o[k]=_merge(t[k]||{},s[k]);
    else o[k]=s[k];
  }
  return o;
}

function _fixArrays(){
  ['gastos','dividas','corridas','abast','metas','historico'].forEach(k=>{
    if(!Array.isArray(D[k])) D[k]=[];
  });
}

function _migrateOld(){
  for(const k of ['rdl4','rdl3','rdl_dados']){
    const r=localStorage.getItem(k);
    if(!r) continue;
    try{
      const o=JSON.parse(r);
      D.usuario = o.u||o.usuario||null;
      D.config  = o.cfg||o.config||null;
      ['gastos','dividas','corridas','abast'].forEach(f=>{ if(Array.isArray(o[f])) D[f]=o[f]; });
      if(o.ap)    D.ap    = {...D.ap,...o.ap};
      if(o.prefs||o.pr) D.prefs = {...D.prefs,...(o.prefs||o.pr)};
      if(D.config?.veiculo) D.prefs.temVeiculo=true;
      _fixArrays(); save();
      return true;
    }catch(e){ continue; }
  }
  return false;
}

function _autoBackup(){
  try{
    localStorage.setItem('rdl_ab', gerarBackupJSON());
    localStorage.setItem('rdl_ab_ts', Date.now());
  }catch(e){}
}

/* ── HISTÓRICO ── */
function log(tipo, desc){
  if(!Array.isArray(D.historico)) D.historico=[];
  D.historico.unshift({id:Date.now(),tipo,desc,em:new Date().toLocaleString('pt-BR')});
  if(D.historico.length>100) D.historico=D.historico.slice(0,100);
}

/* ── VALIDAÇÃO ── */
function validar(){
  let n=0;
  ['gastos','dividas','corridas','abast'].forEach(k=>{
    const ids=new Set();
    D[k]=D[k].filter(it=>{
      if(!it.id||ids.has(it.id)){it.id=Date.now()+Math.random();n++;}
      ids.add(it.id); return true;
    });
  });
  D.gastos.forEach(g=>{ g.val=parseFloat(g.val)||0; });
  D.dividas.forEach(d=>{ d.total=parseFloat(d.total)||0; d.pago=parseFloat(d.pago)||0; d.parcela=parseFloat(d.parcela)||0; });
  if(n>0) save();
  return n;
}

/* ── BACKUP ── */
function gerarBackupJSON(){
  const u = D.usuario ? {...D.usuario} : null;
  if(u) delete u.pinHash;
  return JSON.stringify({app:'Rota do Lucro',ver:APP_VER,em:new Date().toISOString(),
    dados:{usuario:u,config:D.config,gastos:D.gastos,dividas:D.dividas,
           corridas:D.corridas,abast:D.abast,metas:D.metas,ap:D.ap,prefs:D.prefs}},null,2);
}

function exportarBackup(){
  const json=gerarBackupJSON();
  const blob=new Blob([json],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='rota-do-lucro-'+new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')+'.json';
  a.click(); URL.revokeObjectURL(url);
  D.backup.ultimo=Date.now(); log('backup','Backup exportado'); save();
}

function importarBackup(jsonStr){
  try{
    const bk=JSON.parse(jsonStr);
    if(bk.app!=='Rota do Lucro') throw new Error('Arquivo inválido');
    const pin=D.usuario?.pinHash;
    const d=bk.dados;
    if(d.usuario) D.usuario=d.usuario;
    if(pin&&D.usuario) D.usuario.pinHash=pin;
    if(d.config)  D.config=d.config;
    ['gastos','dividas','corridas','abast','metas'].forEach(f=>{ if(Array.isArray(d[f])) D[f]=d[f]; });
    if(d.ap)    D.ap    = {...D.ap,...d.ap};
    if(d.prefs) D.prefs = {...D.prefs,...d.prefs};
    D.backup.ultimo=Date.now(); log('restore','Backup importado: '+bk.em); _fixArrays(); save();
    return {ok:true,msg:'Backup restaurado com sucesso!'};
  }catch(e){ return {ok:false,msg:'Erro: '+e.message}; }
}

function restaurarAutoBackup(){
  const r=localStorage.getItem('rdl_ab');
  if(!r) return {ok:false,msg:'Nenhum auto-backup encontrado'};
  return importarBackup(r);
}

/* ── CÁLCULO SALDO ── */
function calcSaldo(){
  const ent=(D.gastos||[]).filter(g=>g.tipo==='e').reduce((a,b)=>a+(b.val||0),0);
  const sai=(D.gastos||[]).filter(g=>g.tipo==='g').reduce((a,b)=>a+(b.val||0),0);
  const gU =(D.corridas||[]).reduce((a,b)=>a+(b.ganho||0),0);
  const cU =(D.abast||[]).reduce((a,b)=>a+(b.val||0),0);
  return {ent,sai,gU,cU,renda:ent+gU,saldo:ent+gU-sai-cU};
}

window.APP_VER=APP_VER; window.APP_CODE=APP_CODE;
window.D=D; window.save=save; window.load=load;
window.log=log; window.validar=validar; window.calcSaldo=calcSaldo;
window.gerarBackupJSON=gerarBackupJSON;
window.exportarBackup=exportarBackup;
window.importarBackup=importarBackup;
window.restaurarAutoBackup=restaurarAutoBackup;

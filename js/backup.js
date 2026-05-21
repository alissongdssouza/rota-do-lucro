/* ═══════════════════════════════════════
   ROTA DO LUCRO v2 — backup.js
   Backup · Importação · Histórico
═══════════════════════════════════════ */
'use strict';

function rndrBackup(){
  const el=document.getElementById('backup-content'); if(!el)return;
  const ultimo=D.backup?.ultimo?new Date(D.backup.ultimo).toLocaleString('pt-BR'):'Nunca';
  const autoTs=localStorage.getItem('rdl_ab_ts');
  const autoUltimo=autoTs?new Date(parseInt(autoTs)).toLocaleString('pt-BR'):'Nunca';
  el.innerHTML=`
    <div class="bk-row">
      <div><div class="bk-lbl">Exportar backup</div><div class="bk-sub">Salvar arquivo JSON no dispositivo</div></div>
      <button class="bk-btn" onclick="exportarBackup()">Exportar</button>
    </div>
    <div class="bk-row">
      <div><div class="bk-lbl">Importar backup</div><div class="bk-sub">Restaurar de arquivo JSON</div></div>
      <button class="bk-btn" onclick="document.getElementById('bk-inp').click()">Importar</button>
    </div>
    <input type="file" id="bk-inp" accept=".json" style="display:none" onchange="importarBackupFile(this)">
    <div class="bk-row">
      <div><div class="bk-lbl">Auto-backup interno</div><div class="bk-sub">Último: ${autoUltimo}</div></div>
      <button class="bk-btn" onclick="restAutoBackup()">Restaurar</button>
    </div>
    <div class="bk-row">
      <div><div class="bk-lbl">Último backup manual</div><div class="bk-sub">${ultimo}</div></div>
      <button class="bk-btn" onclick="exportarBackup()">Novo backup</button>
    </div>
    <div class="bk-row">
      <div><div class="bk-lbl">Exportar relatório CSV</div><div class="bk-sub">Planilha com todos os lançamentos</div></div>
      <button class="bk-btn" onclick="exportarRelatorio()">Exportar CSV</button>
    </div>
    <div class="bk-row">
      <div><div class="bk-lbl">Auto-backup automático</div><div class="bk-sub">A cada 10 alterações</div></div>
      <label class="tog"><input type="checkbox" ${D.backup?.auto!==false?'checked':''} onchange="D.backup.auto=this.checked;save()"><span class="ts"></span></label>
    </div>`;
}

function importarBackupFile(inp){
  const f=inp.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=e=>{
    const res=importarBackup(e.target.result);
    if(res.ok){toast(res.msg);renderAll();showP('home');}
    else toast(res.msg);
  };
  r.readAsText(f);
}

function restAutoBackup(){
  showConfirm('Restaurar auto-backup','Isso substituirá os dados atuais pelo último auto-backup. Continuar?','Restaurar',()=>{
    const res=restaurarAutoBackup();
    if(res.ok){toast(res.msg);renderAll();}
    else toast(res.msg);
  });
}

function rndrHistorico(){
  const el=document.getElementById('hist-content'); if(!el)return;
  if(!D.historico?.length){el.innerHTML='<div class="empty">Nenhuma ação registrada ainda.</div>';return;}
  const tipos={gasto:'💸',entrada:'💰',corrida:'🛣️',abast:'⛽',divida:'💳',pagamento:'✅',meta:'🎯',backup:'💾',restore:'🔄',config:'⚙️'};
  el.innerHTML=D.historico.map(h=>`
    <div class="hist-item">
      <div class="hist-ico">${tipos[h.tipo]||'📋'}</div>
      <div><div class="hist-desc">${h.desc}</div><div class="hist-time">${h.em}</div></div>
    </div>`).join('');
}

window.rndrBackup=rndrBackup;
window.importarBackupFile=importarBackupFile;
window.restAutoBackup=restAutoBackup;
window.rndrHistorico=rndrHistorico;

/* ═══════════════════════════════════════
   ROTA DO LUCRO v2 — notifications.js
   Notificações locais inteligentes
═══════════════════════════════════════ */
'use strict';

async function pedirPermNotif(){
  if(!('Notification'in window))return false;
  if(Notification.permission==='granted')return true;
  const p=await Notification.requestPermission();
  return p==='granted';
}

function enviarNotif(titulo,corpo){
  if(!D.prefs?.notif)return;
  if(!('Notification'in window)||Notification.permission!=='granted')return;
  try{
    new Notification('Rota do Lucro — '+titulo,{
      body:corpo,
      tag:titulo.replace(/\s/g,'_'),
      icon:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect width="72" height="72" rx="18" fill="%230a0f0a"/><text y="50" font-size="40" text-anchor="middle" x="36">💚</text></svg>'
    });
  }catch(e){}
}

function agendarNotificacoes(){
  if(!D.prefs?.notif||!D.usuario)return;
  const nome=D.usuario.nome||'Você';
  const hj=new Date().getDate();
  const hjS=new Date().toLocaleDateString('pt-BR');

  // Vencimentos próximos
  (D.dividas||[]).forEach(d=>{
    const diff=d.dia-hj;
    if(diff>=0&&diff<=3){
      setTimeout(()=>enviarNotif('Vencimento',
        `${nome}, parcela de "${d.nome}" vence ${diff===0?'hoje':'em '+diff+'d'} — R$${(d.parcela||0).toFixed(2)}`
      ),800+Math.random()*500);
    }
  });

  // Troca de óleo
  const v=D.config?.veiculo;
  if(v&&v.tipo!=='Nenhum'){
    const kmR=(D.corridas||[]).reduce((a,b)=>a+(b.km||0),0);
    const falta=Math.max(0,(v.oleo||2500)-(kmR%(v.oleo||2500)));
    if(falta<400) setTimeout(()=>enviarNotif('Manutenção',`${nome}, troca de óleo próxima — ~${falta.toFixed(0)} km!`),1200);
  }

  // Sem registro hoje
  const temHoje=(D.corridas||[]).some(c=>c.data===hjS)||(D.gastos||[]).some(g=>g.data===hjS);
  if(!temHoje&&((D.corridas||[]).length>0||(D.gastos||[]).length>0)){
    setTimeout(()=>enviarNotif('Lembrete',`${nome}, você ainda não registrou nada hoje!`),2000);
  }

  // Meta atingida
  const {saldo}=calcSaldo();
  const metaEcon=D.config?.metas?.economia||0;
  if(metaEcon>0&&saldo>=metaEcon){
    setTimeout(()=>enviarNotif('Meta atingida! 🎯',`${nome}, parabéns! Você atingiu sua meta de economia!`),2500);
  }
}

async function togNotif(on){
  D.prefs.notif=on; save();
  if(on){
    const ok=await pedirPermNotif();
    if(!ok){
      D.prefs.notif=false; save();
      const el=document.getElementById('tg-notif'); if(el)el.checked=false;
      toast('Permissão de notificação negada');return;
    }
    toast('Notificações ativadas!');
    agendarNotificacoes();
  }
}

window.pedirPermNotif=pedirPermNotif;
window.enviarNotif=enviarNotif;
window.agendarNotificacoes=agendarNotificacoes;
window.togNotif=togNotif;

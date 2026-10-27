(function(){
 'use strict';
 var origin='https://regeneration-family-companion.zafaramin.chatgpt.site',popup=null,token='',enabled=false,last='',timer=null,pending=null,restoring=false;
 var button=document.getElementById('desk-account-connect'),status=document.getElementById('desk-account-status');
 function say(s){status.textContent=s;}
 function send(type,extra){if(popup&&!popup.closed)popup.postMessage(Object.assign({type:type,token:token},extra||{}),origin);}
 button.addEventListener('click',function(){enabled=false;last='';token=crypto.randomUUID();popup=window.open(origin+'/journal-sync','rt-private-save','width=700,height=720');say(popup?'Connect your private account in the small window. Your entries here are kept.':'Allow the save window to open, then try again.');});
 window.addEventListener('message',function(e){if(e.origin!==origin||!popup||e.source!==popup)return;var d=e.data;if(d&&d.type==='rt-account-ready'){send('rt-account-connect');return;}if(!d||d.token!==token)return;
 if(d.type==='rt-account-enabled'){last='';enabled=true;window.dispatchEvent(new CustomEvent('rt-desk-state-request'));}
 if(d.type==='rt-account-restore'){restoring=true;pending=null;clearTimeout(timer);window.dispatchEvent(new CustomEvent('rt-desk-restore',{detail:d.journal}));}
 if(d.type==='rt-account-saved')say('Saved'+(d.name?' · '+d.name:'')+' · '+new Date(d.updatedAt).toLocaleString()+'.');
 if(d.type==='rt-account-status')say(d.message);
 if(d.type==='rt-account-error'){enabled=false;say(d.message);}
 });
 window.addEventListener('rt-desk-restored',function(){restoring=false;enabled=true;last=JSON.stringify(pending);say('Restored from your private account. Later changes save automatically while connected.');pending=null;});
 window.addEventListener('rt-desk-restore-error',function(e){restoring=false;enabled=false;say('Could not restore: '+e.detail+'. Current entries were kept where possible.');});
 window.addEventListener('rt-desk-state',function(e){pending=e.detail;if(restoring||!enabled)return;var serialized=JSON.stringify(pending);if(serialized===last)return;say('Changes waiting to save…');clearTimeout(timer);timer=setTimeout(function(){if(!enabled)return;if(!popup||popup.closed){enabled=false;say('Not saved: the connection window closed. Click Save or restore to reconnect.');return;}last=serialized;send('rt-account-state',{journal:pending});pending=null;},700);});
 setInterval(function(){if(enabled&&(!popup||popup.closed)){enabled=false;say('Save connection closed. Your previous saves are kept. Reconnect before editing more.');}},1500);
})();

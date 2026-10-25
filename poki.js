/* poki.js · conexión con el SDK de Poki: avisos de partida (empieza/para) y pausas para anuncios.
   Si el SDK no está (fuera de Poki, sin conexión o con un bloqueador de anuncios), el juego funciona igual: todo esto no hace nada. */
const pokiSDK=()=>(typeof window.PokiSDK==='object'||typeof window.PokiSDK==='function')&&window.PokiSDK?window.PokiSDK:null;
function pokiCall(fn,...a){const s=pokiSDK();if(!s||typeof s[fn]!=='function')return null;try{return s[fn](...a)}catch(e){return null}}
/* el juego arranca sin esperar al SDK; Poki pide arrancar tanto si se inicia bien como si falla */
const pokiReady=(()=>{const p=pokiCall('init');return p&&p.then?p.then(()=>true,()=>false):Promise.resolve(false)})();
let pokiPlaying=false,inAd=false;
function gameplayOn(){if(pokiPlaying||inAd)return;pokiPlaying=true;pokiCall('gameplayStart')}
function gameplayOff(){if(!pokiPlaying)return;pokiPlaying=false;pokiCall('gameplayStop')}
function adMute(on){if(master)master.gain.value=on||!SND?0:1}
/* antes de cada combate se ofrece un hueco para anuncio (Poki decide si sale uno): se silencia el juego y no se puede tocar nada */
function adBreak(then){
  if(inAd)return;
  if(!pokiSDK()){then();return}
  gameplayOff();inAd=true;document.body.classList.add('in-ad');
  let done=false;
  const fin=()=>{if(done)return;done=true;inAd=false;adMute(false);document.body.classList.remove('in-ad');then()};
  pokiReady.then(()=>{const p=pokiCall('commercialBreak',()=>adMute(true));if(p&&p.then)p.then(fin,fin);else fin()});
}
/* que el espacio y las flechas no muevan la página (en Poki el juego va dentro de un marco); en los campos de texto se escribe normal */
window.addEventListener('keydown',e=>{
  if(inAd){e.preventDefault();e.stopImmediatePropagation();return}
  const tg=e.target,tag=tg&&tg.tagName||'';
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(tag)||(tg&&tg.isContentEditable))return;
  if([' ','Spacebar','ArrowUp','ArrowDown','PageUp','PageDown'].includes(e.key)&&(current==='fight'||tag==='BODY'||tag==='HTML'))e.preventDefault();
},{capture:true});
/* en el combate la rueda del ratón no mueve la página; en los menús largos sí, para poder verlos enteros */
window.addEventListener('wheel',e=>{if(current==='fight')e.preventDefault()},{passive:false});

/* ---------- monedas por anuncios ----------
   El botón + junto al dinero abre una ventana que avisa antes del anuncio (Poki lo exige). Solo se premia si el anuncio se ve entero. */
const AD_COINS=100;
let adKey='ad.desc',adState='ask';
function adShow(k,state){
  adKey=k;adState=state;
  const go=$('#ad-go'),x=$('#ad-x');
  $('#ad-msg').textContent=t(k,{n:AD_COINS});
  go.hidden=state!=='ask';go.disabled=false;x.hidden=state==='wait';
  x.dataset.i18n=state==='ask'?'ad.no':'ad.close';x.textContent=t(x.dataset.i18n);
  $('#ad-ov').classList.toggle('won',state==='won');
}
function openAdCoins(){
  if(inAd)return;
  adShow('ad.desc','ask');$('#ad-ov').hidden=false;$('#ad-go').focus();
}
function refreshAdCoins(){if(!$('#ad-ov').hidden)adShow(adKey,adState)}
function closeAdCoins(){if(inAd)return;$('#ad-ov').hidden=true;$('#ad-ov').classList.remove('won')}
function watchAd(){
  if(inAd)return;
  if(!pokiSDK()){adShow('ad.na','done');return}
  inAd=true;document.body.classList.add('in-ad');adShow('ad.wait','wait');
  let done=false;
  const fin=ok=>{
    if(done)return;done=true;inAd=false;adMute(false);document.body.classList.remove('in-ad');
    if(ok===true){save.cash=Math.min(1e9,save.cash+AD_COINS);persist();sfx('coin');refreshScreen();adShow('ad.ok','won')}
    else adShow('ad.fail','done');
    $('#ad-x').focus();
  };
  pokiReady.then(()=>{const p=pokiCall('rewardedBreak',{size:'small',onStart:()=>adMute(true)});if(p&&p.then)p.then(fin,()=>fin(false));else fin(false)});
}
document.addEventListener('click',e=>{if(e.target.closest('[data-adcoins]'))openAdCoins()});
$('#ad-go').onclick=watchAd;
$('#ad-x').onclick=closeAdCoins;
$('#ad-ov').addEventListener('pointerdown',e=>{if(e.target.id==='ad-ov')closeAdCoins()});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#ad-ov').hidden&&!inAd){e.preventDefault();closeAdCoins()}});

/* main.js · arranque, calidad automática y fuentes */
let AUTOTIER=2,needBench=false;
(function(){
  const sv=LS.get('od_tier',null);
  if(sv&&sv.k===devSig()&&sv.t>=0&&sv.t<=2)AUTOTIER=sv.t;else needBench=true;
  TIER=QMODE==='high'?2:QMODE==='low'?0:AUTOTIER;
})();
function setQuality(m){
  QMODE=m;LS.set('od_q',m);
  TIER=m==='high'?2:m==='low'?0:AUTOTIER;
  syncMenuBtns();
}
/* prueba rápida: cuánto tarda este equipo en dibujar dos luchadores a máxima calidad */
function benchTier(){
  try{
    const res=clamp(Math.round(Math.min(estStageW()*Math.max(1,window.devicePixelRatio||1)/W,2)*4)/4,.75,2);
    const c=document.createElement('canvas');c.width=Math.round(W*res);c.height=Math.round(H*res);
    const g=c.getContext('2d');
    const a=Object.assign({},PLAYER,{id:'b1',d:1,state:'idle',atk:null,at:0,anim:.3,flash:0,hp:200,maxhp:220,koT:0,dodgeT:0});
    const b=Object.assign({},FIGHTERS[4],{id:'b2',d:-1,state:'jab',atk:'jab',at:.1,anim:.2,flash:0,hp:200,maxhp:230,koT:0,dodgeT:0});
    const frame=()=>{
      g.setTransform(res,0,0,res,0,0);g.clearRect(0,0,W,H);
      [[a,300],[b,640]].forEach(([q,x])=>{g.save();g.translate(x,GY);g.scale(q.d,1);drawFigure(g,q);g.restore()});
    };
    for(let i=0;i<3;i++)frame();
    g.getImageData(0,0,1,1);
    const t0=performance.now();
    for(let i=0;i<6;i++)frame();
    g.getImageData(0,0,1,1);
    return (performance.now()-t0)/6;
  }catch(e){return 0}
}
function runBench(){
  if(!needBench||QMODE!=='auto'||current!=='menu')return;
  needBench=false;
  const ms=benchTier(),n=ms<=7?2:ms<=16?1:0;
  AUTOTIER=n;LS.set('od_tier',{t:n,k:devSig()});
  if(QMODE==='auto')TIER=n;
  window.__bench=ms;
}

/* las fuentes se piden sin bloquear la página; cuando llegan se redibuja el fondo del ring, que lleva rótulos */
function onFontCss(){
  if(!document.fonts||!document.fonts.load)return;
  Promise.race([document.fonts.load('900 30px "Big Shoulders Display"','KICKBOXING GP IRON GYM'),new Promise(r=>setTimeout(r,4000))])
    .then(()=>{invalidateBgs();menuBg=null;if(G&&bgEl)showBg(getBg(G.arena));fitLogo()}).catch(()=>{});
}
/* el logo se encoge si el nombre no cabe en su hueco (depende de la tipografía que haya cargado) */
function fitLogo(){
  const lg=$('.lg');if(!lg||!lg.parentElement)return;
  lg.style.fontSize='';
  const box=lg.parentElement.clientWidth,w=lg.offsetWidth;
  if(box>0&&w>box)lg.style.fontSize=(parseFloat(getComputedStyle(lg).fontSize)*box/w*.95).toFixed(1)+'px';
}
window.addEventListener('resize',fitLogo);
onFontCss();                                                  /* las tipografías van dentro del juego (fonts.css) */

/* la tarjeta de controles se abre sola en pantallas grandes; solo se toca cuando cambia el tipo de pantalla (en el móvil la barra del navegador también dispara 'resize') */
let howWas=null;
function syncHow(){const d=$('#how');if(!d)return;const m=matchMedia('(min-width:700px) and (min-height:560px)').matches;if(m!==howWas){howWas=m;d.open=m}}
syncHow();window.addEventListener('resize',syncHow);
window.addEventListener('error',e=>{console.error(e.message)});

applyLang();ensureLangFonts(LANG);
show('menu');fitLogo();
document.body.classList.add('ready');
pokiReady.then(()=>pokiCall('gameLoadingFinished'));                /* aviso a Poki: el juego ya ha cargado */
setTimeout(runBench,900);

/* audio.js · efectos de sonido sintetizados (sin archivos) */
let ac=null,master=null,noiseBuf=null,SND=LS.get('od_snd',true)!==false;
const lastSfx={};
function audioCtx(){
  if(!ac){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return null;
    try{ac=new AC();master=ac.createGain();master.gain.value=SND?1:0;master.connect(ac.destination)}catch(e){ac=null;return null}
  }
  if(ac.state==='suspended'&&ac.resume){try{ac.resume().catch(()=>{})}catch(e){}}
  return ac;
}
/* los navegadores solo dejan sonar tras un toque o una tecla: desbloqueamos con el primero */
['pointerdown','touchend','keydown','click'].forEach(ev=>window.addEventListener(ev,audioCtx,true));
function setSound(on){SND=!!on;LS.set('od_snd',SND);if(master)master.gain.value=SND?1:0}

const SFX={heavy:[96,.24,'sawtooth',.2],coin:[1180,.16,'square',.07],buy:[640,.18,'triangle',.1],hit:[150,.12,'square',.12],block:[320,.06,'triangle',.08],ko:[70,.5,'sawtooth',.2],bell:[880,.7,'sine',.12],whiff:[520,.05,'sine',.03],dodge:[700,.09,'triangle',.05],tick:[420,.12,'square',.09]};
function sfx(name){
  if(!SND)return;
  try{
    const now=performance.now();
    if(now-(lastSfx[name]||0)<35)return;            /* no apilar el mismo sonido */
    lastSfx[name]=now;
    const a=audioCtx();if(!a||a.state!=='running')return;
    if(name==='crowd'){crowd(a);return}
    const cfg=SFX[name];if(!cfg)return;
    const o=a.createOscillator(),g=a.createGain(),t0=a.currentTime;
    o.type=cfg[2];o.frequency.setValueAtTime(cfg[0],t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(30,cfg[0]*.4),t0+cfg[1]);
    g.gain.setValueAtTime(cfg[3],t0);g.gain.exponentialRampToValueAtTime(.001,t0+cfg[1]);
    o.connect(g);g.connect(master);o.start(t0);o.stop(t0+cfg[1]+.02);
  }catch(e){}
}
function crowd(a){
  if(!noiseBuf||noiseBuf.sampleRate!==a.sampleRate){
    const len=Math.floor(a.sampleRate*.6);noiseBuf=a.createBuffer(1,len,a.sampleRate);
    const d=noiseBuf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
  }
  const s=a.createBufferSource();s.buffer=noiseBuf;
  const fl=a.createBiquadFilter();fl.type='bandpass';fl.frequency.value=900;
  const g=a.createGain();g.gain.value=.14;
  s.connect(fl);fl.connect(g);g.connect(master);s.start();
}

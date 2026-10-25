/* fight.js · estado del combate, reglas, KO con cuenta de 10 y bucle principal */
const cv=$('#cv'),ctx=cv.getContext('2d');
let G=null,raf=0,lastTs=0,shake=0,sparks=[],pops=[],fx=[];

/* ---------- resolución y calidad ---------- */
function devSig(){return (window.devicePixelRatio||1)+'|'+(screen.width||0)+'|'+(navigator.hardwareConcurrency||0)}
/* tamaño aproximado del escenario antes de que sea visible */
function estStageW(){return Math.max(300,Math.min(innerWidth-32,1040,(innerHeight-200)*1.7778))}
/* píxeles reales que ocupará el lienzo en pantalla, limitados por el nivel de calidad */
function calcRes(){
  const box=$('#cvbox'),cw=(box&&box.clientWidth)||estStageW();
  const want=cw*Math.max(1,window.devicePixelRatio||1)/W;
  return clamp(Math.round(Math.min(want,TIERS[TIER].cap)*4)/4,.75,2);
}
function applyRes(force){
  const r=calcRes();
  if(!force&&r===RES&&cv.width===Math.round(W*r))return false;
  RES=r;cv.width=Math.round(W*RES);cv.height=Math.round(H*RES);
  sprReset();invalidateBgs();
  return true;
}
function setTier(n){
  n=clamp(n,0,2);if(n===TIER)return;
  TIER=n;
  if(QMODE==='auto'){AUTOTIER=TIER;LS.set('od_tier',{t:TIER,k:devSig()})}
  if(G){applyRes(true);showBg(getBg(G.arena))}
}
/* mide los fotogramas reales; si el equipo va justo baja un nivel de calidad él solo */
const PF={n:0,sum:0};
function perfSample(real){
  if(!G||G.paused||document.hidden||G.phase==='intro'){PF.n=0;PF.sum=0;return}
  if(real<=0||real>.25){PF.n=0;PF.sum=0;return}
  PF.n++;PF.sum+=real;
  if(PF.n>=36){
    const avg=PF.sum/PF.n;PF.n=0;PF.sum=0;
    if(QMODE==='auto'&&avg>.027&&TIER>0)setTier(TIER-(avg>.05?2:1));     /* muy lento: baja dos niveles de golpe */
  }
}

/* ---------- luchadores ---------- */
function mk(id,side,human,col){
  const base=lookOf(id);                                         /* el jugador lleva su equipo del vestuario */
  const isSoloPlayer=human&&G.mode==='solo'&&side===1;
  const u=save.up;
  const maxhp=isSoloPlayer?220+20*u.hp:(human?220:base.hp);
  const f={
    id,side,human,skin:base.skin,hair:base.hair,style:base.style,beard:base.beard,scar:base.scar,
    trunk:col?col.trunk:base.trunk,glove:col?col.glove:base.glove,
    gs:base.gs,c2:base.c2,ts:base.ts,t2:base.t2,dn:base.dn||'d0',dance:null,
    x:side===1?300:660,y:GY,jy:0,kx:0,d:side===1?1:-1,
    maxhp,hp:maxhp,ghost:maxhp,
    pow:isSoloPlayer?1+.10*u.pow:(human?1:base.pow),
    spd:isSoloPlayer?300*(1+.06*u.spd):(human?300:275*base.spd),
    def:isSoloPlayer?.06*u.def:0,
    state:'idle',atk:null,at:0,hitDone:false,stun:0,block:false,koT:0,anim:Math.random()*5,flash:0,
    dodgeT:0,dodgeCd:0,counter:0,rounds:0,used:null,inv:0,downs:0,
    chin:isSoloPlayer?Math.min(.8,.4+.07*u.hp):(human?.5:CHIN[id]),
    ai:human?null:{t:.5,hold:0,mode:'idle',q:[],gap:0,aggr:base.aggr,blk:base.blk,react:base.react}
  };
  f.gk=gearKey(f);
  return f;
}
/* altura del salto de la rodilla (px) según el tiempo desde que empieza el golpe: sube hasta el golpe, se mantiene y cae */
function kneeJump(t){
  const a=ATK.knee,s=a.start,e=s+a.act;
  if(t<s)return KNEE_JUMP*Math.sin(Math.PI/2*(t/s));
  if(t<e)return KNEE_JUMP*(1-.12*(t-s)/a.act);
  const u=(t-e)/.17;
  return u>=1?0:KNEE_JUMP*.88*(1-u*u);
}
function resetRound(first){
  const p=G.pl,o=G.op;
  [p,o].forEach(f=>{
    if(first)f.hp=f.maxhp;else f.hp+=(f.maxhp-f.hp)*.35;
    f.ghost=f.hp;f.y=GY;f.jy=0;f.dance=null;f.kx=0;f.state='idle';f.atk=null;f.stun=0;f.block=false;f.koT=0;f.dodgeT=0;f.dodgeCd=0;f.counter=0;f.inv=0;
    if(f.ai){f.ai.q=[];f.ai.mode='idle';f.ai.pend=null}
  });
  p.x=300;p.d=1;o.x=660;o.d=-1;G.tleft=ROUND_TIME;G.rd={1:0,2:0};sparks=[];popClear();
}

function startAtk(f,name){f.aid=(f.aid||0)+1;f.atk=name;f.at=0;f.hitDone=false;f.state=name;f.used=name}
function clampX(f){f.x=Math.max(XMIN,Math.min(XMAX,f.x))}
function step(f,o,inp,dt){
  f.anim+=dt;if(f.flash>0)f.flash-=dt;if(f.inv>0)f.inv-=dt;if(f.counter>0)f.counter-=dt;if(f.dodgeCd>0)f.dodgeCd-=dt;
  f.ghost+=(f.hp-f.ghost)*Math.min(1,dt*2.2);
  if(f.jy>0&&f.atk!=='knee')f.jy=Math.max(0,f.jy-760*dt);       /* si le golpean en el aire, cae */
  if(f.state==='ko'){f.jy=0;f.koT+=dt;f.x+=f.kx*dt;f.kx*=Math.pow(.002,dt);clampX(f);return}
  f.x+=f.kx*dt;f.kx*=Math.pow(.002,dt);clampX(f);
  if(f.stun>0){f.stun-=dt;f.state='hit';f.block=false;if(f.stun<=0){f.state='idle';if(f.ai)f.ai.t=0}return}
  if(f.dodgeT>0){f.dodgeT-=dt;f.state='dodge';if(f.dodgeT<=0)f.state='idle';return}
  if(f.atk){
    const a=ATK[f.atk];f.at+=dt;
    if(f.atk==='knee'){
      f.jy=kneeJump(f.at);
      if(f.at<a.start){                                          /* antes del golpe salta hacia delante (sin pasarse del rival) */
        const gap=(o.x-f.x)*f.d;
        if(gap>70){f.x+=f.d*Math.min(gap-70,a.lunge/a.start*dt);clampX(f)}
      }
    }
    if(!f.hitDone&&f.at>=a.start&&f.at<a.start+a.act)tryHit(f,o);
    if(f.at>=a.start+a.act+a.rec){f.atk=null;f.state='idle';f.jy=0}
    return;
  }
  f.d=Math.sign(o.x-f.x)||f.d;
  f.block=!!inp.block;
  if(f.block){f.state='block';return}
  if(inp.dodge&&f.dodgeCd<=0){
    f.dodgeT=.34;f.dodgeCd=.85;f.state='dodge';f.kx+=-f.d*540;f.used='dodge';sfx('dodge');return;
  }
  f.state=inp.move?'walk':'idle';
  f.x+=inp.move*f.spd*dt;clampX(f);
  const pick=inp.knee?'knee':inp.high?'high':inp.low?'low':inp.cross?'cross':inp.jab?'jab':null;
  if(pick){startAtk(f,pick);sfx('whiff')}
}
function tryHit(f,o){
  const a=ATK[f.atk];
  if(o.state==='ko'||o.inv>0)return;
  const dx=(o.x-f.x)*f.d;
  if(dx<-14||dx>a.rng)return;
  f.hitDone=true;
  if(o.dodgeT>.12){o.counter=.9;popup(o.x,GY-250,t('pop.dodge'),'#7fd39a');sfx('dodge');return}
  const blocked=o.state==='block'&&o.d===-f.d;
  let dmg=a.dmg*f.pow*(1-o.def);
  if(f.counter>0){dmg*=1.4;f.counter=0;popup(f.x+f.d*60,GY-260,t('pop.counter'),'#e3a72a')}
  const knee=f.atk==='knee',strong=f.atk==='high'||knee;
  const hx=f.x+f.d*Math.min(dx,knee?72:a.rng),hy=knee?GY-118-(f.jy||0):GY-(f.atk==='low'?40:f.atk==='high'?160:176);
  if(blocked){
    if(a.gb){                                                    /* la rodilla rompe la guardia: pasa buena parte del golpe y deja aturdido */
      o.hp-=dmg*a.gb;G.rd[f.side]+=dmg*a.gb/o.maxhp;G.td[f.side]+=dmg*a.gb/o.maxhp;
      o.kx+=f.d*a.kb*.5;o.stun=a.gbs;o.state='hit';o.block=false;o.atk=null;o.flash=.14;
      burst(hx,hy,'#ffcc4d',12);hitFx(hx,hy,3.5,'#ffcc4d');popup(o.x,GY-250,t('pop.gb'),'#ffcc4d');sfx('heavy');shake=Math.max(shake,9);
    }else{
      o.hp-=dmg*.12;o.kx+=f.d*a.kb*.4;
      if(o.ai&&Math.random()<.3+o.ai.aggr*.5){o.ai.q=['jab','cross'];o.ai.mode='idle';o.ai.pend=null}
      burst(hx,hy,'#9fb4cc',5);hitFx(hx,hy,1,'#9fb4cc');popup(o.x,GY-250,t('pop.block'),'#9fb4cc');sfx('block');shake=Math.max(shake,2);
    }
  }else{
    o.hp-=dmg;G.rd[f.side]+=dmg/o.maxhp;G.td[f.side]+=dmg/o.maxhp;o.stun=a.stun*(1-(o.ai?o.ai.blk*.5:0));o.atk=null;o.state='hit';o.block=false;o.flash=.18;o.kx+=f.d*a.kb;
    burst(hx,hy,strong?'#e3a72a':'#ffffff',knee?18:f.atk==='high'?14:8);
    hitFx(hx,hy,knee?5:f.atk==='high'?4:f.atk==='low'?3:f.atk==='cross'?2.5:1.5,strong?'#ffcc4d':'#ffffff');
    popup(o.x,GY-250,String(Math.round(dmg)),strong?'#e3a72a':'#ecebe6');
    sfx(knee?'heavy':'hit');shake=Math.max(shake,f.atk==='jab'?3:f.atk==='cross'?5:f.atk==='low'?6:knee?14:11);
  }
  if(o.hp<=0){o.hp=0;o.state='ko';o.koT=0;o.atk=null;o.stun=0;o.jy=0;o.kx+=f.d*350;sfx('ko');shake=16;G.slow=.7;G.flash=.9}
}
function burst(x,y,col,n){
  const k=TIERS[TIER].fx;n=Math.max(2,Math.round(n*k));
  if(sparks.length>90)return;
  for(let i=0;i<n;i++){const a=Math.random()*6.283,s=120+Math.random()*300;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,t:.35+Math.random()*.2,col})}
  for(let i=0;i<Math.ceil(n/3);i++){const a=-Math.PI*Math.random(),s=80+Math.random()*220;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:.5+Math.random()*.3,col:'rgba(220,240,255,.9)',r:1.8+Math.random()*2.2})}
}
function hitFx(x,y,power,col){
  fx.push({x,y,t:0,d:.16,r:16+power*5,col,k:'star'});
  fx.push({x,y,t:0,d:.24,r:8+power*2,col,k:'ring'});
}
function separate(){
  const p=G.pl,o=G.op;
  if(p.state==='ko'||o.state==='ko')return;
  const d=o.x-p.x,m=64;
  if(Math.abs(d)<m){
    const push=(m-Math.abs(d))/2,s=Math.sign(d)||1;
    p.x-=s*push;o.x+=s*push;clampX(p);clampX(o);
    /* si uno quedó pegado a las cuerdas, el otro cede el resto para no atravesarse */
    const e=o.x-p.x;
    if(Math.abs(e)<m-.5){
      if(s>0){ if(o.x>=XMAX-.5)p.x=o.x-m; else o.x=p.x+m; }
      else   { if(o.x<=XMIN+.5)p.x=o.x+m; else o.x=p.x-m; }
      clampX(p);clampX(o);
    }
  }
}

/* ---------- flujo de pelea ---------- */
function launch(cfg){
  show('fight');hideCtrl();gameplayOn();
  cancelAnimationFrame(raf);
  G={mode:cfg.mode,idx:cfg.idx,stage:cfg.stage||0,ids:cfg.ids||null,phase:'intro',pt:0,round:1,tleft:ROUND_TIME,paused:false,ko:false,winner:null,slow:0,flash:0,goT:0,count:null,td:{1:0,2:0},rd:{1:0,2:0},touchy:false,arena:cfg.mode==='solo'?arenaFor(cfg.stage||0,cfg.idx):4};
  if(cfg.mode==='solo'){G.pl=mk('p',1,true);G.op=mk(cfg.idx,2,false)}
  else{
    const i1=cfg.ids[0],i2=cfg.ids[1];
    G.pl=mk(i1,1,true);
    G.op=mk(i2,2,true,i1===i2?{trunk:'#2e74dc',glove:'#2e74dc'}:null);
  }
  fitUI();applyRes(false);showBg(getBg(G.arena));
  resetCam();sparks=[];fx=[];popClear();
  resetRound(true);clearInput();setupTouch();renderPanels();
  try{document.activeElement&&document.activeElement.blur()}catch(_){}
  $('#btn-pause').textContent=t('fight.pause');
  hudStart();PF.n=0;PF.sum=0;errs=0;
  lastTs=0;raf=requestAnimationFrame(tick);
}
function startFight(idx,stage){adBreak(()=>launch({mode:'solo',idx,stage}))}
function startVersus(ids){adBreak(()=>launch({mode:'versus',ids,idx:-1}))}
function togglePause(){
  if(!G||G.phase==='intro'||G.phase==='done')return;
  G.paused=!G.paused;$('#btn-pause').textContent=G.paused?t('fight.resume'):t('fight.pause');
  if(G.paused){clearInput();gameplayOff()}else{closeCtrl();gameplayOn()}
  $('#btn-ctrl').hidden=!G.paused;                               /* en pausa aparece el botón «Ver controles» */
}
/* ventana de controles: tabla de teclas y consejos, la misma que la del menú */
const ctrlOpen=()=>!$('#ctrl-ov').hidden;
function openCtrl(){
  if(!G||!G.paused)return;
  $('#keytab2').innerHTML=keytabHTML();
  $('#ctrl-ov').hidden=false;$('#ctrl-x').focus();
}
function closeCtrl(){
  if(!ctrlOpen())return;
  $('#ctrl-ov').hidden=true;
  const b=$('#btn-ctrl');if(!b.hidden)b.focus();
}
function hideCtrl(){$('#ctrl-ov').hidden=true;$('#btn-ctrl').hidden=true}
$('#btn-ctrl').onclick=openCtrl;
$('#ctrl-x').onclick=closeCtrl;
$('#ctrl-go').onclick=()=>{closeCtrl();if(G&&G.paused)togglePause()};
$('#ctrl-ov').addEventListener('pointerdown',e=>{if(e.target.id==='ctrl-ov')closeCtrl()});   /* tocar fuera de la ventana la cierra */
function autoPause(){if(G&&!G.paused&&G.phase!=='intro'&&G.phase!=='done')togglePause()}
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();autoPause()}});
$('#btn-pause').onclick=togglePause;
$('#btn-exit').onclick=()=>{hideCtrl();gameplayOff();cancelAnimationFrame(raf);const m=G&&G.mode;G=null;clearInput();syncGetup();show(m==='versus'?'vs':'tour')};
/* cualquier tecla o toque se salta las pantallas de presentación y de resultado del asalto */
function skipPhase(){
  if(!G||G.paused)return false;
  if((G.phase==='intro'&&G.pt>.35)||(G.phase==='end'&&G.pt>1.1)||(G.phase==='done'&&G.pt>1.2)){G.pt=99;return true}
  return false;
}
$('#cvbox').addEventListener('pointerdown',()=>{skipPhase()});

function fmtClock(t){const s=Math.max(0,Math.ceil(t*3));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function settle(f,dt){f.anim+=dt;f.x+=f.kx*dt;f.kx*=Math.pow(.002,dt);clampX(f);f.ghost+=(f.hp-f.ghost)*Math.min(1,dt*2.2);if(f.flash>0)f.flash-=dt}
/* side: 1 o 2 = ganador, 0 = empate. El ganador celebra con su baile. */
function finishFight(side,ko){
  G.phase='done';G.pt=0;G.ko=ko;G.finalWinner=side;gameplayOff();
  if(side){const w=side===1?G.pl:G.op;w.dance=w.dn||'d0';w.anim=0;w.state='idle';w.atk=null;w.block=false;w.stun=0;w.jy=0}
}
function endRound(){
  const p=G.pl,o=G.op,a=G.rd[1],b=G.rd[2];
  let w=null;if(Math.abs(a-b)>.035)w=a>b?p:o;
  if(w)w.rounds++;
  G.winner=w;G.phase='end';G.pt=0;
}
function startCount(f,s){
  f.downs++;
  const chin=Math.max(.05,f.chin-.07*(f.downs-1));
  G.count={f,s,t:0,n:1,prog:0,human:f.human,gain:4+6.5*chin,decay:20,pulse:0,
    T:Math.max(2,lerp(9.8,2.4,chin)*(.8+Math.random()*.4)+(f.downs-1)*.6)};
  G.phase='count';G.pt=0;s.atk=null;s.block=false;s.state='idle';s.stun=0;s.kx=0;
  sfx('tick');sfx('crowd');
}
function mash(side){
  if(!G||G.phase!=='count'||G.paused)return;
  const c=G.count;if(!c.human||c.f.side!==side)return;
  c.prog=Math.min(100,c.prog+c.gain);c.pulse=.12;
}
function updateCount(dt){
  const c=G.count,f=c.f,s=c.s;
  c.t+=dt;if(c.pulse>0)c.pulse-=dt;
  const n=Math.min(10,Math.floor(c.t)+1);
  if(n!==c.n){c.n=n;sfx('tick');sfx('crowd')}
  f.koT+=dt;settle(f,dt);
  const corner=f.x<480?XMAX-30:XMIN+30;
  s.x+=(corner-s.x)*Math.min(1,dt*2.5);s.d=Math.sign(f.x-s.x)||s.d;s.anim+=dt;s.state='idle';
  if(s.jy>0)s.jy=Math.max(0,s.jy-900*dt);                       /* si el golpe definitivo fue una rodilla en el aire, el ganador aterriza */
  let up=false;
  if(c.human){up=c.prog>=100;if(!up)c.prog=Math.max(0,c.prog-c.decay*dt)}
  else{c.prog=Math.min(100,c.t/c.T*100);up=c.t>=c.T}
  if(up&&c.t<10){
    f.hp=f.maxhp*(.15+.2*f.chin);f.ghost=f.hp;f.koT=Math.min(f.koT,.25);G.phase='rise';G.pt=0;sfx('bell');
  }else if(c.t>=10){finishFight(s.side,true);G.count=null}
}
function update(dt){
  G.pt+=dt;updateCam(dt);if(G.flash>0)G.flash-=dt*2.2;if(G.goT>0)G.goT-=dt;
  const p=G.pl,o=G.op;
  if(G.phase==='intro'){if(G.pt>3.2){G.phase='ready';G.pt=0;sfx('bell')}return}
  if(G.phase==='ready'){
    p.anim+=dt;o.anim+=dt;
    if(G.pt>.85){G.phase='fight';G.pt=0;G.goT=.8;sfx('bell')}
    return;
  }
  if(G.phase==='fight'){
    const pi=humanInput(1,dt),oi=o.human?humanInput(2,dt):aiInput(dt);
    step(p,o,pi,dt);step(o,p,oi,dt);separate();
    [p,o].forEach(f=>{if(f.used){if(f.human)delete buf[f.side][f.used];f.used=null}});
    G.tleft-=dt;
    if(p.state==='ko')startCount(p,o);
    else if(o.state==='ko')startCount(o,p);
    else if(G.tleft<=0){G.tleft=0;endRound()}
  }else if(G.phase==='count'){
    updateCount(dt);
  }else if(G.phase==='rise'){
    const c=G.count,f=c.f,s=c.s;
    f.koT-=dt;settle(f,dt);s.anim+=dt;
    if(f.koT<=0){
      f.koT=0;f.state='idle';f.inv=1.3;f.stun=0;f.atk=null;G.phase='fight';G.pt=0;G.count=null;
      const dir=Math.sign(s.x-f.x)||1;s.x=f.x+dir*240;clampX(s);
    }
  }else if(G.phase==='end'){
    step(p,o,NOINP,dt);step(o,p,NOINP,dt);
    if(G.pt>2.8){
      if(G.round>=3){
        /* decisión: más asaltos ganados; si igualan, más daño causado; si tampoco hay diferencia, empate */
        let side=0;
        if(p.rounds!==o.rounds)side=p.rounds>o.rounds?1:2;
        else if(Math.abs(G.td[1]-G.td[2])>.05)side=G.td[1]>G.td[2]?1:2;
        finishFight(side,false);
      }else{G.round++;resetRound(false);G.phase='ready';G.pt=0;sfx('bell')}
    }
  }else if(G.phase==='done'){
    [p,o].forEach(f=>{if(f.state==='ko'){f.koT+=dt;settle(f,dt)}else f.anim+=dt});
    if(G.pt>(G.finalWinner?3.8:2.5)){                           /* el ganador tiene un rato para bailar */
      const side=G.finalWinner,ko=G.ko,mode=G.mode,idx=G.idx,ids=G.ids,stage=G.stage,kd=G.op.downs;
      cancelAnimationFrame(raf);G=null;clearInput();syncGetup();
      if(mode==='solo')fightEnded(idx,side===1?'win':side===2?'loss':'draw',ko,kd,stage);else versusEnded(side,ids,ko);
      return;
    }
  }
  for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.t-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=900*dt;if(s.t<=0)sparks.splice(i,1)}
  for(let i=fx.length-1;i>=0;i--){fx[i].t+=dt;if(fx[i].t>=fx[i].d)fx.splice(i,1)}
  for(let i=pops.length-1;i>=0;i--){const s=pops[i];s.t-=dt;s.y-=40*dt;if(s.t<=0){popFree(s);pops.splice(i,1)}}
  shake*=Math.pow(.01,dt);
}
/* botones de levantarse (móvil) */
function syncGetup(){
  [1,2].forEach(side=>{
    const on=!!(G&&G.touchy&&G.phase==='count'&&G.count&&G.count.human&&G.count.f.side===side);
    const el=$('#gu'+side);if(el.hidden===on)el.hidden=!on;
  });
}
$$('.gu').forEach(el=>{
  el.addEventListener('pointerdown',e=>{e.preventDefault();mash(+el.dataset.side)});
  el.addEventListener('contextmenu',e=>e.preventDefault());
});

/* ---------- bucle principal ----------
   El tiempo de juego sigue al reloj real: si un fotograma tarda, se simulan varios pasos pequeños (de 1/60 s como máximo)
   en vez de ir a cámara lenta. Así el juego no se "arrastra" cuando el equipo va justo. */
let errs=0;
function tick(ts){
  if(!G)return;
  raf=requestAnimationFrame(tick);                      /* se reprograma primero: un error no puede parar el juego */
  let real=lastTs?(ts-lastTs)/1000:0;lastTs=ts;
  if(!(real>0))real=0;
  perfSample(real);
  let dt=Math.min(real,.1);
  try{
    if(G.slow>0){G.slow-=dt;dt*=.4}
    if(!G.paused&&dt>0){
      const n=Math.ceil(dt*60-1e-6)||1,h=dt/n;
      for(let i=0;i<n&&G;i++)update(h);
    }
    if(!G)return;
    draw();syncGetup();
  }catch(err){
    console.error(err);
    if(++errs>30){cancelAnimationFrame(raf);hudMessage(t('err'))}
  }
}

/* render.js · dibujo del combate. El lienzo (canvas) solo pinta luchadores y golpes;
   el fondo es otra capa que mueve la tarjeta gráfica y el marcador y los textos son HTML (nítidos y en cualquier idioma). */
const cam={x:0,z:1};
function resetCam(){cam.x=0;cam.z=1}
function updateCam(dt){
  const p=G.pl,o=G.op,dist=Math.abs(p.x-o.x),mid=(p.x+o.x)/2;
  const tz=G.phase==='count'?1.08:1+clamp((430-dist)/1500,0,.05);
  cam.z+=(tz-cam.z)*Math.min(1,dt*1.6);
  const vw=W/cam.z,tx=clamp(mid-vw/2,0,W-vw);
  cam.x+=(tx-cam.x)*Math.min(1,dt*2.4);
}

/* ---------- ayudas para tocar el HTML solo cuando algo cambia ---------- */
const UI={};
['ui','flash','hpt1','hpt2','hb1','hb2','hg1','hg2','hf1','hf2','hnm1','hnm2','hnk1','hnk2','hclk','hrd','hd1','hd2','pops',
 'ov-intro','ov-count','banner','bn-t','bn-a','bn-b','skip','in-sub','in-arena','in-p1','in-p2','in-n1','in-n2','in-k1','in-k2','in-f1','in-f2',
 'ct-k','ct-n','ct-w','ct-p','ct-bar','ct-b','msg'].forEach(id=>{UI[id]=document.getElementById(id)});
const hs=(el,on)=>{const h=!on;if(el._h!==h){el._h=h;el.hidden=h}};
const tx=(el,s)=>{if(el._t!==s){el._t=s;el.textContent=s}};
const hh=(el,s)=>{if(el._t!==s){el._t=s;el.innerHTML=s}};
const cl=(el,c)=>{if(el._c!==c){el._c=c;el.className=c}};
const tf=(el,v)=>{if(el._f!==v){el._f=v;el.style.transform=v}};
const op=(el,v)=>{if(el._o!==v){el._o=v;el.style.opacity=v}};
let boxScale=1;
function fitScale(box,el){const w=box.clientWidth;if(!w)return 1;const s=w/W;el.style.transform='scale('+s+')';return s}
function fitUI(){boxScale=fitScale($('#cvbox'),UI.ui);UI.ui.classList.toggle('sm',boxScale<.62)}
window.addEventListener('resize',fitUI);
if(window.ResizeObserver)new ResizeObserver(fitUI).observe($('#cvbox'));

/* capa del fondo */
let bgEl=null;
function showBg(c){
  if(bgEl===c)return;
  const box=$('#cvbox');
  c.className='bgc';c.setAttribute('aria-hidden','true');c._f=null;
  if(bgEl&&bgEl.parentNode===box)box.replaceChild(c,bgEl);else box.insertBefore(c,box.firstChild);
  bgEl=c;
}

/* ---------- luchadores y efectos ---------- */
function paintFigure(f){
  /* el que baila se dibuja siempre a mano: sus poses cambian sin parar y no merece la pena guardarlas */
  if(TIERS[TIER].sprites&&!SPR.off&&!f.dance)ctx.drawImage(getSprite(f),SB.x,SB.y,SB.w,SB.h);
  else drawFigure(ctx,f);
}
function drawFighter(f){
  const jy=f.jy||0;                                            /* altura del salto (rodilla): la sombra se queda en el suelo */
  drawShadow(ctx,f.x,GY+8,jy>0?Math.max(.4,1-jy/140):1);
  if(f.dodgeT>.12){
    ctx.save();ctx.globalAlpha=.22;ctx.translate(f.x-f.d*34,f.y);ctx.scale(f.d,1);paintFigure(f);ctx.restore();
    ctx.save();ctx.globalAlpha=.4;ctx.translate(f.x-f.d*16,f.y);ctx.scale(f.d,1);paintFigure(f);ctx.restore();
  }
  ctx.save();ctx.translate(f.x,f.y-jy);ctx.scale(f.d,1);
  if(f.dodgeT>.12)ctx.globalAlpha=.7;
  if(f.inv>0&&f.state!=='ko')ctx.globalAlpha=.6+.4*Math.sin(f.anim*40);
  if(f.state==='ko'){const pr=Math.min(1,f.koT*4);ctx.translate(0,-20*pr);ctx.rotate(-pr*Math.PI/2*.98)}
  paintFigure(f);
  ctx.restore();
}
function drawFx(){
  for(const s of fx){
    const p=Math.min(1,s.t/s.d);
    ctx.save();ctx.translate(s.x,s.y);
    if(s.k==='star'){
      const r=s.r*(.5+p*.9);ctx.globalAlpha=1-p;ctx.fillStyle=s.col;ctx.beginPath();
      for(let i=0;i<16;i++){const a=i*Math.PI/8,rr=i%2?r*.38:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}
      ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff';ctx.globalAlpha=(1-p)*.9;ctx.beginPath();ctx.arc(0,0,r*.28,0,7);ctx.fill();
    }else{
      ctx.globalAlpha=(1-p)*.8;ctx.strokeStyle=s.col;ctx.lineWidth=4*(1-p)+1;ctx.beginPath();ctx.arc(0,0,s.r+p*46,0,7);ctx.stroke();
    }
    ctx.restore();
  }
  ctx.globalAlpha=1;
}
function drawParticles(){
  for(const s of sparks){
    ctx.globalAlpha=Math.max(0,Math.min(1,s.t*3));ctx.fillStyle=s.col;
    if(s.r){ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);ctx.fill()}else ctx.fillRect(s.x-3,s.y-3,6,6);
  }
  ctx.globalAlpha=1;
}

/* ---------- textos flotantes (HTML) ---------- */
function popup(x,y,txt,col){
  if(pops.length>6)popFree(pops.shift());
  pops.push({x,y,t:.9,txt,col:col||'#ecebe6'});
}
function popFree(s){if(s.el){s.el.remove();s.el=null}}
function popClear(){pops.forEach(popFree);pops=[]}
function popsFrame(z,cy,sx,sy){
  for(const s of pops){
    if(!s.el){const d=document.createElement('b');d.className='pop';d.textContent=s.txt;d.style.color=s.col;UI.pops.appendChild(d);s.el=d}
    const X=(s.x-cam.x)*z+sx,Y=(s.y-cy)*z+sy;
    s.el.style.transform='translate('+X.toFixed(1)+'px,'+Y.toFixed(1)+'px) translate(-50%,-50%)';
    s.el.style.opacity=Math.min(1,s.t*2).toFixed(2);
  }
}

/* ---------- marcador y mensajes (HTML) ---------- */
function hudText(){
  if(!G)return;
  const p=G.pl,o=G.op,vs=G.mode==='versus';
  tx(UI.hnm1,(vs?t('hud.p1')+' · ':'')+fName(p.id));tx(UI.hnm2,(vs?t('hud.p2')+' · ':'')+fName(o.id));
  tx(UI.hnk1,'“'+fNick(p.id)+'”');tx(UI.hnk2,'“'+fNick(o.id)+'”');
  tx(UI['in-n1'],fName(p.id));tx(UI['in-n2'],fName(o.id));
  tx(UI['in-k1'],'“'+fNick(p.id)+'”');tx(UI['in-k2'],'“'+fNick(o.id)+'”');
  hh(UI['in-f1'],fichaHTML(p.id));hh(UI['in-f2'],fichaHTML(o.id));          /* ficha: país, récord, peso y altura */
  tx(UI['in-sub'],vs?t('intro.versus'):t('intro.t',{s:t('stage.'+G.stage),c:fCls(G.idx)}));
  tx(UI['in-arena'],arenaName(G.arena));
  tx(UI.skip,t('skip'));
}
function hudStart(){
  const p=G.pl,o=G.op;
  UI.hpt1.src=UI['in-p1'].src=srcFor(p.id);UI.hpt2.src=UI['in-p2'].src=srcFor(o.id);
  hudText();
  ['hf1','hf2','hg1','hg2'].forEach(k=>tf(UI[k],'scaleX(1)'));
  hs(UI.msg,false);hs(UI['ov-intro'],false);hs(UI['ov-count'],false);hs(UI.banner,false);hs(UI.skip,false);
  G.introGo=false;op(UI.flash,'0');
}
function hudMessage(s){tx(UI.msg,s);hs(UI.msg,true)}
function bar(i,f){
  const r=clamp(f.hp/f.maxhp,0,1),g=clamp(f.ghost/f.maxhp,0,1);
  tf(UI['hf'+i],'scaleX('+r.toFixed(3)+')');tf(UI['hg'+i],'scaleX('+g.toFixed(3)+')');
  cl(UI['hb'+i],'hb p'+i+(r<.3?' low':''));
}
function dots(el,n){
  const k=el.children;
  for(let i=0;i<3;i++){const on=i<n;if(k[i]._on!==on){k[i]._on=on;k[i].className=on?'on':''}}
}
function banner(title,a,b,cls){
  hs(UI.banner,title!=null);if(title==null)return;
  tx(UI['bn-t'],title);tx(UI['bn-a'],a||'');tx(UI['bn-b'],b||'');cl(UI.banner,'banner '+(cls||''));
}
function bannerFrame(){
  const ph=G.phase;
  if(G.paused)return banner(t('paused'),'','','gold');
  if(ph==='ready')return banner(t('round',{n:G.round}),'','','white');
  if(ph==='fight'&&G.goT>0)return banner(t('go'),'','','gold');
  if(ph==='rise')return banner(t('cnt.up'),'','','green');
  if(ph==='end')return banner(t('end.round'),G.winner?t('end.for',{n:fName(G.winner.id)}):t('end.draw'),t('end.score',{a:G.pl.rounds,b:G.op.rounds}),'white');
  if(ph==='done'){
    const w=G.finalWinner;
    if(!w)return banner(t('end.tie'),t('end.tie.d'),'','white');
    /* tras un momento el mensaje sube para dejar ver el baile del ganador */
    return banner(G.ko?t('end.ko'):t('end.dec'),t('end.wins',{n:fName((w===1?G.pl:G.op).id)}),'',(G.ko?'red big':'white')+(G.pt>1.5?' top':''));
  }
  banner(null);
}
function countFrame(){
  const c=G.count,f=c.f;
  tx(UI['ct-k'],t('cnt.knock',{n:fName(f.id)}));
  tx(UI['ct-n'],String(c.n));cl(UI['ct-n'],c.n>=8?'cn red':'cn');
  tx(UI['ct-w'],numWord(c.n)+'…');
  const key=f.side===2&&G.mode==='versus'?t('key.enter'):t('key.space');
  tx(UI['ct-p'],c.human?(G.touchy?t('cnt.touch'):t('cnt.mash',{k:key})):t('cnt.ai',{n:fName(f.id)}));
  cl(UI['ct-p'],c.human&&c.pulse>0?'cp hot':'cp');
  tf(UI['ct-b'],'scaleX('+(c.prog/100).toFixed(3)+')');
  cl(UI['ct-bar'],c.prog>70?'cb ok':'cb');
}
function hudFrame(z,cy,sx,sy){
  const p=G.pl,o=G.op,ph=G.phase;
  bar(1,p);bar(2,o);
  tx(UI.hclk,fmtClock(G.tleft));cl(UI.hclk,G.tleft<10&&ph==='fight'?'tm low':'tm');
  tx(UI.hrd,t('hud.round',{n:G.round}));
  dots(UI.hd1,p.rounds);dots(UI.hd2,o.rounds);
  const intro=ph==='intro';
  hs(UI['ov-intro'],intro);
  if(intro&&!G.introGo){const el=UI['ov-intro'];el.classList.remove('go');void el.offsetWidth;el.classList.add('go');G.introGo=true}
  const cnt=ph==='count';
  hs(UI['ov-count'],cnt);if(cnt)countFrame();
  bannerFrame();
  hs(UI.skip,!G.paused&&((intro&&G.pt>.35)||(ph==='end'&&G.pt>1.1)||(ph==='done'&&G.pt>1.2)));
  op(UI.flash,G.flash>0?Math.min(.8,G.flash).toFixed(2):'0');
  popsFrame(z,cy,sx,sy);
}

/* ---------- fotograma completo ---------- */
function draw(){
  const z=Math.round(cam.z*1000)/1000,cy=(H-H/z)*.85,k=cv.width/W;
  const sx=shake>.3?(Math.random()-.5)*shake:0,sy=shake>.3?(Math.random()-.5)*shake:0;
  if(bgEl)tf(bgEl,'translate3d('+((-cam.x*z+sx)*boxScale).toFixed(2)+'px,'+((-cy*z+sy)*boxScale).toFixed(2)+'px,0) scale('+z+')');
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);
  ctx.setTransform(k*z,0,0,k*z,(-cam.x*z+sx)*k,(-cy*z+sy)*k);
  const p=G.pl,o=G.op;
  (p.state==='ko'?[p,o]:[o,p]).forEach(drawFighter);
  drawFx();drawParticles();
  hudFrame(z,cy,sx,sy);
}

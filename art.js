/* art.js · todo el dibujo: luchadores, retratos y ring 2D (se pinta con canvas, sin imágenes externas) */
const OUT='#0d0d10';

/* ---------- utilidades de color ---------- */
const shadeMemo=new Map();
function shade(hex,k){
  const key=hex+k;let v=shadeMemo.get(key);if(v)return v;
  const n=parseInt(hex.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;
  const f=x=>Math.max(0,Math.min(255,Math.round(x*k)));
  v='rgb('+f(r)+','+f(g)+','+f(b)+')';
  if(shadeMemo.size>700)shadeMemo.clear();
  shadeMemo.set(key,v);return v;
}
function extension(f){
  const a=ATK[f.atk];if(!a)return 0;
  const t=f.at;
  if(t<a.start)return t/a.start;
  if(t<a.start+a.act)return 1;
  return Math.max(0,1-(t-a.start-a.act)/a.rec);
}

/* ---------- piezas del cuerpo ---------- */
function strokePts(c,pts,w,col,dx,dy,alpha){
  c.globalAlpha=alpha;c.strokeStyle=col;c.lineWidth=w;c.beginPath();
  c.moveTo(pts[0][0]+dx,pts[0][1]+dy);
  for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0]+dx,pts[i][1]+dy);
  c.stroke();c.globalAlpha=1;
}
function limb(c,pts,w,col,lit){
  c.lineCap='round';c.lineJoin='round';
  strokePts(c,pts,w+5,OUT,0,0,1);
  strokePts(c,pts,w,col,0,0,1);
  if(lit){
    strokePts(c,pts,w*.3,'#fff',-w*.16,-w*.2,.24);
    strokePts(c,pts,w*.32,'#000',w*.2,w*.24,.16);
  }
}
function glove(c,x,y,r,col,ang,gs,c2){
  c.save();c.translate(x,y);c.rotate(ang);
  c.fillStyle='#ecebe6';c.strokeStyle=OUT;c.lineWidth=2.5;
  c.beginPath();c.roundRect(-r-10,-r*.58,13,r*1.16,3);c.fill();c.stroke();
  c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1.5;c.beginPath();c.moveTo(-r-6,-r*.5);c.lineTo(-r-6,r*.5);c.stroke();
  const g=c.createRadialGradient(r*.25,-r*.4,r*.1,0,0,r*1.2);
  g.addColorStop(0,shade(col,1.45));g.addColorStop(.5,col);g.addColorStop(1,shade(col,.55));
  c.fillStyle=g;c.strokeStyle=OUT;c.lineWidth=3;
  c.beginPath();c.ellipse(0,0,r*1.1,r,0,0,7);c.fill();c.stroke();
  if(gs&&gs!=='plain')gloveDeco(c,r,col,gs,c2||'#ecebe6');
  c.fillStyle=shade(col,.78);c.lineWidth=2;
  c.beginPath();c.ellipse(r*.3,r*.58,r*.58,r*.3,.25,0,7);c.fill();c.stroke();
  c.strokeStyle='rgba(0,0,0,.32)';c.lineWidth=2;c.beginPath();c.arc(-r*.05,0,r*.62,-1.15,1.15);c.stroke();
  c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.ellipse(r*.18,-r*.52,r*.42,r*.17,-.3,0,7);c.fill();
  c.restore();
}
function swoosh(c,a,b,k){
  if(k<.15)return;
  c.save();c.lineCap='round';
  [[22,.08],[13,.16],[6,.34]].forEach(([w,al])=>{
    c.strokeStyle='rgba(255,255,255,'+(al*k).toFixed(3)+')';c.lineWidth=w;
    c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();
  });
  c.restore();
}

/* ---------- cabeza de perfil ---------- */
const CAP_STYLES={short:1,curly:1,quiff:1,afro:1,spiky:1};      /* peinados con la "gorra" de pelo normal */
function drawHead(c,f,x,y,dmo){
  const ph=photoImg(f.id);
  c.save();c.translate(x,y);
  if(ph){
    c.scale(f.d||1,1);
    c.save();c.beginPath();c.arc(0,0,33,0,7);c.clip();c.drawImage(ph,-33,-33,66,66);
    if(f.flash>0){c.fillStyle='rgba(217,56,47,.55)';c.fillRect(-33,-33,66,66)}
    c.restore();
    c.strokeStyle=OUT;c.lineWidth=3.5;c.beginPath();c.arc(0,0,33,0,7);c.stroke();
    c.restore();return;
  }
  const skin=f.skin,hair=f.hair,dark=hair==='#c9c9c9'?'#666':hair;
  const st=f.state,dm=dmo!=null?dmo:(f.maxhp?Math.max(0,Math.min(1,1-f.hp/f.maxhp)):0);
  /* pelo que queda detrás de la cabeza */
  c.fillStyle=hair;c.strokeStyle=OUT;c.lineWidth=2.5;c.lineJoin='round';
  if(f.style==='afro'){
    c.beginPath();c.ellipse(-8,-13,41,42,0,0,7);c.fill();c.stroke();
    c.fillStyle='rgba(255,255,255,.1)';[[-26,-30,6],[-6,-44,5],[14,-36,5],[-34,-8,5],[-30,12,4]].forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r,0,7);c.fill()});
  }
  else if(f.style==='curly'){                                    /* rizos cortos: bolitas de pelo alrededor de la nuca y la coronilla */
    [[-27,-8,9],[-28,7,8],[-24,-22,10],[-12,-34,10],[3,-39,10],[17,-35,9],[26,-26,7]].forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r,0,7);c.fill();c.stroke()});
  }
  else if(f.style==='topknot'){c.beginPath();c.arc(-4,-41,12,0,7);c.fill();c.stroke()}
  // cabeza con luz
  const fg=c.createRadialGradient(10,-10,4,0,2,44);
  fg.addColorStop(0,shade(skin,1.16));fg.addColorStop(.6,skin);fg.addColorStop(1,shade(skin,.8));
  c.fillStyle=fg;c.strokeStyle=OUT;c.lineWidth=3;
  c.beginPath();c.ellipse(0,0,29,33,0,0,7);c.fill();c.stroke();
  c.fillStyle='rgba(0,0,0,.1)';c.beginPath();c.ellipse(-3,18,19,14,0,0,7);c.fill();
  c.fillStyle='rgba(220,90,80,'+(.1+dm*.12)+')';c.beginPath();c.ellipse(15,10,9,6,0,0,7);c.fill();
  // oreja
  c.fillStyle=shade(skin,.86);c.beginPath();c.ellipse(-9,4,6,9.5,0,0,7);c.fill();c.stroke();
  c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=1.5;c.beginPath();c.arc(-9,4,3,.5,3.6);c.stroke();
  // nariz
  c.fillStyle=shade(skin,1.02);c.strokeStyle=OUT;c.lineWidth=3;
  c.beginPath();c.moveTo(27,-4);c.lineTo(39,9);c.lineTo(27,12.5);c.closePath();c.fill();c.stroke();
  c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(32,11,2.4,1.4,0,0,7);c.fill();
  // pelo y barba
  c.save();c.beginPath();c.ellipse(0,0,29,33,0,0,7);c.clip();
  c.fillStyle=hair;
  if(CAP_STYLES[f.style]){
    c.beginPath();c.moveTo(-36,-42);c.lineTo(34,-42);c.lineTo(31,-17);c.lineTo(14,-15);c.lineTo(3,-9);c.lineTo(-8,-3);c.lineTo(-13,12);c.lineTo(-36,16);c.closePath();c.fill();
    c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=2;
    for(let i=0;i<4;i++){c.beginPath();c.moveTo(-26+i*10,-30);c.quadraticCurveTo(-18+i*10,-24,-14+i*9,-12);c.stroke()}
    c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=2;c.beginPath();c.moveTo(34,-42);c.lineTo(31,-17);c.lineTo(14,-15);c.lineTo(3,-9);c.lineTo(-8,-3);c.lineTo(-13,12);c.stroke();
  }
  if(f.style==='buzz'||f.style==='mohawk'||f.style==='topknot'){
    c.globalAlpha=.42;c.beginPath();c.moveTo(-36,-42);c.lineTo(34,-42);c.lineTo(31,-20);c.lineTo(10,-14);c.lineTo(-6,-6);c.lineTo(-13,12);c.lineTo(-36,16);c.closePath();c.fill();c.globalAlpha=1;
  }
  if(f.style==='bald'){c.fillStyle='rgba(255,255,255,.3)';c.beginPath();c.ellipse(-2,-24,12,5,-.3,0,7);c.fill()}
  if(f.beard){
    c.fillStyle=hair;c.beginPath();c.moveTo(-9,6);c.lineTo(30,8);c.lineTo(30,22);c.lineTo(20,36);c.lineTo(-4,38);c.lineTo(-12,26);c.closePath();c.fill();
    c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=2;c.stroke();
    c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=1.5;for(let i=0;i<5;i++){c.beginPath();c.moveTo(-4+i*6,12);c.lineTo(-2+i*6,32);c.stroke()}
  }
  c.restore();
  if(f.style==='mohawk'){
    c.fillStyle=hair;c.strokeStyle=OUT;c.lineWidth=2.5;
    c.beginPath();c.moveTo(-22,-24);c.lineTo(-18,-46);c.lineTo(-4,-40);c.lineTo(6,-54);c.lineTo(16,-40);c.lineTo(24,-48);c.lineTo(24,-22);c.closePath();c.fill();c.stroke();
  }
  if(f.style==='spiky'){
    c.fillStyle=hair;c.strokeStyle=OUT;c.lineWidth=2.5;c.lineJoin='round';
    c.beginPath();c.moveTo(-25,-19);c.lineTo(-31,-42);c.lineTo(-17,-33);c.lineTo(-14,-55);c.lineTo(-2,-38);c.lineTo(7,-59);c.lineTo(13,-38);c.lineTo(25,-52);c.lineTo(25,-19);c.closePath();c.fill();c.stroke();
  }
  if(f.style==='quiff'){                                         /* tupé: el pelo sube y se echa hacia delante */
    c.fillStyle=hair;c.strokeStyle=OUT;c.lineWidth=2.5;c.lineJoin='round';
    c.beginPath();c.moveTo(-27,-16);c.bezierCurveTo(-35,-40,-12,-55,16,-50);c.bezierCurveTo(34,-46,38,-30,30,-19);c.lineTo(10,-20);c.lineTo(-16,-12);c.closePath();c.fill();c.stroke();
    c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=2;
    for(let i=0;i<3;i++){c.beginPath();c.moveTo(-16+i*13,-26);c.quadraticCurveTo(-12+i*13,-40,4+i*13,-44);c.stroke()}
  }
  // cicatriz
  if(f.scar){
    c.strokeStyle='#c76b6b';c.lineWidth=3;c.beginPath();c.moveTo(6,-16);c.lineTo(19,3);c.stroke();
    c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.moveTo(7+i*4.5,-12+i*6);c.lineTo(14+i*4.5,-15+i*6);c.stroke()}
  }
  // ojo y ceja
  c.lineCap='round';
  if(st==='ko'){
    c.strokeStyle=OUT;c.lineWidth=3;c.beginPath();c.moveTo(10,-9);c.lineTo(20,1);c.moveTo(20,-9);c.lineTo(10,1);c.stroke();
  }else if(st==='hit'){
    c.strokeStyle=OUT;c.lineWidth=3.6;c.beginPath();c.moveTo(9,-4);c.lineTo(21,-3);c.stroke();
  }else{
    c.fillStyle='#fff';c.strokeStyle=OUT;c.lineWidth=2;c.beginPath();c.ellipse(15,-5,6.8,st==='block'?3.6:5.2,0,0,7);c.fill();c.stroke();
    c.fillStyle='#2a1b10';c.beginPath();c.arc(17.8,-5,3.1,0,7);c.fill();
    c.fillStyle='#fff';c.beginPath();c.arc(18.8,-6.2,1.1,0,7);c.fill();
  }
  c.strokeStyle=dark;c.lineWidth=5;c.beginPath();c.moveTo(5,-15.5);c.lineTo(24,st==='hit'?-14:-10);c.stroke();
  // golpes acumulados
  if(dm>.18){c.fillStyle='rgba(90,40,130,'+Math.min(.55,dm*.7)+')';c.beginPath();c.ellipse(15,2,8,4,.2,0,7);c.fill()}
  if(dm>.38){c.strokeStyle='#b3201d';c.lineWidth=2.4;c.beginPath();c.moveTo(13,-17);c.lineTo(17,-11);c.stroke()}
  if(dm>.6){c.strokeStyle='rgba(190,25,25,.9)';c.lineWidth=2.6;c.beginPath();c.moveTo(34,13);c.quadraticCurveTo(36,20,33,28);c.stroke()}
  // boca
  if(st==='hit'||st==='ko'){c.fillStyle='#5a1818';c.strokeStyle=OUT;c.lineWidth=2;c.beginPath();c.ellipse(23,18,5,6.4,0,0,7);c.fill();c.stroke();c.fillStyle='#f2f0ea';c.fillRect(19,13.5,8,2.6)}
  else{c.strokeStyle='#4a1a1a';c.lineWidth=3.6;c.beginPath();c.moveTo(17,18);c.lineTo(28,17);c.stroke()}
  if(dm>.78){c.strokeStyle='rgba(190,25,25,.9)';c.lineWidth=2.2;c.beginPath();c.moveTo(27,19);c.lineTo(28,26);c.stroke()}
  c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(6,-22,5,2,-.3,0,7);c.fill();
  if(f.flash>0){c.fillStyle='rgba(217,56,47,.35)';c.beginPath();c.ellipse(0,0,29,33,0,0,7);c.fill()}
  c.restore();
}

/* ---------- cuerpo completo (vista lateral, mira a +x) ---------- */
function drawTorso(c,f,hip,sh){
  const sx=sh[0],sy=sh[1],hx=hip[0],hy=hip[1]-16,skin=f.skin;
  c.beginPath();
  c.moveTo(sx-20,sy-8);
  c.bezierCurveTo(sx-27,sy+30,hx-23,hy-22,hx-16,hy);
  c.lineTo(hx+18,hy);
  c.bezierCurveTo(hx+20,hy-24,sx+34,sy+34,sx+26,sy+8);
  c.quadraticCurveTo(sx+26,sy-8,sx+10,sy-12);
  c.quadraticCurveTo(sx-4,sy-20,sx-20,sy-8);
  c.closePath();
  const g=c.createLinearGradient(sx-24,0,sx+30,0);
  g.addColorStop(0,shade(skin,.74));g.addColorStop(.35,shade(skin,.98));g.addColorStop(.72,shade(skin,1.16));g.addColorStop(1,shade(skin,.9));
  c.fillStyle=g;c.fill();c.strokeStyle=OUT;c.lineWidth=3.5;c.stroke();
  const ax=t=>lerp(sx,hx,t),ay=t=>lerp(sy,hy,t);
  c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=2.4;c.lineCap='round';
  c.beginPath();c.moveTo(ax(.14)-2,ay(.14)+8);c.quadraticCurveTo(ax(.14)+12,ay(.14)+16,ax(.14)+26,ay(.14)+6);c.stroke();
  c.beginPath();c.moveTo(ax(.25)+4,ay(.25)-2);c.lineTo(ax(.82)+4,ay(.82));c.stroke();
  [.42,.56,.7].forEach(t=>{c.beginPath();c.moveTo(ax(t)-5,ay(t));c.lineTo(ax(t)+16,ay(t)+1);c.stroke()});
  c.fillStyle='rgba(255,255,255,.14)';c.beginPath();c.ellipse(ax(.2)+16,ay(.2)+6,7,4,.3,0,7);c.fill();
  c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.arc(ax(.9)+4,ay(.9)-2,1.8,0,7);c.fill();
}
function drawTrunks(c,f,hip){
  const hx=hip[0],hy=hip[1],ts=f.ts;
  const g=c.createLinearGradient(0,hy-24,0,hy+24);
  g.addColorStop(0,shade(f.trunk,1.3));g.addColorStop(.5,f.trunk);g.addColorStop(1,shade(f.trunk,.58));
  c.fillStyle=g;c.strokeStyle=OUT;c.lineWidth=3.2;
  trunkPath(c,hx,hy);c.fill();
  if(ts&&ts!=='plain')trunkDeco(c,hx,hy,f);
  trunkPath(c,hx,hy);c.stroke();
  c.strokeStyle='rgba(0,0,0,.28)';c.lineWidth=2;
  c.beginPath();c.moveTo(hx-14,hy-10);c.quadraticCurveTo(hx-8,hy+6,hx-16,hy+20);c.moveTo(hx+14,hy-8);c.quadraticCurveTo(hx+20,hy+8,hx+18,hy+20);c.stroke();
  drawWaist(c,f,hip);
  // franja lateral
  c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=4.5;c.lineCap='round';c.beginPath();c.moveTo(hx+23,hy-12);c.lineTo(hx+29,hy+20);c.stroke();
  c.strokeStyle=ts&&ts!=='plain'&&f.t2?f.t2:shade(f.glove,1.1);c.lineWidth=2;c.beginPath();c.moveTo(hx+26,hy-12);c.lineTo(hx+32,hy+20);c.stroke();
}
/* rot = giro del pie (puntas arriba en las patadas, abajo en la rodilla); kn = rodilla fija (si no, se calcula);
   tube = pierna levantada, que se dibuja encima de las calzonas: la calzona le sigue el muslo (ver shortsTube) */
function drawLeg(c,f,hip,foot,rot,kn,tube){
  const k=kn||[(hip[0]+foot[0])/2+10,(hip[1]+foot[1])/2-5];
  limb(c,[hip,k],27,f.skin,true);
  limb(c,[k,foot],19,f.skin,true);
  c.save();c.translate(foot[0]+9,foot[1]-4);c.rotate(rot||0);bareFoot(c,f);c.restore();      /* pie descalzo: sin tibiales, botas ni calcetines */
  ankle(c,f,foot);
  if(tube){shortsTube(c,f,hip,k);drawWaist(c,f,hip)}
}
function drawArm(c,f,sh,h,upW,loW,ang){
  const el=[(sh[0]+h[0])/2,(sh[1]+h[1])/2+ang];
  limb(c,[sh,el],upW,f.skin,true);
  limb(c,[el,h],loW,f.skin,true);
  glove(c,h[0],h[1],16,f.glove,Math.atan2(h[1]-el[1],h[0]-el[0]),f.gs,f.c2);
}
function drawFigure(c,f,ov){
  /* baile de victoria (solo si el luchador no está en el suelo ni recibiendo un golpe) */
  const dz=f.dance&&f.state!=='ko'&&f.state!=='hit'?dancePose(f.dance,f.anim):null;
  const hit=f.state==='hit',blk=f.state==='block',dod=f.state==='dodge';
  const bob=dz?(dz.bob||0):ov?ov.bob:((f.state==='idle'||blk)?Math.sin(f.anim*6)*3:0);
  const walk=ov?ov.walk:(f.state==='walk'?Math.sin(f.anim*12):0);
  const e=ov?ov.e:extension(f),atk=f.atk,skin=f.skin;
  const lean=dz?(dz.lean||0):hit?-16:dod?-26:blk?6:atk==='cross'?16*e:atk==='jab'?8*e:atk==='high'?-12*e:atk==='low'?10*e:atk==='knee'?9*e:0;
  const duck=dod?26:0;
  const hip=[dod?-10:0,-100+bob+(dod?10:0)];
  const sh=[lean,-166+bob+duck];
  const head=[lean+(hit?-6:(atk==='jab'||atk==='cross')?5*e:0)+(blk?5:0),-200+bob+duck+(blk?5:0)];
  let bf=[-26-walk*12,0],ff=[26+walk*12,0],kn=null,brot=0;
  if(atk==='low'){bf=[lerp(-26,ATK.low.rng-12,e),lerp(0,-36,e)];brot=-.5*e}
  if(atk==='high'){bf=[lerp(-26,ATK.high.rng-30,e),lerp(0,-150,e)];brot=-.5*e}
  if(atk==='knee'){                                              /* rodilla en salto: la pierna de atrás sube hasta la altura del pecho */
    kn=[lerp(-3,58,e),lerp(-55,-118,e)+bob];
    bf=[lerp(-26,kn[0]-14,e),lerp(0,kn[1]+60,e)];
    ff=[lerp(26,10,e),lerp(0,-12,e)];
    brot=.85*e;
  }
  if(dod){bf=[-40,0];ff=[12,0]}
  const kicking=atk==='low'||atk==='high'||atk==='knee';
  const rest1=[40+lean,-182+bob+duck],rest2=[26+lean,-172+bob+duck];
  let lead=rest1,rear=rest2;
  if(blk){lead=[40,-194+bob+duck];rear=[32,-180+bob+duck]}
  if(hit){lead=[16+lean,-146];rear=[4+lean,-140]}
  if(atk==='jab')lead=[lerp(40,ATK.jab.rng-10,e),-178+bob];
  if(atk==='cross')rear=[lerp(26,ATK.cross.rng-6,e),-174+bob];
  if(atk==='knee'){lead=[lerp(40,66,e)+lean,-182+bob-16*e];rear=[lerp(26,50,e)+lean,-172+bob-16*e]}
  let eL=null,eR=null;
  if(dz){
    if(dz.bf)bf=dz.bf;if(dz.ff)ff=dz.ff;if(dz.lead)lead=dz.lead;if(dz.rear)rear=dz.rear;
    eL=dz.eL!=null?dz.eL:16;eR=dz.eR!=null?dz.eR:16;
    c.save();c.translate(dz.ox||0,dz.oy||0);
    if(dz.rot){c.translate(0,-100);c.rotate(dz.rot);c.translate(0,100)}
    if(dz.sx!=null)c.scale(dz.sx,1);
  }
  const bend=(h,isAtk)=>isAtk?16*(1-e*.92):16;
  // orden: atrás → delante
  if(!kicking)drawLeg(c,f,hip,bf,0);
  drawLeg(c,f,hip,ff,0);
  if(atk!=='cross')drawArm(c,f,sh,rear,19,15,eR!=null?eR:bend(rear,false));
  drawTorso(c,f,hip,sh);
  drawTrunks(c,f,hip);
  if(kicking){
    swoosh(c,[hip[0]+8,hip[1]-6],kn?[kn[0]+6,kn[1]]:[bf[0]+4,bf[1]-4],e*e);
    drawLeg(c,f,hip,bf,brot,kn,true);
  }
  limb(c,[sh,[head[0],head[1]+18]],18,skin,true);
  drawHead(c,f,head[0],head[1],ov?ov.dm:null);
  // hombro y brazos delanteros
  c.fillStyle=shade(skin,1.05);c.strokeStyle=OUT;c.lineWidth=3;c.beginPath();c.arc(sh[0]+4,sh[1]+2,14,0,7);c.fill();c.stroke();
  c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.ellipse(sh[0]+1,sh[1]-3,6,3.5,-.4,0,7);c.fill();
  if(atk==='cross'){swoosh(c,rest2,rear,e*e);drawArm(c,f,sh,rear,19,15,bend(rear,true))}
  if(atk==='jab')swoosh(c,rest1,lead,e*e);
  drawArm(c,f,sh,lead,20,16,eL!=null?eL:bend(lead,atk==='jab'));
  if(dz)c.restore();
}
/* la sombra es una imagen que se pinta una vez y se reutiliza */
let shadowTex=null,shadowRes=0;
function drawShadow(c,x,y,k){
  if(!shadowTex||shadowRes!==RES){
    const sc=Math.max(1,RES);shadowRes=RES;
    shadowTex=document.createElement('canvas');shadowTex.width=Math.ceil(110*sc);shadowTex.height=Math.ceil(24*sc);
    const g=shadowTex.getContext('2d');g.scale(sc,sc);g.translate(55,12);g.scale(1,.2);
    const gr=g.createRadialGradient(0,0,2,0,0,52);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gr;g.beginPath();g.arc(0,0,52,0,7);g.fill();
  }
  if(k!==1)c.globalAlpha=k;
  c.drawImage(shadowTex,x-55,y-12,110,24);
  if(k!==1)c.globalAlpha=1;
}

/* ---------- luchadores precalculados (calidad media y baja) ----------
   Dibujar un luchador a mano cuesta mucho. Aquí se guarda cada pose ya dibujada y se reutiliza como imagen.
   Las poses se redondean (7 niveles de respiración, 17 de paso, 11 de golpe, 5 de daño) para que se repitan. */
const SB={x:-118,y:-274,w:270,h:304};                      /* zona que ocupa un luchador (pies en 0,0) */
const SPR={m:new Map(),pool:[],bytes:0,cap:46e6,scale:1,off:false,n:0,miss:0};
function sprReset(){SPR.m.clear();SPR.pool.length=0;SPR.bytes=0;SPR.n=0;SPR.miss=0;SPR.off=false;SPR.scale=Math.max(.75,RES)*1.08}
function poseOf(f){
  const st=f.state;
  let bob=0,walk=0;
  if(st==='idle'||st==='block')bob=Math.round(Math.sin(f.anim*6)*3);
  else if(st==='walk')walk=Math.round(Math.sin(f.anim*12)*8)/8;
  const e=f.atk?Math.round(extension(f)*10)/10:0;
  const r=f.maxhp?1-f.hp/f.maxhp:0;
  const dl=r<.18?0:r<.38?1:r<.6?2:r<.78?3:4;
  return {bob,walk,e,dl,dm:[.05,.25,.45,.7,.9][dl]};
}
function getSprite(f){
  const ov=poseOf(f),ph=photoImg(f.id)?1:0;
  const key=f.id+'|'+f.trunk+'|'+f.glove+'|'+(f.gk||gearKey(f))+'|'+(ph?f.d:0)+'|'+f.state+'|'+(f.atk||'')+'|'+ov.e+'|'+ov.bob+'|'+ov.walk+'|'+ov.dl+'|'+(f.flash>0?1:0)+'|'+ph;
  SPR.n++;
  let c=SPR.m.get(key);
  if(c){SPR.m.delete(key);SPR.m.set(key,c);return c}
  SPR.miss++;
  const w=Math.ceil(SB.w*SPR.scale),h=Math.ceil(SB.h*SPR.scale);
  c=SPR.pool.pop();
  if(!c||c.width!==w||c.height!==h){c=document.createElement('canvas');c.width=w;c.height=h}
  const g=c.getContext('2d');
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);
  g.setTransform(SPR.scale,0,0,SPR.scale,-SB.x*SPR.scale,-SB.y*SPR.scale);
  drawFigure(g,Object.assign({},f,{d:ph?f.d:1}),ov);
  SPR.m.set(key,c);SPR.bytes+=w*h*4;
  while(SPR.bytes>SPR.cap&&SPR.m.size>1){
    const k0=SPR.m.keys().next().value,c0=SPR.m.get(k0);SPR.m.delete(k0);SPR.bytes-=c0.width*c0.height*4;SPR.pool.push(c0);
  }
  if(SPR.n>=300){                                         /* si casi nada se reutiliza, la memoria no alcanza: dibujar a mano */
    if(SPR.miss/SPR.n>.5&&SPR.bytes>SPR.cap*.9)SPR.off=true;
    SPR.n=0;SPR.miss=0;
  }
  return c;
}

/* ---------- retratos (mismo dibujo, recortado en busto) ---------- */
const portraitCache={};
function makePortrait(id){
  const f0=lookOf(id);
  const S=320,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
  const gr=g.createLinearGradient(0,0,0,S);gr.addColorStop(0,f0.bg[0]);gr.addColorStop(1,f0.bg[1]);
  g.fillStyle=gr;g.fillRect(0,0,S,S);
  g.fillStyle='rgba(255,255,255,.05)';for(let i=0;i<9;i++){g.save();g.translate(i*48-40,0);g.transform(1,0,-.3,1,0,0);g.fillRect(0,0,18,S);g.restore()}
  const rg=g.createRadialGradient(170,110,10,170,110,220);rg.addColorStop(0,'rgba(255,240,200,.38)');rg.addColorStop(1,'rgba(255,240,200,0)');
  g.fillStyle=rg;g.fillRect(0,0,S,S);
  const dummy=Object.assign({},f0,{id:'__',d:1,state:'idle',atk:null,at:0,anim:0,flash:0});
  const s=1.85;
  g.save();g.translate(142,126+200*s);g.scale(s,s);
  drawFigure(g,dummy);g.restore();
  const vg=g.createRadialGradient(S/2,S/2,S*.35,S/2,S/2,S*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');
  g.fillStyle=vg;g.fillRect(0,0,S,S);
  return c;
}
function portraitOf(id){
  const ph=photoImg(id);if(ph)return ph;
  if(!portraitCache[id])portraitCache[id]=makePortrait(id);
  return portraitCache[id];
}
function srcFor(id){
  if(photos[id])return photos[id];
  const k='u'+id;if(!portraitCache[k])portraitCache[k]=portraitOf(id).toDataURL('image/jpeg',.9);
  return portraitCache[k];
}
/* miniatura (72 px) para el cuadro, la clasificación y las listas: pesa mucho menos que el retrato completo */
function thumbFor(id){
  if(photos[id])return photos[id];
  const k='t'+id;
  if(!portraitCache[k]){
    const c=document.createElement('canvas');c.width=c.height=72;
    c.getContext('2d').drawImage(portraitOf(id),0,0,72,72);
    portraitCache[k]=c.toDataURL('image/jpeg',.82);
  }
  return portraitCache[k];
}

/* ---------- ring de kickboxing 2D ---------- */
function rng(seed){let s=seed;return()=>{s=(s*1664525+1013904223)%4294967296;return s/4294967296}}
function glow(g,x,y,r,col){
  const rg=g.createRadialGradient(x,y,0,x,y,r);rg.addColorStop(0,col);rg.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=rg;g.fillRect(x-r,y-r,r*2,r*2);
}
function ledBoard(g,x,y,w,h,col,txt,size){
  g.fillStyle='#07080c';g.fillRect(x-3,y-3,w+6,h+6);
  const gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,shade(col,1.15));gr.addColorStop(1,shade(col,.45));
  g.fillStyle=gr;g.fillRect(x,y,w,h);
  g.fillStyle='rgba(255,255,255,.07)';for(let i=0;i<h;i+=4)g.fillRect(x,y+i,w,1);
  g.fillStyle='rgba(255,255,255,.93)';g.textAlign='center';g.font='900 '+size+'px "Big Shoulders Display",Impact,sans-serif';
  g.fillText(txt,x+w/2,y+h/2+size*.34);
}
function makeRing(ar,seed){
  const c=document.createElement('canvas');c.width=Math.round(W*RES);c.height=Math.round(H*RES);const g=c.getContext('2d');g.scale(c.width/W,c.height/H);
  const R=rng(seed*97+13);
  // ambiente
  const wall=g.createLinearGradient(0,0,0,400);wall.addColorStop(0,'#03040a');wall.addColorStop(1,'#151927');
  g.fillStyle=wall;g.fillRect(0,0,W,H);
  // estructura de focos
  g.fillStyle='#131620';g.fillRect(0,0,W,18);g.fillStyle='#252a36';g.fillRect(0,16,W,3);
  for(let x=30;x<W;x+=60){g.fillStyle='#2b303d';g.fillRect(x-7,6,14,10);glow(g,x,14,46,'rgba(255,236,190,.55)');g.fillStyle='#fff6d8';g.beginPath();g.arc(x,15,3.5,0,7);g.fill()}
  [130,330,480,630,830].forEach((x,i)=>{
    const dx=(i-2)*45,l=g.createLinearGradient(x,18,x,420);l.addColorStop(0,'rgba(255,240,200,.34)');l.addColorStop(1,'rgba(255,240,200,0)');
    g.fillStyle=l;g.beginPath();g.moveTo(x-10,18);g.lineTo(x+10,18);g.lineTo(x+dx+95,420);g.lineTo(x+dx-95,420);g.fill();
  });
  // pantallas
  g.fillStyle='#07080c';g.fillRect(300,116,360,52);g.strokeStyle='#2c3340';g.lineWidth=4;g.strokeRect(300,116,360,52);
  const bn=g.createLinearGradient(0,120,0,164);bn.addColorStop(0,ar.banner);bn.addColorStop(1,'#10131a');
  g.fillStyle=bn;g.fillRect(304,120,352,44);
  g.fillStyle='rgba(255,255,255,.95)';g.textAlign='center';
  g.font='900 30px "Big Shoulders Display",Impact,sans-serif';g.fillText('KICKBOXING GP',480,146);
  g.font='700 13px "Big Shoulders Display",Impact,sans-serif';g.fillStyle='rgba(255,255,255,.8)';g.fillText('★  ★  ★  ★  ★',480,160);
  ledBoard(g,26,126,214,38,shade(ar.banner,.8),'IRON GYM',26);
  ledBoard(g,720,126,214,38,shade(ar.banner,.8),'ENERGY MAX',26);
  // público
  const shirts=['#2a3a5a','#5a2a2a','#2a5a3a','#4a4a52','#5a4a2a','#3a2a5a','#202026','#6a6a72'];
  for(let r=0;r<5;r++){
    const y=186+r*32,sc=.66+r*.12;
    for(let x=-10+(r%2)*14;x<W+20;x+=26*sc){
      const jx=x+(R()-.5)*6,sk='hsl('+(16+R()*18)+',34%,'+(26+r*4+R()*10)+'%)';
      g.fillStyle=shirts[Math.floor(R()*shirts.length)];
      g.beginPath();g.ellipse(jx,y+23*sc,13*sc,19*sc,0,0,7);g.fill();
      g.fillStyle=sk;g.beginPath();g.arc(jx,y,8.6*sc,0,7);g.fill();
      g.fillStyle='hsl('+(R()<.5?25:40)+',30%,'+(8+R()*14)+'%)';
      g.beginPath();g.arc(jx,y-2*sc,8.8*sc,Math.PI*1.02,Math.PI*1.98);g.fill();
      if(R()<.14){g.strokeStyle=sk;g.lineWidth=4.2*sc;g.lineCap='round';g.beginPath();g.moveTo(jx+8*sc,y+16*sc);g.lineTo(jx+14*sc,y-14*sc);g.stroke();
        if(R()<.4){g.fillStyle='rgba(210,235,255,.95)';g.fillRect(jx+11*sc,y-24*sc,6*sc,10*sc);glow(g,jx+14*sc,y-19*sc,16,'rgba(190,225,255,.5)')}}
      if(R()<.012){g.strokeStyle='#ccc';g.lineWidth=2;g.beginPath();g.moveTo(jx-2,y+10);g.lineTo(jx-2,y-34);g.stroke();g.fillStyle=R()<.5?'#d9382f':'#e3a72a';g.fillRect(jx-2,y-34,22,14)}
    }
    g.fillStyle='rgba(5,6,10,'+(.5-r*.08)+')';g.fillRect(0,y-18,W,34);
  }
  for(let i=0;i<16;i++)glow(g,40+R()*880,190+R()*130,13,'rgba(255,255,255,.95)');
  const hz=g.createLinearGradient(0,170,0,340);hz.addColorStop(0,'rgba(255,255,255,0)');hz.addColorStop(.5,'rgba(255,240,210,.07)');hz.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=hz;g.fillRect(0,170,W,170);
  // zona de ringside
  const rs=g.createLinearGradient(0,340,0,408);rs.addColorStop(0,'#0c0e14');rs.addColorStop(1,'#1a1e29');
  g.fillStyle=rs;g.fillRect(0,340,W,70);
  const brands=[['TURBO','#d9382f'],['IRON GYM','#2e74dc'],['KICK PRO','#27a36a'],['ENERGY MAX','#e3a72a'],['KICK TV','#7a4fd1'],['TURBO','#d9382f'],['IRON GYM','#2e74dc']];
  brands.forEach(([t,col],i)=>ledBoard(g,i*150-20,378,142,24,col,t,18));
  [[170,376],[520,380],[820,376]].forEach(([x,y])=>{
    g.fillStyle='#07080c';g.beginPath();g.ellipse(x,y,12,13,0,0,7);g.fill();g.fillRect(x-14,y+8,28,22);
    g.fillStyle='#1a1d26';g.fillRect(x+6,y-6,22,14);g.fillStyle='#333945';g.beginPath();g.arc(x+30,y+1,6,0,7);g.fill();
  });
  // postes y cuerdas
  [[62,'#d9382f'],[898,'#2e74dc']].forEach(([x,col])=>{
    g.fillStyle='#2a2f3b';g.fillRect(x-7,170,14,240);g.fillStyle='rgba(255,255,255,.1)';g.fillRect(x-7,170,4,240);
    const pg=g.createLinearGradient(x-17,0,x+17,0);pg.addColorStop(0,shade(col,1.3));pg.addColorStop(.5,col);pg.addColorStop(1,shade(col,.5));
    g.fillStyle=pg;g.strokeStyle='#0d0d10';g.lineWidth=3;g.beginPath();g.roundRect(x-17,212,34,142,7);g.fill();g.stroke();
    g.fillStyle='rgba(255,255,255,.7)';g.fillRect(x-17,278,34,6);
    g.fillStyle='#9aa0ab';[222,344].forEach(yy=>{g.beginPath();g.arc(x,yy,3,0,7);g.fill()});
  });
  [[238,'#ecebe6'],[286,ar.banner],[334,'#ecebe6']].forEach(([y,col])=>{
    g.lineCap='round';
    g.strokeStyle='#0d0d10';g.lineWidth=12;g.beginPath();g.moveTo(62,y);g.quadraticCurveTo(480,y+18,898,y);g.stroke();
    g.strokeStyle=col;g.lineWidth=8;g.beginPath();g.moveTo(62,y);g.quadraticCurveTo(480,y+18,898,y);g.stroke();
    g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=2;g.beginPath();g.moveTo(62,y-2.5);g.quadraticCurveTo(480,y+15.5,898,y-2.5);g.stroke();
    g.strokeStyle='rgba(0,0,0,.3)';g.lineWidth=2;g.beginPath();g.moveTo(62,y+3);g.quadraticCurveTo(480,y+21,898,y+3);g.stroke();
  });
  // lona
  const fl=g.createLinearGradient(0,408,0,H);fl.addColorStop(0,shade(ar.floor,1.2));fl.addColorStop(1,shade(ar.floor,.4));
  g.fillStyle=fl;g.beginPath();g.moveTo(40,408);g.lineTo(920,408);g.lineTo(W,H);g.lineTo(0,H);g.closePath();g.fill();
  g.save();g.beginPath();g.moveTo(40,408);g.lineTo(920,408);g.lineTo(W,H);g.lineTo(0,H);g.closePath();g.clip();
  const gl=g.createRadialGradient(480,470,10,480,470,420);gl.addColorStop(0,'rgba(255,255,255,.2)');gl.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gl;g.fillRect(0,408,W,H);
  g.strokeStyle='rgba(255,255,255,.1)';g.lineWidth=3;
  for(let i=-6;i<=6;i++){g.beginPath();g.moveTo(480+i*54,408);g.lineTo(480+i*120,H);g.stroke()}
  for(let i=0;i<5;i++){const yy=408+Math.pow(i/5,1.6)*132+6;g.beginPath();g.moveTo(0,yy);g.lineTo(W,yy);g.stroke()}
  for(let i=0;i<260;i++){g.fillStyle='rgba(255,255,255,'+(R()*.06)+')';g.fillRect(R()*W,408+R()*132,2,2)}
  g.restore();
  g.fillStyle='#ecebe6';g.beginPath();g.moveTo(40,403);g.lineTo(920,403);g.lineTo(925,414);g.lineTo(35,414);g.closePath();g.fill();
  g.fillStyle='#d9382f';g.beginPath();g.moveTo(40,403);g.lineTo(150,403);g.lineTo(144,414);g.lineTo(35,414);g.closePath();g.fill();
  g.fillStyle='#2e74dc';g.beginPath();g.moveTo(920,403);g.lineTo(810,403);g.lineTo(816,414);g.lineTo(925,414);g.closePath();g.fill();
  g.save();g.translate(480,484);g.scale(1,.2);
  g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=14;g.beginPath();g.arc(0,0,236,0,7);g.stroke();
  g.strokeStyle='rgba(227,167,42,.55)';g.lineWidth=6;g.beginPath();g.arc(0,0,214,0,7);g.stroke();
  g.restore();
  g.fillStyle='rgba(255,255,255,.3)';g.font='900 50px "Big Shoulders Display",Impact,sans-serif';g.textAlign='center';
  g.fillText('KICKBOXING GP',480,500);
  return c;
}
/* fondos: se dibujan una vez y se guardan (máximo 3 a la vez para no gastar memoria) */
const bgCache={};
function invalidateBgs(){for(const k in bgCache)delete bgCache[k]}
function getBg(i){
  const ph=photoImg('bg');
  if(ph){
    if(!bgCache.custom||bgCache.customSrc!==photos.bg){
      const c=document.createElement('canvas');c.width=Math.round(W*RES);c.height=Math.round(H*RES);const g=c.getContext('2d');g.scale(c.width/W,c.height/H);
      const sc=Math.max(W/ph.naturalWidth,H/ph.naturalHeight),w=ph.naturalWidth*sc,h=ph.naturalHeight*sc;
      g.drawImage(ph,(W-w)/2,(H-h)/2,w,h);
      g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,0,W,H);
      bgCache.custom=c;bgCache.customSrc=photos.bg;
    }
    return bgCache.custom;
  }
  const k=i==null||i<0?4:i;
  if(!bgCache[k]){
    const keys=Object.keys(bgCache).filter(x=>x!=='custom'&&x!=='customSrc');
    if(keys.length>=3)delete bgCache[keys[0]];
    bgCache[k]=makeRing(ARENAS[k],k+1);
  }
  return bgCache[k];
}

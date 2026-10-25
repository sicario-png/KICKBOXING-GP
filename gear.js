/* gear.js · equipo del vestuario: adornos de guantes y calzonas, pies descalzos y bailes de victoria.
   Los datos (precios, colores, estilos) están en SHOP, en config.js. Aquí solo se dibuja. */

/* ---------- guantes ---------- (el guante se dibuja con el eje largo en x; el puño mira a +x) */
function gloveDeco(c,r,col,gs,c2){
  if(!gs||gs==='plain')return;
  c.save();
  c.beginPath();c.ellipse(0,0,r*1.04,r*.94,0,0,7);c.clip();
  c.fillStyle=c2;c.strokeStyle=c2;c.lineCap='round';c.lineJoin='round';
  if(gs==='stripe'){
    c.fillRect(-r*.52,-r*1.2,r*.32,r*2.4);
  }else if(gs==='neon'){
    c.globalAlpha=.55;c.lineWidth=r*.3;c.beginPath();c.ellipse(0,0,r*.84,r*.72,0,0,7);c.stroke();
    c.globalAlpha=1;c.lineWidth=r*.12;c.beginPath();c.ellipse(0,0,r*.84,r*.72,0,0,7);c.stroke();
  }else if(gs==='gold'){
    const g=c.createLinearGradient(-r,-r,r,r);g.addColorStop(0,c2);g.addColorStop(.45,col);g.addColorStop(1,shade(col,.55));
    c.globalAlpha=.9;c.fillStyle=g;c.fillRect(-r*1.3,-r*1.3,r*2.6,r*2.6);c.globalAlpha=1;
    starPath(c,r*.2,0,r*.4,r*.17);c.fillStyle='rgba(92,62,10,.8)';c.fill();
  }else if(gs==='flame'){
    for(let i=0;i<3;i++){
      const y0=(i-1)*r*.6;
      c.beginPath();c.moveTo(-r*1.1,y0+r*.3);c.quadraticCurveTo(-r*.3,y0+r*.32,r*.55,y0-r*.05);
      c.quadraticCurveTo(-r*.1,y0-r*.12,-r*.3,y0-r*.42);c.quadraticCurveTo(-r*.6,y0-r*.1,-r*1.1,y0-r*.34);c.closePath();c.fill();
    }
    c.fillStyle='#fff3a0';c.globalAlpha=.7;
    for(let i=0;i<3;i++){const y0=(i-1)*r*.6;c.beginPath();c.moveTo(-r*.9,y0+r*.12);c.quadraticCurveTo(-r*.3,y0+r*.1,r*.15,y0-r*.04);c.quadraticCurveTo(-r*.3,y0-r*.04,-r*.9,y0-r*.1);c.fill()}
    c.globalAlpha=1;
  }else if(gs==='camo'){
    [[-.55,-.3,.42,.3],[.05,.4,.36,.26],[.45,-.38,.32,.24],[-.2,.05,.28,.2],[.7,.12,.26,.22],[-.7,.5,.3,.2]].forEach(([x,y,a,b],i)=>{
      c.fillStyle=i%2?shade(col,.55):c2;c.globalAlpha=.9;c.beginPath();c.ellipse(x*r,y*r,a*r,b*r,i,0,7);c.fill();
    });c.globalAlpha=1;
  }else if(gs==='star'){
    starPath(c,r*.1,0,r*.7,r*.3);c.fill();
  }else if(gs==='tiger'){
    c.lineWidth=Math.max(2,r*.2);
    for(let i=0;i<3;i++){const x=-r*.75+i*r*.62;c.beginPath();c.moveTo(x,-r);c.lineTo(x+r*.2,-r*.3);c.lineTo(x-r*.12,r*.2);c.lineTo(x+r*.16,r);c.stroke()}
  }
  c.restore();
}
function starPath(c,x,y,R,r){
  c.beginPath();
  for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r:R;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}
  c.closePath();
}

/* ---------- calzonas ---------- (hx,hy = cadera) */
function trunkSub(c,hx,hy){
  c.moveTo(hx-26,hy-22);c.lineTo(hx+26,hy-22);c.lineTo(hx+33,hy+24);c.lineTo(hx+5,hy+26);c.lineTo(hx,hy+12);c.lineTo(hx-5,hy+26);c.lineTo(hx-33,hy+24);c.closePath();
}
function trunkPath(c,hx,hy){c.beginPath();trunkSub(c,hx,hy)}
/* cintura de las calzonas (se vuelve a pintar encima de la pernera cuando se levanta la pierna) */
function drawWaist(c,f,hip){
  const hx=hip[0],hy=hip[1],ts=f.ts;
  const acc=(ts&&ts!=='plain'&&f.t2)||f.glove;               /* el color de la raya es el del guante, salvo que las calzonas tengan dibujo propio */
  c.fillStyle=ts==='gold'?'#17171c':'#ecebe6';c.strokeStyle=OUT;c.lineWidth=3;c.fillRect(hx-26,hy-26,52,10);c.strokeRect(hx-26,hy-26,52,10);
  c.fillStyle=acc;c.fillRect(hx-26,hy-22,52,3);
  c.fillStyle='#e3a72a';c.beginPath();c.moveTo(hx,hy-24);c.lineTo(hx+3,hy-18);c.lineTo(hx-3,hy-18);c.closePath();c.fill();
}
/* pernera: cuando se levanta la pierna (patadas y rodilla) la calzona acompaña al muslo. Sin esto el muslo se veía por encima
   de las calzonas y la pierna "sobresalía". hip = cadera, k = rodilla; se dibuja justo después de la pierna. */
function shortsTube(c,f,hip,k){
  const hx=hip[0],hy=hip[1],dx=k[0]-hx,dy=k[1]-hy,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
  const back=18,L=clamp(len*.52,26,38),w0=17.5,w1=19;             /* empieza por detrás de la cadera para tapar el arranque del muslo */
  const sx=hx-ux*back,sy=hy-uy*back,ex=hx+ux*L,ey=hy+uy*L;
  const quad=()=>{c.beginPath();c.moveTo(sx+nx*w0,sy+ny*w0);c.lineTo(ex+nx*w1,ey+ny*w1);c.lineTo(ex-nx*w1,ey-ny*w1);c.lineTo(sx-nx*w0,sy-ny*w0);c.closePath()};
  const below=()=>{c.beginPath();c.rect(hx-90,hy-22,260,220);c.clip()};                     /* la tela no sube por encima de la cintura */
  c.save();below();
  c.beginPath();c.rect(hx-400,hy-400,800,800);trunkSub(c,hx,hy);c.clip('evenodd');         /* el contorno solo por fuera de las calzonas */
  quad();c.lineJoin='round';c.lineWidth=6.4;c.strokeStyle=OUT;c.stroke();                  /* (la mitad de dentro la tapa la tela) */
  c.restore();
  c.save();below();quad();c.clip();
  const g=c.createLinearGradient(0,hy-24,0,hy+24);                                         /* mismo degradado que las calzonas: no se nota la unión */
  g.addColorStop(0,shade(f.trunk,1.3));g.addColorStop(.5,f.trunk);g.addColorStop(1,shade(f.trunk,.58));
  c.fillStyle=g;c.fillRect(hx-140,hy-140,280,280);
  if(f.ts&&f.ts!=='plain')trunkDeco(c,hx,hy,f);
  c.restore();
}
function trunkDeco(c,hx,hy,f){
  const ts=f.ts;if(!ts||ts==='plain')return;
  const a=f.t2||'#ecebe6';
  c.save();trunkPath(c,hx,hy);c.clip();
  c.fillStyle=a;c.strokeStyle=a;c.lineCap='round';
  if(ts==='band'){
    c.fillRect(hx-40,hy+13,80,16);
  }else if(ts==='stripes'){
    [-17,-3,11].forEach(x=>c.fillRect(hx+x,hy-22,4.5,52));
  }else if(ts==='stars'){
    [[-15,-4,6.5],[13,5,6.5],[-5,17,5],[19,-10,4.5]].forEach(([x,y,R])=>{starPath(c,hx+x,hy+y,R,R*.42);c.fill()});
  }else if(ts==='flames'){
    for(let i=0;i<6;i++){
      const x=hx-34+i*13;
      c.fillStyle=a;c.beginPath();c.moveTo(x-8,hy+30);c.quadraticCurveTo(x-3,hy+14,x+2,hy+2+(i%2)*6);c.quadraticCurveTo(x+4,hy+16,x+9,hy+30);c.closePath();c.fill();
      c.fillStyle='#ffe27a';c.beginPath();c.moveTo(x-3,hy+30);c.quadraticCurveTo(x,hy+20,x+2,hy+14);c.quadraticCurveTo(x+4,hy+22,x+6,hy+30);c.closePath();c.fill();
    }
  }else if(ts==='tiger'){
    c.lineWidth=5;
    for(let i=0;i<5;i++){const x=hx-30+i*15;c.beginPath();c.moveTo(x,hy-22);c.lineTo(x+7,hy-6);c.lineTo(x-3,hy+8);c.lineTo(x+8,hy+30);c.stroke()}
  }else if(ts==='checker'){
    for(let row=0;row<2;row++)for(let i=0;i<9;i++){if((i+row)%2===0)c.fillRect(hx-40+i*9,hy+10+row*9,9,9)}
  }else if(ts==='gold'){
    const g=c.createLinearGradient(hx-34,hy-22,hx+34,hy+26);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(.4,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.25)');
    c.fillStyle=g;c.fillRect(hx-40,hy-26,80,56);
    c.fillStyle=a;c.beginPath();c.moveTo(hx,hy-8);c.lineTo(hx+11,hy+5);c.lineTo(hx,hy+18);c.lineTo(hx-11,hy+5);c.closePath();c.fill();
    c.fillStyle='#fff1b0';c.beginPath();c.moveTo(hx,hy-1);c.lineTo(hx+5,hy+5);c.lineTo(hx,hy+11);c.lineTo(hx-5,hy+5);c.closePath();c.fill();
  }
  c.restore();
}

/* ---------- pies descalzos ----------
   Es kickboxing profesional: sin tibiales, botas ni calcetines; se pelea con el pie al descubierto.
   bareFoot dibuja el pie (mirando a +x, centrado en el empeine) con el color de la piel. */
function bareFoot(c,f){
  const sk=f.skin;
  c.beginPath();
  c.moveTo(-17,3);                                              /* talón */
  c.bezierCurveTo(-19,-4,-14,-10,-6,-10);                       /* tobillo */
  c.bezierCurveTo(3,-9,11,-6,17,-3);                            /* empeine */
  c.bezierCurveTo(22,-2,23,4,19,6.5);                           /* dedos */
  c.bezierCurveTo(8,8.5,-6,8.5,-13,7.5);                        /* planta */
  c.closePath();
  c.fillStyle=sk;c.strokeStyle=OUT;c.lineWidth=3;c.lineJoin='round';c.fill();c.stroke();
  c.save();c.clip();
  c.fillStyle='rgba(0,0,0,.16)';c.fillRect(-20,3.5,44,6);       /* sombra de la planta */
  c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.ellipse(1,-6,10,2.2,.2,0,7);c.fill();   /* brillo del empeine */
  c.restore();
  c.strokeStyle=shade(sk,.62);c.lineWidth=1.3;c.lineCap='round';c.beginPath();                 /* separación de los dedos */
  c.moveTo(15.5,-1.6);c.lineTo(16.6,2.8);c.moveTo(12.2,-2.8);c.lineTo(13,2.6);c.stroke();
}
/* une el pie con la espinilla: tapa el contorno del pie bajo el tobillo */
function ankle(c,f,foot){
  c.fillStyle=f.skin;c.beginPath();c.arc(foot[0],foot[1],7.2,0,7);c.fill();
}

/* ---------- bailes de victoria ----------
   Cada baile devuelve una pose para el tiempo t (segundos). Las manos y los pies están en las mismas coordenadas que
   drawFigure (mira a +x, pies en y=0, cadera en y=-100). Campos opcionales: bob, lean, lead, rear, bf, ff, eL, eR (codos),
   ox, oy (desplazamiento del cuerpo), rot (giro sobre la cadera) y sx (giro sobre el eje vertical). */
const DANCES={
  d0:t=>{const s=Math.sin(t*7),b=Math.abs(s);
    return {lean:Math.sin(t*3.5)*2,lead:[32+s*7,-258],rear:[8-s*7,-254],eL:-6,eR:-6,oy:-b*8}},
  d1:t=>{const s=Math.sin(t*6),p=Math.abs(s),w=Math.sin(t*12);
    return {lean:3,lead:[46,-214-p*34-w*10],rear:[28,-206-p*34+w*10],bf:[-24,-3],ff:[24,-3],eL:10,eR:10,oy:-p*44}},
  d2:t=>{const q=Math.sin(t*9),j=Math.max(0,Math.sin(t*4.5)),k=Math.max(0,-Math.sin(t*4.5));
    return {bob:-Math.abs(q)*3,lean:5,lead:[44+j*38,-180],rear:[28+k*34,-172],bf:[-26+q*14,-Math.max(0,q)*8],ff:[26+q*14,-Math.max(0,-q)*8],eL:14,eR:14,ox:q*9}},
  d3:t=>{const q=Math.sin(t*5);
    return {lean:-4,lead:[34,-226+Math.sin(t*5)*5],rear:[16,-150],bf:[-26-q*14,-Math.max(0,q)*12],ff:[26+q*14,-Math.max(0,-q)*12],eL:8,eR:-10,ox:-(.5+.5*Math.sin(t*1.1))*60}},
  d4:t=>{const s=Math.cos(t*5.5);
    return {lead:[30,-256],rear:[6,-250],eL:-6,eR:-6,sx:Math.abs(s)<.1?(s<0?-.1:.1):s,oy:-Math.abs(Math.sin(t*5.5))*6}},
  d5:t=>{const w=Math.sin(t*13);
    return {bob:-Math.abs(w)*3,lean:Math.sin(t*6.5)*6,lead:[24,-178],rear:[6,-172],bf:[-24,0],ff:[22,-Math.max(0,w)*7],eL:w*34,eR:-w*34}},
  d6:t=>{const P=1.7,u=(t%P)/P,air=u<.62;let oy=0,rot=0;
    if(air){const v=u/.62;oy=-Math.sin(Math.PI*v)*78;rot=(v<.5?2*v*v:1-2*(1-v)*(1-v))*Math.PI*2}
    return {lead:air?[26,-150]:[34,-256],rear:air?[14,-140]:[8,-252],bf:air?[-12,-30]:[-26,0],ff:air?[16,-34]:[26,0],eL:air?-14:-6,eR:air?-14:-6,oy,rot}}
};
function dancePose(id,t){return (DANCES[id]||DANCES.d0)(t)}

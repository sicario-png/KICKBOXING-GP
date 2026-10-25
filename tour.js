/* tour.js · torneo de 16 luchadores (cuadro con ramas), clasificación, premios y entrenamiento.
   El torneo se guarda en save.tour:
     slots  los 16 puestos del sorteo ('p' = tú, 0..14 = rivales); los combates de la primera ronda enfrentan puestos vecinos
     r      4 rondas de combates: octavos (8), cuartos (4), semifinales (2) y final (1). Cada combate: {a,b,w,how}
     st     fase en la que juegas (0..3), o 4 si ya has sido eliminado o eres campeón
     alive  si sigues en el torneo      champ  quién ganó el torneo */

/* ---------- dinero ---------- */
const COIN='<svg class="coin" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#e3a72a" stroke="#6b4a0f" stroke-width="1.4"/><circle cx="8" cy="8" r="4.3" fill="none" stroke="#8a5c10" stroke-width="1"/><path d="M8 5.1l.95 1.95 2.15.3-1.55 1.5.37 2.1L8 9.9l-1.92 1.05.37-2.1L4.9 7.35l2.15-.3z" fill="#8a5c10"/></svg>';
const fmt=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,LANG==='es'?'.':',');
const moneyHTML=n=>'<bdi class="mn">'+fmt(n)+'</bdi>'+COIN;
const r5=x=>Math.round(x/5)*5;
function payFor(stage,outcome,ko,kd){
  const base=PRIZE.win[stage];
  const res=outcome==='win'?base:r5(base*(outcome==='draw'?PRIZE.draw:PRIZE.loss));
  const koB=outcome==='win'&&ko?r5(base*PRIZE.ko):0;
  const kdN=outcome==='win'&&ko?Math.max(0,kd-1):kd;                 /* el último derribo de un KO ya cuenta en el bonus de KO */
  const kdB=kdN*PRIZE.kd;
  const champ=outcome==='win'&&stage===3?PRIZE.champ:0;
  return {res,ko:koB,kd:kdB,kdN,champ,total:res+koB+kdB+champ};
}

/* ---------- sorteo y simulación ---------- */
const rkOf=id=>id==='p'?0:FIGHTERS[id].rk;
const labelOf=id=>id==='p'?playerName():fName(id).split(/[\s·]+/)[0];   /* en el cuadro cabe el nombre de pila; el nombre entero sale al pasar el ratón */
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
/* El sorteo es aleatorio, pero cada ronda te toca alguien más fuerte: primero un rival flojo, luego uno medio... y al final el mejor de la otra mitad. */
function newTour(){
  const P=Math.floor(Math.random()*16);                                /* tu puesto en el cuadro */
  const sorted=FIGHTERS.slice().sort((a,b)=>a.rk-b.rk).map(f=>f.id);   /* del más flojo al más fuerte */
  const used=new Set();
  const take=(from,to,n)=>{const c=shuffle(sorted.slice(from,to).filter(id=>!used.has(id))).slice(0,n);c.forEach(id=>used.add(id));return c};
  const g0=take(0,3,1),g1=take(2,8,2),g2=take(6,12,4),g3=shuffle(sorted.filter(id=>!used.has(id)));
  const slots=new Array(16).fill(null);
  slots[P]='p';slots[P^1]=g0[0];                                       /* octavos: tu rival */
  const q=((P>>1)^1)*2;g1.forEach((id,i)=>{slots[q+i]=id});            /* cuartos: ganará uno de estos dos */
  const s4=((P>>2)^1)*4;g2.forEach((id,i)=>{slots[s4+i]=id});          /* semifinal: el mejor de estos cuatro */
  const f8=((P>>3)^1)*8;g3.forEach((id,i)=>{slots[f8+i]=id});          /* final: el mejor de la otra mitad */
  const r=[[],[],[],[]];
  for(let s=0;s<4;s++)for(let i=0;i<8>>s;i++)r[s].push({a:s?null:slots[2*i],b:s?null:slots[2*i+1],w:null,how:null});
  save.tour={slots,r,st:0,alive:true,champ:null};
  persist();
  return save.tour;
}
function playerMatch(T,s){return T.r[s==null?T.st:s].find(m=>m.a==='p'||m.b==='p')}
const otherOf=m=>m.a==='p'?m.b:m.a;
/* los combates entre rivales se deciden por su nivel, con sorpresas */
function simMatch(m){
  const ra=rkOf(m.a),rb=rkOf(m.b),pa=1/(1+Math.exp(-(ra-rb)*.45));
  m.w=Math.random()<pa?m.a:m.b;
  m.how=Math.random()<.2+.03*Math.abs(ra-rb)?'ko':'dec';
}
function simRound(T,s){T.r[s].forEach(m=>{if(m.w==null)simMatch(m)})}
function fillNext(T,s){if(s<3)T.r[s+1].forEach((m,i)=>{m.a=T.r[s][2*i].w;m.b=T.r[s][2*i+1].w})}
/* tu combate ha terminado: se juegan los demás de la ronda y se prepara la siguiente */
function tourResult(outcome,ko){
  const T=save.tour,s=T.st,m=playerMatch(T);
  m.w=outcome==='win'?'p':otherOf(m);m.how=ko?'ko':'dec';
  simRound(T,s);fillNext(T,s);
  if(outcome==='win'){
    if(s===3){T.champ='p';T.st=4}else T.st=s+1;
  }else{
    T.alive=false;
    for(let k=s+1;k<4;k++){simRound(T,k);fillNext(T,k)}               /* el resto del torneo se juega solo */
    T.champ=T.r[3][0].w;T.st=4;
  }
}
function standings(T){
  const info={};
  T.slots.forEach(id=>{info[id]={id,w:0,ko:0,out:false}});
  T.r.forEach(round=>round.forEach(m=>{
    if(m.w==null)return;
    info[m.w].w++;if(m.how==='ko')info[m.w].ko++;
    info[m.a===m.w?m.b:m.a].out=true;
  }));
  return Object.values(info).sort((x,y)=>y.w-x.w||(x.out-y.out)||y.ko-x.ko||rkOf(y.id)-rkOf(x.id));
}

/* ---------- fin de un combate ---------- */
function fightEnded(idx,outcome,ko,kd,stage){
  let T=save.tour;
  const pay=payFor(stage,outcome,ko,kd),st=save.stats;
  save.cash+=pay.total;
  if(outcome==='win'){st.w++;if(ko)st.ko++}else if(outcome==='loss')st.l++;else st.d++;
  let eliminated=false,champion=false;
  if(T&&T.alive&&T.st===stage&&outcome!=='draw'){                     /* un empate no cambia el cuadro: se repite el combate */
    tourResult(outcome,ko);
    eliminated=!T.alive;champion=T.champ==='p';
    if(eliminated||champion){st.t++;if(champion)st.titles++}
  }
  persist();
  lastResult={k:'solo',outcome,ko,idx,stage,pay,eliminated,champion};
  show('result');
}

/* ---------- pantalla del torneo ---------- */
const stat=(v,max)=>Math.max(8,Math.min(100,v/max*100));
const BK={cw:120,ch:34,gp:3,top:30,u:82};
const BK_X=[0,142,284,436,588,730,872],BK_W=992;
const BMH=BK.ch*2+BK.gp;
/* posición de un combate en el cuadro: columna (x), centro vertical (cy) y lado */
function bkPos(s,i){
  if(s===3)return {x:BK_X[3],cy:BK.top+41+1.5*BK.u,side:0};
  const half=(8>>s)/2,side=i<half?0:1,k=side?i-half:i;
  return {x:BK_X[side?6-s:s],cy:BK.top+41+(k*(1<<s)+((1<<s)-1)/2)*BK.u,side};
}
const TROPHY='<svg class="trophy" viewBox="0 0 48 52" aria-hidden="true"><defs><linearGradient id="tg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f3cd6a"/><stop offset=".55" stop-color="#e3a72a"/><stop offset="1" stop-color="#8a5c10"/></linearGradient></defs><path d="M12 4h24v14c0 8-5 13-12 13S12 26 12 18z" fill="url(#tg)" stroke="#5c3e0a" stroke-width="2"/><path d="M12 8H5c0 9 3 14 9 15M36 8h7c0 9-3 14-9 15" fill="none" stroke="#e3a72a" stroke-width="3" stroke-linecap="round"/><path d="M21 31h6v8h-6z" fill="#c68a1c" stroke="#5c3e0a" stroke-width="1.5"/><rect x="14" y="39" width="20" height="8" rx="2" fill="url(#tg)" stroke="#5c3e0a" stroke-width="2"/></svg>';
function cellHTML(id,m){
  if(id==null)return '<div class="bc tbd"><span>?</span></div>';
  const done=m.w!=null,win=done&&m.w===id,lose=done&&m.w!==id;
  const tag=win&&m.how==='ko'?'<em class="bt ko">'+esc(t('tag.ko'))+'</em>':'';        /* solo los KO llevan etiqueta: el resto fueron a los puntos */
  return '<div class="bc'+(id==='p'?' me':'')+(win?' win':'')+(lose?' lose':'')+'" title="'+esc(fName(id)+(id==='p'?'':' · '+cName(profOf(id).cc)))+'"><img alt="" src="'+thumbFor(id)+'"><span class="bn">'+esc(labelOf(id))+'</span>'+tag+'</div>';
}
function bracketHTML(T){
  const {cw}=BK,lines=[],boxes=[],heads=[];
  for(let s=0;s<4;s++)for(let i=0;i<8>>s;i++){
    const m=T.r[s][i],p=bkPos(s,i);
    const mine=m.a==='p'||m.b==='p',next=mine&&T.alive&&T.st===s;
    boxes.push('<div class="bm'+(mine?' mine':'')+(next?' next':'')+'" style="left:'+p.x+'px;top:'+(p.cy-BMH/2)+'px">'+cellHTML(m.a,m)+cellHTML(m.b,m)+'</div>');
    if(s<3){
      const n=bkPos(s+1,i>>1),xo=p.side?p.x:p.x+cw,xi=p.side?n.x+cw:n.x,xm=(xo+xi)/2;
      lines.push('<path class="'+(m.w==null?'':m.w==='p'?'me':'on')+'" d="M'+xo+','+p.cy+' H'+xm+' V'+n.cy+' H'+xi+'"/>');
    }
  }
  /* rótulos de las rondas (la fase en la que juegas está resaltada) */
  [[0,0],[1,1],[2,2],[3,3],[4,2],[5,1],[6,0]].forEach(([c,s])=>{
    heads.push('<div class="bh'+(T.alive&&T.st===s?' on':'')+'" style="left:'+BK_X[c]+'px">'+esc(t('stg.'+s))+'</div>');
  });
  const fy=bkPos(3,0).cy-BMH/2,cy=fy-12-BK.ch,done=T.champ!=null;
  const champ='<div class="trophybox" style="left:'+BK_X[3]+'px;top:'+(cy-54)+'px">'+TROPHY+'</div>'+
    '<div class="bc champ'+(done?' win':' tbd')+(T.champ==='p'?' me':'')+'" style="left:'+BK_X[3]+'px;top:'+cy+'px">'+
      (done?'<img alt="" src="'+thumbFor(T.champ)+'"><span class="bn">'+esc(labelOf(T.champ))+'</span>':'<span>?</span>')+'</div>';
  lines.push('<path class="'+(done?(T.champ==='p'?'me':'on'):'')+'" d="M'+(BK_X[3]+cw/2)+','+(cy+BK.ch)+' V'+fy+'"/>');
  const H=BK.top+4*BK.u+6;
  return '<div class="bk" style="width:'+BK_W+'px;height:'+H+'px;--cw:'+cw+'px"><svg class="bl" width="'+BK_W+'" height="'+H+'" viewBox="0 0 '+BK_W+' '+H+'" aria-hidden="true">'+lines.join('')+'</svg>'+heads.join('')+champ+boxes.join('')+'</div>';
}
function nextBarHTML(T){
  if(T.alive&&T.st<4){
    const m=playerMatch(T),opp=otherOf(m),f=FIGHTERS[opp],ar=arenaName(arenaFor(T.st,opp));
    const bar=(n,v)=>'<div><span>'+esc(n)+'</span><span class="bar"><i style="width:'+v+'%"></i></span></div>';
    return '<div class="nb">'+
      '<div class="nb-in"><div class="eyebrow">'+esc(t('tour.next'))+'</div><h3>'+esc(t('stage.'+T.st))+'</h3><small class="mute">'+esc(ar)+'</small>'+
        '<div class="nb-prize"><span>'+esc(t('tour.prize'))+'</span> '+moneyHTML(PRIZE.win[T.st])+'<small class="mute">'+esc(t('tour.prize.d'))+'</small></div></div>'+
      '<div class="nb-vs">'+
        '<figure><img alt="" src="'+srcFor('p')+'"><figcaption>'+esc(playerName())+'<small>'+miniHTML('p')+'</small></figcaption></figure>'+
        '<b class="vs">VS</b>'+
        '<figure class="opp"><img alt="'+esc(t('card.alt',{n:fName(opp)}))+'" src="'+srcFor(opp)+'"><figcaption>“'+esc(fNick(opp))+'”<small>'+esc(fName(opp))+' · '+esc(fCls(opp))+'</small></figcaption></figure>'+
        '<div class="nb-info">'+fichaHTML(opp)+'<div class="bars">'+bar(t('upg.pow'),stat(f.pow,1.7))+bar(t('upg.spd'),stat(f.spd,1.3))+bar(t('stat.chin'),stat(f.hp,320))+'</div></div>'+
      '</div>'+
      '<button class="btn" data-fight="'+opp+'" data-stage="'+T.st+'">'+esc(t('tour.fight'))+'</button></div>';
  }
  const champ=T.champ==='p',last=T.r.findIndex(r=>r.some(m=>(m.a==='p'||m.b==='p')&&m.w!=null&&m.w!=='p'));
  return '<div class="nb over'+(champ?' champ':'')+'"><div class="nb-in"><div class="eyebrow">'+esc(t(champ?'tour.champ':'tour.out',{s:t('stage.'+Math.max(0,last))}))+'</div>'+
    '<h3>'+esc(champ?t('tour.champ.d'):t('tour.out.d'))+'</h3><small class="mute">'+esc(t('tour.winner',{n:fName(T.champ)}))+'</small></div>'+
    '<button class="btn" data-newtour="1">'+esc(t('tour.new'))+'</button></div>';
}
function upgradesHTML(){
  return UPG.map(u=>{
    const lv=save.up[u.k],max=lv>=MAXUP,cost=UPCOST[lv],nm=t('upg.'+u.k),can=!max&&save.cash>=cost;
    return '<div class="up"><div><strong>'+esc(nm)+'</strong><small class="mute">'+esc(t('upg.'+u.k+'.d'))+'</small></div>'+
      '<div class="pips">'+Array.from({length:MAXUP},(_,j)=>'<i class="'+(j<lv?'on':'')+'"></i>').join('')+'</div>'+
      '<button class="buy" data-up="'+u.k+'" aria-label="'+esc(t('upg.aria',{n:nm}))+'"'+(can?'':' disabled')+'>'+(max?esc(t('upg.max')):moneyHTML(cost))+'</button></div>';
  }).join('');
}
function standingsHTML(T){
  const rows=standings(T);
  return '<div class="srw h"><span>#</span><span>'+esc(t('st.fighter'))+'</span><span>'+esc(t('st.round'))+'</span><span>'+esc(t('st.w'))+'</span><span>KO</span></div>'+
    rows.map((x,i)=>'<div class="srw'+(x.id==='p'?' me':'')+(x.out?' out':'')+'"><span class="pos">'+(i+1)+'</span>'+
      '<span class="who"><img alt="" src="'+thumbFor(x.id)+'">'+flagSvg(profOf(x.id).cc,'sm')+'<b>'+esc(fName(x.id))+'</b></span>'+
      '<span class="rd">'+esc(t('stl.'+x.w))+'</span><span>'+x.w+'</span><span>'+x.ko+'</span></div>').join('');
}
function renderTour(){
  const T=save.tour||newTour();
  $('#wallet-t').innerHTML=moneyHTML(save.cash);
  $('#nextbar').innerHTML=nextBarHTML(T);
  $('#bracket').innerHTML=bracketHTML(T);
  $('#upg').innerHTML=upgradesHTML();
  $('#stand').innerHTML=standingsHTML(T);
  const s=save.stats;
  $('#record').textContent=t('rec.line',{c:s.titles,w:s.w,k:s.ko,l:s.l,d:s.d});
  const bw=$('#bkw'),el=$('#bracket .bm.next')||$('#bracket .bm.mine');           /* lleva el cuadro hasta tu combate */
  if(bw&&el)bw.scrollLeft=Math.max(0,el.offsetLeft-(bw.clientWidth-el.offsetWidth)/2);
}
$('#scr-tour').addEventListener('click',e=>{
  const f=e.target.closest('[data-fight]');
  if(f&&!f.disabled){startFight(+f.dataset.fight,+f.dataset.stage);return}
  const u=e.target.closest('[data-up]');
  if(u&&!u.disabled){
    const k=u.dataset.up,lv=save.up[k];
    if(lv<MAXUP&&save.cash>=UPCOST[lv]){save.cash-=UPCOST[lv];save.up[k]++;persist();sfx('buy');renderTour()}
    return;
  }
  const n=e.target.closest('[data-newtour]');
  if(n){newTour();renderTour();sfx('bell')}
});

/* ---------- resultado de un combate ---------- */
function payHTML(L){
  const p=L.pay,row=(lab,v,i,cls)=>'<div class="r '+(cls||'')+'" style="--i:'+i+'"><span>'+esc(lab)+'</span><b>+'+moneyHTML(v)+'</b></div>';
  let i=0,h='<div class="pay">'+row(t(L.outcome==='win'?'pay.win':L.outcome==='draw'?'pay.draw':'pay.loss')+' · '+t('stg.'+L.stage),p.res,i++);
  if(p.ko)h+=row(t('pay.ko'),p.ko,i++);
  if(p.kd)h+=row(t('pay.kd',{n:p.kdN}),p.kd,i++);
  if(p.champ)h+=row(t('pay.champ'),p.champ,i++);
  return h+row(t('pay.total'),p.total,i,'tot')+'<div class="wal">'+esc(t('pay.wallet'))+' '+moneyHTML(save.cash)+'</div></div>';
}
function soloResultHTML(L){
  const {outcome,ko,idx,stage,eliminated,champion}=L,T=save.tour,won=outcome==='win';
  let h='<div class="eyebrow">'+esc(won?(ko?t('res.win_ko'):t('res.win_dec')):outcome==='draw'?t('res.tie'):(ko?t('res.loss_ko'):t('res.loss_dec')))+' · '+esc(fName(idx))+'</div>';
  h+='<h1>'+esc(champion?t('res.champ'):won?t('res.victory'):outcome==='draw'?t('res.draw'):t('res.loss'))+'</h1>';
  if(champion)h+=beltHTML();
  h+=payHTML(L);
  let msg,main='';
  if(champion)msg=t('res.msg_champ',{n:fName(idx)});
  else if(won){
    const pm=T&&T.alive&&T.st<4?playerMatch(T):null,nx=pm?otherOf(pm):null;
    if(nx==null)msg=t('res.victory');
    else{msg=t('res.msg_win',{s:t('stage.'+T.st),n:fName(nx)});main='<button class="btn" data-fight="'+nx+'" data-stage="'+T.st+'">'+esc(t('res.next',{n:fNick(nx)}))+'</button>'}
  }
  else if(outcome==='draw'){msg=t('res.msg_draw');main='<button class="btn" data-fight="'+idx+'" data-stage="'+stage+'">'+esc(t('res.again'))+'</button>'}
  else{msg=t('res.msg_loss',{s:t('stage.'+stage)});}
  if(eliminated||champion)main='<button class="btn" data-newtour="1">'+esc(t('tour.new'))+'</button>';
  h+='<p class="mute">'+esc(msg)+'</p><div class="row" style="justify-content:center">'+main+
    '<button class="btn ghost" data-go="tour">'+esc(t('res.bracket'))+'</button><button class="btn ghost" data-go="locker">'+esc(t('menu.locker'))+'</button></div>';
  return h;
}

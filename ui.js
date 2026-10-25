/* ui.js · menú, 2 jugadores, editor de fotos y resultados (el torneo está en tour.js y el vestuario en locker.js) */
const SCR=['menu','tour','fight','vs','result','editor','locker'];
let current='menu',prevScreen='menu';
let vsPick=['p',4];
let lastResult=null;
const ALL_IDS=['p',...FIGHTERS.map(f=>f.id)];
function show(name){
  if(name!=='editor'&&name!=='locker')prevScreen=name;
  SCR.forEach(s=>{$('#scr-'+s).hidden=s!==name});
  current=name;document.body.classList.toggle('fighting',name==='fight');
  if(name!=='fight'){hideCtrl();gameplayOff()}
  window.scrollTo(0,0);
  if(name!=='menu')cancelAnimationFrame(menuRaf);
  if(name!=='locker')lockerStop();
  if(name==='menu'){renderMenu();if(typeof fitLogo==='function')fitLogo()}
  if(name==='tour'){
    renderTour();
    later(()=>{                                                   /* prepara el ring del próximo combate mientras miras el cuadro */
      if(current!=='tour')return;
      applyRes();
      const T=save.tour;if(T&&T.alive&&T.st<4)getBg(arenaFor(T.st,otherOf(playerMatch(T))));
    });
  }
  if(name==='locker')renderLocker();
  if(name==='editor')renderEditor();
  if(name==='vs'){renderVs();later(()=>{if(current==='vs'){applyRes();getBg(4)}})}
  if(name==='result')renderResult();
}
/* vuelve a escribir los textos de la pantalla visible (al cambiar de idioma) */
function refreshScreen(){
  renderPanels();syncMenuBtns();refreshAdCoins();
  if(current==='menu')renderMenu();
  else if(current==='tour')renderTour();
  else if(current==='locker')renderLocker();
  else if(current==='vs')renderVs();
  else if(current==='editor')renderEditor();
  else if(current==='result')renderResult();
  else if(current==='fight'){hudText();if(ctrlOpen())$('#keytab2').innerHTML=keytabHTML();$('#btn-pause').textContent=G&&G.paused?t('fight.resume'):t('fight.pause')}
}
/* botón de dos pasos: el primer toque pide confirmación, el segundo actúa (los diálogos del navegador no valen en todas partes) */
function armed(btn,key){
  if(btn._arm){clearTimeout(btn._arm.t);btn._arm=null;btn.classList.remove('warn');return true}
  const old=btn.textContent;btn.textContent=t(key);btn.classList.add('warn');
  btn._arm={t:setTimeout(()=>{btn.textContent=old;btn.classList.remove('warn');btn._arm=null},3200)};
  return false;
}

/* ---------- menú con demostración de golpes ---------- */
const KEYMAP=[                                       /* [acción, teclas jugador 1, teclas jugador 2] */
  ['act.move',['A','D'],['←','→']],
  ['act.jab',['F'],['J']],['act.cross',['G'],['K']],['act.knee',['H'],['L']],['act.low',['V'],['N']],['act.high',['B'],['M']],
  ['act.block',['S'],['↓']],['act.dodge',['W'],['↑']]
];
const kbds=a=>'<span class="kc">'+a.map(k=>'<kbd>'+esc(k)+'</kbd>').join('')+'</span>';
function keytabHTML(){
  const row=(lab,hint,k1,k2)=>'<div class="r"><span>'+esc(lab)+(hint?'<small>'+esc(hint)+'</small>':'')+'</span>'+kbds(k1)+kbds(k2)+'</div>';
  const hints={'act.move':'','act.jab':'act.jab.h','act.cross':'act.cross.h','act.knee':'act.knee.h','act.low':'act.low.h','act.high':'act.high.h','act.block':'act.block.h','act.dodge':'act.dodge.h'};
  return '<div class="r h"><span></span><span class="p1">'+esc(t('how.p1'))+'</span><span class="p2">'+esc(t('how.p2'))+'</span></div>'+
    KEYMAP.map(r=>row(t(r[0]),hints[r[0]]?t(hints[r[0]]):'',r[1],r[2])).join('')+
    row(t('act.getup'),t('act.getup.h'),[t('key.space')],[t('key.enter')]);
}
function renderKeytab(){$('#keytab').innerHTML=keytabHTML()}
function controlsHTML(side){
  return KEYMAP.map(r=>'<span class="kk">'+kbds(r[side])+'<span>'+esc(t(r[0]))+'</span></span>').join('');
}
let menuRaf=0,menuLast=0,menuBg=null;
const MW=640,MH=360,MK=MW/W;
function menuBgCanvas(){
  if(menuBg)return menuBg;
  menuBg=document.createElement('canvas');menuBg.width=MW;menuBg.height=MH;
  menuBg.getContext('2d').drawImage(getBg(4),0,0,MW,MH);
  return menuBg;
}
function fitDemo(){const d=$('.demo');if(d&&d.clientWidth)fitScale(d,$('#dui'))}
window.addEventListener('resize',fitDemo);
const DEMO=['jab','cross','knee','low','high'];
function menuLoop(ts){
  if(current!=='menu')return;
  menuRaf=requestAnimationFrame(menuLoop);
  if(ts-menuLast<30)return;                          /* la demostración va a 30 fotogramas: basta y ahorra batería */
  menuLast=ts;
  try{
    const mcv=$('#menucv'),mc=mcv.getContext('2d'),tm=ts/1000;
    mc.setTransform(MK,0,0,MK,0,0);
    mc.drawImage(menuBgCanvas(),0,0,W,H);
    const seg=1.15,i=Math.floor(tm/seg)%DEMO.length,loc=tm%seg;
    const base=(b,x,d,id)=>Object.assign({},b,{id,x,y:GY,d,state:'idle',atk:null,at:0,anim:tm,flash:0,dodgeT:0,koT:0});
    const a=base(lookOf('p'),320,1,'m1'),b=base(FIGHTERS[4],640,-1,'m2');
    const A=ATK[DEMO[i]];
    if(loc<A.start+A.act+A.rec){
      a.atk=DEMO[i];a.at=loc;a.state=DEMO[i];
      if(a.atk==='knee'){a.y=GY-kneeJump(loc);a.x+=Math.min(loc,A.start)/A.start*70}
    }
    const j=Math.floor(tm/(seg*2))%2;
    let lb2;
    if(j===0){b.state='block';lb2='act.block'}else{lb2='act.dodge';if(loc<.34&&i%2===0){b.state='dodge';b.dodgeT=.3;b.x=640+Math.min(60,loc*300)}}
    [a,b].forEach(f=>{
      drawShadow(mc,f.x,GY+8,f.y<GY?.6:1);
      mc.save();mc.translate(f.x,f.y);mc.scale(f.d,1);if(f.state==='dodge')mc.globalAlpha=.6;drawFigure(mc,f);mc.restore();
    });
    tx($('#dl1'),t(DEMO[i]==='knee'?'touch.knee':'act.'+DEMO[i]));tx($('#dl2'),t(lb2));      /* "Rodilla" a secas: el nombre completo no cabe junto al otro rótulo */
  }catch(err){console.error(err)}
}
function renderMenu(){
  cancelAnimationFrame(menuRaf);menuRaf=requestAnimationFrame(menuLoop);
  syncMenuBtns();renderKeytab();
  $('#pname').value=save.name;
  fitDemo();
}
function syncMenuBtns(){
  const T=save.tour,going=!!(T&&T.alive&&T.st<4);
  $('#btn-play').textContent=save.started?(going?t('menu.continue'):t('menu.tour')):t('menu.play');
  $('#btn-new').hidden=!save.started;
  if(!$('#btn-new')._arm)$('#btn-new').textContent=t('menu.reset');
  $('#btn-q').textContent=t('menu.quality')+': '+t('q.'+QMODE);
  const s=$('#btn-snd');s.textContent=SND?'🔊':'🔇';s.setAttribute('aria-pressed',SND);s.setAttribute('aria-label',t('menu.sound'));s.title=t('menu.sound');
}
$('#pname').addEventListener('input',e=>{save.name=e.target.value.trim().toUpperCase().slice(0,14);persist()});
$('#btn-play').onclick=()=>{save.name=$('#pname').value.trim().toUpperCase().slice(0,14);save.started=true;persist();show('tour')};
$('#btn-new').onclick=e=>{
  if(!armed(e.currentTarget,'menu.sure'))return;
  const name=save.name;save=SAVE_DEF();save.name=name;persist();gearChanged();renderMenu();
};
$('#btn-versus').onclick=()=>show('vs');
$('#btn-locker').onclick=()=>{prevScreen='menu';show('locker')};
$('#btn-photos').onclick=()=>{prevScreen='menu';show('editor')};
$('#langbar').addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(b)setLang(b.dataset.lang)});
$('#btn-q').onclick=()=>setQuality(QMODE==='auto'?'high':QMODE==='high'?'low':'auto');
$('#btn-snd').onclick=()=>{setSound(!SND);syncMenuBtns();sfx('bell')};
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-go]');if(!b)return;
  const g=b.dataset.go;
  if(g==='back'){show(prevScreen==='editor'||prevScreen==='locker'?'menu':prevScreen)}else show(g);
});

/* ---------- dos jugadores ---------- */
function renderVs(){
  [1,2].forEach(n=>{
    $('#pick'+n).innerHTML=ALL_IDS.map(id=>{
      return '<button type="button" data-side="'+n+'" data-id="'+id+'" class="'+(vsPick[n-1]===id?'sel':'')+'" aria-pressed="'+(vsPick[n-1]===id)+'"><img alt="" src="'+thumbFor(id)+'"><span>'+esc(id==='p'?playerName():fNick(id))+'</span></button>';
    }).join('');
    $('#vsf'+n).innerHTML=vsFicha(vsPick[n-1]);
    $('#kk'+n).innerHTML=controlsHTML(n);
  });
}
/* ficha del luchador elegido: nombre, apodo, país, récord, peso y altura */
const vsFicha=id=>'<div class="vsn"><b>'+esc(fName(id))+'</b><small>“'+esc(fNick(id))+'”</small></div>'+fichaHTML(id);
$('#scr-vs').addEventListener('click',e=>{
  const b=e.target.closest('[data-side]');
  if(b){vsPick[b.dataset.side-1]=b.dataset.id==='p'?'p':+b.dataset.id;renderVs()}
});
$('#btn-vsgo').onclick=()=>startVersus(vsPick.slice());

/* ---------- fotos y fondo ---------- */
function renderEditor(){
  $('#eds').innerHTML=ALL_IDS.map(id=>{
    const pc=profOf(id).cc;
    return '<div class="ed"><img alt="" src="'+srcFor(id)+'"><div><h3>'+esc(id==='p'?t('ed.you',{n:playerName()}):fName(id))+'</h3><small class="mute">'+esc(id==='p'?t('ed.yourfighter'):'“'+fNick(id)+'”')+(pc?' · '+flagSvg(pc,'sm')+' '+esc(cName(pc)):'')+'</small></div>'+
      '<div class="row"><label class="btn sm" for="up-'+id+'">'+esc(photos[id]?t('ed.change'):t('ed.upload'))+'<input id="up-'+id+'" type="file" accept="image/*" data-photo="'+id+'"></label>'+
      (photos[id]?'<button class="btn ghost sm" data-clear="'+id+'">'+esc(t('ed.remove'))+'</button>':'')+'</div></div>';
  }).join('');
  $('#bgbox').innerHTML='<h3>'+esc(t('ed.bg_title'))+'</h3><p class="mute" style="font-size:14px">'+esc(t('ed.bg_desc'))+'</p>'+
    (photos.bg?'<img alt="'+esc(t('ed.bg_alt'))+'" src="'+photos.bg+'" style="width:100%;max-width:360px;aspect-ratio:16/9;object-fit:cover;border:2px solid var(--line)">':'')+
    '<div class="row"><label class="btn sm" for="up-bg">'+esc(photos.bg?t('ed.bg_change'):t('ed.bg_up'))+'<input id="up-bg" type="file" accept="image/*" data-photo="bg"></label>'+(photos.bg?'<button class="btn ghost sm" data-clear="bg">'+esc(t('ed.bg_remove'))+'</button>':'')+'</div>';
}
function readImage(file,w,h,cb){
  const rd=new FileReader();
  rd.onload=()=>{
    const im=new Image();
    im.onload=()=>{
      const c=document.createElement('canvas');c.width=w;c.height=h;
      if(w===h){const s=Math.min(im.width,im.height);c.getContext('2d').drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,w,h)}
      else{const s=Math.max(w/im.width,h/im.height),dw=im.width*s,dh=im.height*s;c.getContext('2d').drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh)}
      cb(c.toDataURL('image/jpeg',.82));
    };
    im.src=rd.result;
  };
  rd.readAsDataURL(file);
}
function photosChanged(key){
  delete portraitCache['u'+key];delete portraitCache[key];delete portraitCache['t'+key];
  if(key==='bg'){delete bgCache.custom;menuBg=null}
  sprReset();renderEditor();
}
function onUpload(e){
  const inp=e.target.closest('[data-photo]');if(!inp||!inp.files[0])return;
  const key=inp.dataset.photo==='p'?'p':inp.dataset.photo==='bg'?'bg':+inp.dataset.photo;
  readImage(inp.files[0],key==='bg'?960:200,key==='bg'?540:200,url=>{
    photos[key]=url;LS.set('od_photos',photos);photosChanged(key);
  });
}
function onClear(e){
  const b=e.target.closest('[data-clear]');if(!b)return;
  const key=b.dataset.clear==='p'?'p':b.dataset.clear==='bg'?'bg':+b.dataset.clear;
  delete photos[key];LS.set('od_photos',photos);photosChanged(key);
}
$('#eds').addEventListener('change',onUpload);$('#eds').addEventListener('click',onClear);
$('#bgbox').addEventListener('change',onUpload);$('#bgbox').addEventListener('click',onClear);

/* ---------- resultados ---------- */
function beltHTML(){
  return '<svg class="belt" viewBox="0 0 240 90" role="img" aria-label="'+esc(t('belt.alt'))+'">'+
    '<defs><linearGradient id="gdb" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f3cd6a"/><stop offset=".5" stop-color="#e3a72a"/><stop offset="1" stop-color="#8a5c10"/></linearGradient></defs>'+
    '<rect x="0" y="26" width="240" height="38" fill="#14110b" stroke="#3a2f14"/><rect x="0" y="34" width="240" height="4" fill="#e3a72a" opacity=".6"/><rect x="0" y="52" width="240" height="4" fill="#e3a72a" opacity=".6"/>'+
    '<ellipse cx="120" cy="45" rx="62" ry="40" fill="url(#gdb)" stroke="#5c3e0a" stroke-width="3"/><ellipse cx="120" cy="45" rx="48" ry="30" fill="none" stroke="#5c3e0a" stroke-width="2"/>'+
    '<text x="120" y="42" text-anchor="middle" style="font-family:var(--display);font-weight:900" font-size="17.5" fill="#2a1a04">'+esc(t('belt'))+'</text>'+
    '<text x="120" y="60" text-anchor="middle" textLength="84" lengthAdjust="spacingAndGlyphs" style="font-family:var(--display);font-weight:800" font-size="12" fill="#2a1a04">'+esc(t('belt.sub'))+'</text></svg>';
}
function versusEnded(side,ids,ko){lastResult={k:'vs',side,ids,ko};vsPick=ids.slice();show('result')}
function renderResult(){
  const L=lastResult;if(!L)return;
  const r=$('#result');let h;
  if(L.k==='solo'){
    h=soloResultHTML(L);
    r.className='result '+(L.outcome==='win'?'win':L.outcome==='draw'?'draw':'lose');
  }else{
    const tie=L.side===0,n=tie?'':fName(L.ids[L.side-1]);
    h='<div class="eyebrow">'+esc(tie?t('res.tie'):L.ko?t('res.win_ko'):t('res.win_dec'))+'</div><h1>'+esc(tie?t('res.draw'):t('res.vs_win',{s:L.side}))+'</h1><p class="mute">'+esc(tie?t('res.vs_tie'):t('res.vs_msg',{n}))+'</p>'+
      '<div class="row" style="justify-content:center"><button class="btn" data-versus="1">'+esc(t('res.rematch'))+'</button><button class="btn ghost" data-go="vs">'+esc(t('res.vs_change'))+'</button><button class="btn ghost" data-go="menu">'+esc(t('nav.menu'))+'</button></div>';
    r.className='result '+(tie?'draw':'win');
  }
  r.innerHTML=h;
}
$('#scr-result').addEventListener('click',e=>{
  const f=e.target.closest('[data-fight]');if(f){startFight(+f.dataset.fight,+f.dataset.stage);return}
  if(e.target.closest('[data-versus]')){startVersus(vsPick.slice());return}
  if(e.target.closest('[data-newtour]')){newTour();show('tour')}
});

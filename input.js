/* input.js · teclado, botones táctiles y búfer de pulsaciones */
const down={1:{},2:{}},buf={1:{},2:{}};
/* se usa e.code (la tecla física) para que A, D, W, S... funcionen igual con teclado árabe, chino o cualquier otro */
const CODES1={KeyA:'left',KeyD:'right',KeyS:'block',KeyW:'dodge',KeyF:'jab',KeyG:'cross',KeyH:'knee',KeyV:'low',KeyB:'high'};
const CODES2={ArrowLeft:'left',ArrowRight:'right',ArrowDown:'block',ArrowUp:'dodge',KeyJ:'jab',KeyK:'cross',KeyL:'knee',KeyN:'low',KeyM:'high'};
const KEYS1={a:'left',d:'right',s:'block',w:'dodge',f:'jab',g:'cross',h:'knee',v:'low',b:'high'};
const KEYS2={arrowleft:'left',arrowright:'right',arrowdown:'block',arrowup:'dodge',j:'jab',k:'cross',l:'knee',n:'low',m:'high'};
const BUFFERED={jab:1,cross:1,low:1,high:1,knee:1,dodge:1};
function press(p,a){if(!down[p][a]&&BUFFERED[a])buf[p][a]=.2;down[p][a]=true}
function release(p,a){down[p][a]=false}
function clearInput(){[1,2].forEach(p=>{for(const k in down[p])down[p][k]=false;buf[p]={}});$$('.tp button.hold').forEach(b=>b.classList.remove('hold'))}
function lookup(e){
  let a=CODES1[e.code];if(a)return [1,a];
  a=CODES2[e.code];if(a)return [G&&G.mode==='solo'?1:2,a];
  if(!e.code||e.code==='Unidentified'){
    const k=(e.key||'').toLowerCase();
    if(KEYS1[k])return [1,KEYS1[k]];
    if(KEYS2[k])return [G&&G.mode==='solo'?1:2,KEYS2[k]];
  }
  return null;
}
const isSpace=e=>e.code==='Space'||e.key===' ';
const isEnter=e=>e.code==='Enter'||e.code==='NumpadEnter'||e.key==='Enter';
window.addEventListener('keydown',e=>{
  if(current!=='fight'||!G||e.ctrlKey||e.metaKey||e.altKey)return;
  if(ctrlOpen()){                                                /* con la ventana de controles abierta, Esc o P solo la cierran */
    if(e.code==='KeyP'||e.key==='Escape'||e.code==='Escape'){e.preventDefault();if(!e.repeat)closeCtrl()}
    return;
  }
  if(isSpace(e)||isEnter(e)){
    e.preventDefault();if(e.repeat)return;
    if(skipPhase())return;
    mash(isSpace(e)?1:(G.mode==='solo'?1:2));return;
  }
  if(e.code==='KeyP'||e.key==='Escape'||e.code==='Escape'){e.preventDefault();if(!e.repeat)togglePause();return}
  const m=lookup(e);
  if(m){press(m[0],m[1]);e.preventDefault()}
  else if(!e.repeat&&e.key&&e.key.length===1)skipPhase();
});
window.addEventListener('keyup',e=>{
  if(current!=='fight')return;
  if(isSpace(e)||isEnter(e))e.preventDefault();
  const m=G?lookup(e):null;if(m)release(m[0],m[1]);
});
window.addEventListener('blur',()=>{clearInput();autoPause()});

/* botones táctiles (se vuelven a escribir al cambiar de idioma; los eventos van en el contenedor) */
function panelHTML(p){
  const b=(k,txt,c)=>'<button type="button" data-p="'+p+'" data-k="'+k+'"'+(c?' class="'+c+'"':'')+'>'+txt+'</button>';
  return '<div class="mv">'+b('left','◀')+b('right','▶')+b('block',esc(t('touch.block')),'def')+b('dodge',esc(t('touch.dodge')),'dod')+'</div>'+
         '<div class="at">'+b('jab',esc(t('touch.jab')))+b('cross',esc(t('touch.cross')))+b('low',esc(t('touch.low')))+b('high',esc(t('touch.high')))+b('knee',esc(t('touch.knee')),'kn')+'</div>';
}
function renderPanels(){$('#tp1').innerHTML=panelHTML(1);$('#tp2').innerHTML=panelHTML(2);$('#gu1').textContent=$('#gu2').textContent=t('touch.getup')}
function bindPanel(el){
  el.addEventListener('pointerdown',e=>{
    const b=e.target.closest('button');if(!b)return;
    e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}
    b.classList.add('hold');press(+b.dataset.p,b.dataset.k);
  });
  const up=e=>{const b=e.target.closest('button');if(!b)return;b.classList.remove('hold');release(+b.dataset.p,b.dataset.k)};
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,up));
  el.addEventListener('contextmenu',e=>e.preventDefault());
}
bindPanel($('#tp1'));bindPanel($('#tp2'));renderPanels();
function setupTouch(){
  /* botones en pantalla si el dispositivo es táctil o no tiene ratón (no por el tamaño: en Poki el juego puede ir en un marco pequeño en el ordenador) */
  const mm=q=>window.matchMedia&&matchMedia(q).matches;
  const touchy=mm('(pointer:coarse)')||!mm('(any-pointer:fine)');
  $('#tp1').classList.toggle('on',touchy);
  $('#tp2').classList.toggle('on',touchy&&G&&G.mode==='versus');
  if(G)G.touchy=touchy;
}
function humanInput(p,dt){
  const b=buf[p],d=down[p];
  for(const k in b){b[k]-=dt;if(b[k]<=0)delete b[k]}
  return {move:(d.right?1:0)-(d.left?1:0),block:!!d.block,dodge:!!b.dodge,jab:!!b.jab,cross:!!b.cross,low:!!b.low,high:!!b.high,knee:!!b.knee};
}
const NOINP={move:0,block:false,dodge:false,jab:false,cross:false,low:false,high:false,knee:false};

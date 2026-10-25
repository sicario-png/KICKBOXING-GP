/* locker.js · vestuario: probar y comprar guantes, calzonas y bailes con el dinero de los combates.
   El equipo es solo estético: no cambia la fuerza ni la defensa (eso se compra en el entrenamiento). */
let lkCat='glove',lkSel={},lkRaf=0,lkLast=0,lkT0=0;
const thumbMemo={};
const DANCE_SNAP={d0:.3,d1:.26,d2:.2,d3:.35,d4:.2,d5:.1,d6:.38};      /* instante de cada baile que se usa en la miniatura */

/* miniatura de un artículo: se dibuja una vez con las mismas funciones que usa el combate */
function gearThumb(cat,it){
  const k=cat+it.id;if(thumbMemo[k])return thumbMemo[k];
  const c=document.createElement('canvas');c.width=c.height=84;const g=c.getContext('2d');
  g.translate(42,42);
  if(cat==='glove'){
    g.translate(5,0);g.scale(1.25,1.25);glove(g,0,0,17,it.c,-.45,it.s,it.c2);
  }else if(cat==='trunk'){
    g.scale(.95,.95);drawTrunks(g,{trunk:it.c,glove:PLAYER.glove,ts:it.s,t2:it.c2},[0,-2]);
  }else{
    const look=Object.assign({},PLAYER,{id:'th',d:1,state:'idle',atk:null,at:0,anim:DANCE_SNAP[it.id]||.3,flash:0,hp:1,maxhp:1,dodgeT:0,koT:0,dance:it.id});
    g.translate(-5,38);g.scale(.265,.265);drawFigure(g,look);
  }
  return thumbMemo[k]=c.toDataURL('image/png');
}

/* ---------- pantalla ---------- */
function lkEquippedWith(){
  const eq=Object.assign({},save.gear.eq);
  for(const cat in lkSel)if(lkSel[cat])eq[cat]=lkSel[cat];
  return eq;
}
function renderLocker(){
  $('#wallet-l').innerHTML=moneyHTML(save.cash);
  $('#lk-tabs').innerHTML=SHOP_CATS.map(c=>'<button type="button" role="tab" class="tab'+(c===lkCat?' on':'')+'" aria-selected="'+(c===lkCat)+'" data-cat="'+c+'">'+esc(t('lk.tab.'+c))+'</button>').join('');
  const own=save.gear.own[lkCat],eqId=save.gear.eq[lkCat],sel=lkSel[lkCat]||eqId;
  $('#lk-items').innerHTML=SHOP[lkCat].map(it=>{
    const has=own.includes(it.id),on=it.id===eqId;
    const st=on?'<small class="ok">'+esc(t('lk.equipped'))+'</small>':has?'<small class="ok">'+esc(t('lk.owned'))+'</small>':it.p?'<small>'+moneyHTML(it.p)+'</small>':'<small class="ok">'+esc(t('lk.free'))+'</small>';
    return '<button type="button" class="it'+(it.id===sel?' sel':'')+(has?' own':'')+(on?' eq':'')+'" data-item="'+it.id+'" aria-pressed="'+(it.id===sel)+'">'+
      '<img alt="" src="'+gearThumb(lkCat,it)+'"><b>'+esc(t('it.'+it.id))+'</b>'+st+'</button>';
  }).join('');
  const it=itemOf(lkCat,sel),has=own.includes(it.id),on=it.id===eqId;
  let act;
  if(on)act='<button class="btn" disabled>'+esc(t('lk.equipped'))+' ✓</button>';
  else if(has)act='<button class="btn" data-equip="'+it.id+'">'+esc(t('lk.equip'))+'</button>';
  else{
    const ok=save.cash>=it.p;
    act='<button class="btn" data-buy="'+it.id+'"'+(ok?'':' disabled')+'>'+esc(t('lk.buy'))+' · '+moneyHTML(it.p)+'</button>'+(ok?'':'<small class="mute">'+esc(t('lk.need',{n:fmt(it.p-save.cash)}))+'</small>');
  }
  $('#lk-name').textContent=t('it.'+it.id);
  $('#lk-act').innerHTML=act;
  lockerStart();
}
$('#scr-locker').addEventListener('click',e=>{
  const tab=e.target.closest('[data-cat]');
  if(tab){lkCat=tab.dataset.cat;renderLocker();return}
  const item=e.target.closest('[data-item]');
  if(item){lkSel[lkCat]=item.dataset.item;renderLocker();return}
  const buy=e.target.closest('[data-buy]');
  if(buy&&!buy.disabled){
    const it=itemOf(lkCat,buy.dataset.buy);
    if(!save.gear.own[lkCat].includes(it.id)&&save.cash>=it.p){
      save.cash-=it.p;save.gear.own[lkCat].push(it.id);save.gear.eq[lkCat]=it.id;lkSel[lkCat]=it.id;
      persist();gearChanged();sfx('buy');sfx('coin');renderLocker();
    }
    return;
  }
  const eq=e.target.closest('[data-equip]');
  if(eq&&save.gear.own[lkCat].includes(eq.dataset.equip)){
    save.gear.eq[lkCat]=eq.dataset.equip;lkSel[lkCat]=eq.dataset.equip;
    persist();gearChanged();sfx('bell');renderLocker();
  }
});

/* ---------- el boxeador del vestuario: da golpes (o baila) con lo que llevas puesto o estás probando ---------- */
const LK_MOVES=['jab','cross','knee','low','high'],LK_S=1.35;
function lockerFrame(ts){
  if(current!=='locker'){lkRaf=0;return}
  lkRaf=requestAnimationFrame(lockerFrame);
  if(ts-lkLast<33)return;lkLast=ts;
  try{
    const cv=$('#lkcv'),g=cv.getContext('2d'),tm=Math.max(0,(ts-lkT0)/1000);        /* el primer fotograma puede llegar un pelo antes que lkT0 */
    g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);
    const bg=g.createRadialGradient(180,170,10,180,230,330);bg.addColorStop(0,'#2b3340');bg.addColorStop(1,'#0b0d12');
    g.fillStyle=bg;g.fillRect(0,0,cv.width,cv.height);
    const cone=g.createLinearGradient(0,0,0,400);cone.addColorStop(0,'rgba(255,240,200,.22)');cone.addColorStop(1,'rgba(255,240,200,0)');
    g.fillStyle=cone;g.beginPath();g.moveTo(140,0);g.lineTo(220,0);g.lineTo(330,400);g.lineTo(30,400);g.closePath();g.fill();
    g.save();g.translate(180,396);g.scale(1,.2);g.fillStyle='rgba(255,255,255,.1)';g.beginPath();g.arc(0,0,130,0,7);g.fill();g.restore();
    const eq=lkEquippedWith();
    const f=Object.assign({},PLAYER,gearLook(eq),{id:'lk',d:1,state:'idle',atk:null,at:0,anim:tm,flash:0,hp:1,maxhp:1,dodgeT:0,koT:0,dance:null});
    let jy=0,dx=0;
    if(lkCat==='dance')f.dance=eq.dance;
    else{
      const seg=1.25,i=Math.floor(tm/seg)%LK_MOVES.length,loc=tm%seg,name=LK_MOVES[i],A=ATK[name];
      if(loc<A.start+A.act+A.rec){
        f.atk=name;f.at=loc;f.state=name;
        if(name==='knee'){jy=kneeJump(loc)*.7;dx=Math.min(loc,A.start)/A.start*34}   /* el salto se acorta para que la cabeza no se salga del cuadro */
      }
    }
    drawShadow(g,168+dx*LK_S,404,jy>0?.6:1);
    g.save();g.translate(150+dx*LK_S,396-jy*LK_S);g.scale(LK_S,LK_S);drawFigure(g,f);g.restore();
  }catch(err){console.error(err)}
}
function lockerStart(){if(!lkRaf){lkT0=performance.now();lkRaf=requestAnimationFrame(lockerFrame)}}
function lockerStop(){if(lkRaf){cancelAnimationFrame(lkRaf);lkRaf=0}lkSel={}}

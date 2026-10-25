/* storage.js · progreso, dinero, equipo, torneo y fotos del usuario (se guardan en el navegador) */
const SAVE_DEF=()=>({
  name:'',cash:0,started:false,
  up:{pow:0,spd:0,hp:0,def:0},
  gear:{own:{glove:['g0'],trunk:['t0'],dance:['d0']},eq:{glove:'g0',trunk:'t0',dance:'d0'}},
  stats:{t:0,titles:0,w:0,l:0,d:0,ko:0},
  tour:null
});
const nOr=(v,d,a,b)=>{v=Math.floor(Number(v));return isFinite(v)?clamp(v,a,b):d};

/* un torneo guardado solo vale si está completo y sus luchadores existen */
function validTour(T){
  try{
    const okId=id=>id==='p'||(Number.isInteger(id)&&id>=0&&id<NRIV);
    if(!T||!Array.isArray(T.slots)||T.slots.length!==16||!T.slots.every(okId)||new Set(T.slots).size!==16||!T.slots.includes('p'))return false;
    if(!Array.isArray(T.r)||T.r.length!==4)return false;
    for(let s=0;s<4;s++){
      if(!Array.isArray(T.r[s])||T.r[s].length!==8>>s)return false;
      for(const m of T.r[s]){
        if(!m||(m.a!=null&&!okId(m.a))||(m.b!=null&&!okId(m.b))||(m.w!=null&&!okId(m.w)))return false;
      }
    }
    return Number.isInteger(T.st)&&T.st>=0&&T.st<=4;
  }catch(e){return false}
}
const OLD_BOOTS={b1:200,b2:350,b3:500,b4:650,b5:900,b6:1500};   /* precios de las botas que había antes */
function loadSave(){
  const raw=LS.get('od_save',{})||{},s=SAVE_DEF();let refunded=false;
  if(typeof raw.name==='string')s.name=raw.name.slice(0,14);
  if(s.name==='TÚ'||s.name==='YOU')s.name='';                     /* "sin nombre": se muestra "Tú / You / أنت / 你" según el idioma */
  s.started=!!raw.started;
  /* guardados de la versión anterior: cada punto de entrenamiento pasa a ser 100 de dinero */
  s.cash=raw.cash!=null?nOr(raw.cash,0,0,1e9):nOr((raw.pts||0)*100,0,0,1e9);
  const u=raw.up||{};
  ['pow','spd','hp','def'].forEach(k=>{s.up[k]=nOr(u[k],0,0,MAXUP)});
  const g=raw.gear;
  if(g&&g.own&&Array.isArray(g.own.boot)){                        /* las botas se quitaron de la tienda: se devuelve lo que costaron */
    const back=[...new Set(g.own.boot)].reduce((a,id)=>a+(OLD_BOOTS[id]||0),0);
    if(back>0){s.cash=Math.min(1e9,s.cash+back);refunded=true}
  }
  if(g&&g.own&&g.eq){
    SHOP_CATS.forEach(cat=>{
      const have=Array.isArray(g.own[cat])?g.own[cat].filter(id=>SHOP[cat].some(x=>x.id===id)):[];
      const first=SHOP[cat][0].id;
      if(!have.includes(first))have.unshift(first);
      s.gear.own[cat]=[...new Set(have)];
      s.gear.eq[cat]=have.includes(g.eq[cat])?g.eq[cat]:first;
    });
  }
  const st=raw.stats||{};
  ['t','titles','w','l','d','ko'].forEach(k=>{s.stats[k]=nOr(st[k],0,0,1e7)});
  s.tour=validTour(raw.tour)?raw.tour:null;
  if(refunded)LS.set('od_save',s);                                 /* para no devolver el dinero dos veces */
  return s;
}
let save=loadSave();
let photos=LS.get('od_photos',{});
function persist(){LS.set('od_save',save)}

/* ---------- aspecto del jugador (lo que lleva puesto del vestuario) ---------- */
let PLAYER_LOOK=null;
function gearOf(cat,eq){return itemOf(cat,(eq||save.gear.eq)[cat])}
function gearLook(eq){
  const g=gearOf('glove',eq),t=gearOf('trunk',eq);
  return {glove:g.c,gs:g.s,c2:g.c2,trunk:t.c,ts:t.s,t2:t.c2,dn:(eq||save.gear.eq).dance};
}
/* todo lo que hace falta para dibujar a un luchador (el jugador lleva su equipo; los rivales, el suyo) */
function lookOf(id){
  if(id!=='p')return FIGHTERS[id];
  if(!PLAYER_LOOK)PLAYER_LOOK=Object.assign({},PLAYER,gearLook());
  return PLAYER_LOOK;
}
/* clave corta del equipo, para la caché de dibujos */
const gearKey=f=>[f.gs,f.c2,f.ts,f.t2].join('.');
function gearChanged(){
  PLAYER_LOOK=null;
  if(typeof portraitCache!=='undefined'){delete portraitCache.p;delete portraitCache.up;delete portraitCache.tp}
  if(typeof sprReset==='function')sprReset();
}

const photoImgs={};
function photoImg(id){
  if(!photos[id])return null;
  let r=photoImgs[id];
  if(!r||r.src!==photos[id]){r=new Image();r.src=photos[id];photoImgs[id]=r}
  return r.complete&&r.naturalWidth?r:null;
}

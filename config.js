/* config.js · constantes, utilidades y datos del juego (se carga primero) */
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const LS={
  get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
};
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const later=(fn)=>{(window.requestIdleCallback||(f=>setTimeout(f,60)))(fn)};

/* compatibilidad: navegadores antiguos (Chromebooks, iPhone viejos) no traen roundRect y el juego se congelaba */
if(window.CanvasRenderingContext2D&&!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
    r=Math.min(Array.isArray(r)?r[0]:(r||0),Math.abs(w)/2,Math.abs(h)/2);
    this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath();
  };
}

/* mundo del combate (coordenadas lógicas 960x540) */
const W=960,H=540,GY=452,XMIN=92,XMAX=W-92;
const ROUND_TIME=60;                                             /* segundos reales por asalto (el reloj marca 3:00) */

/* calidad gráfica. TIER 2 = alta, 1 = media, 0 = baja.
   En "auto" se mide el equipo al arrancar y, si en pleno combate va justo, baja sola un nivel. */
const TIERS=[
  {cap:.85,sprites:true, fx:.45},   /* baja: lienzo pequeño, luchadores precalculados, menos partículas */
  {cap:1.25,sprites:true,fx:.75},   /* media */
  {cap:2,  sprites:false,fx:1}      /* alta: vectores a toda resolución */
];
let QMODE=LS.get('od_q','auto');if(QMODE!=='high'&&QMODE!=='low')QMODE='auto';
let TIER=QMODE==='high'?2:QMODE==='low'?0:2;
let RES=1;                                                       /* resolución interna del lienzo (la fija fight.js) */

/* ---------- datos ----------
   FIGHTERS: 15 rivales. La posición en el array es su id (las fotos que subas se guardan por id, así que no cambia).
   rk = fuerza de 1 (el más fácil) a 15 (el campeón): se usa para sortear el cuadro y simular los otros combates.
   gs/ts = estilo de guantes y calzonas; c2/t2 = colores de detalle; dn = baile de victoria.
   Ficha (se enseña en la presentación, el torneo y 2 jugadores): cc = país (2 letras, banderas en profile.js), kg = peso, cm = altura
   y rec = récord de antes del torneo [victorias, derrotas, empates, KO]. Cada rival es de un país distinto; tu luchador no tiene país (su récord es el real). */
const PLAYER={id:'p',skin:'#d9a47c',hair:'#1c120b',style:'short',beard:false,scar:false,trunk:'#d9382f',glove:'#d9382f',bg:['#5a2420','#170d0d'],kg:70,cm:178};
const FIGHTERS=[
 {id:0,rk:1, skin:'#e0ac86',hair:'#3a2a1c',style:'short',beard:false,scar:false,trunk:'#2e74dc',glove:'#2e74dc',bg:['#2b3a55','#121722'],hp:170,pow:1.0,spd:1.0,aggr:0.5,blk:0.35,react:0.34,chin:.3,dn:'d0',cc:'es',kg:50,cm:163,rec:[4,3,0,1]},
 {id:1,rk:2, skin:'#c98f66',hair:'#111111',style:'buzz',beard:false,scar:false,trunk:'#27a36a',glove:'#27a36a',bg:['#1f4a3b','#0e1a16'],hp:190,pow:1.1,spd:1.05,aggr:0.55,blk:0.42,react:0.3,chin:.4,dn:'d2',ts:'stripes',t2:'#ecebe6',cc:'br',kg:53,cm:167,rec:[6,3,1,2]},
 {id:2,rk:4, skin:'#e8c19a',hair:'#0e0e12',style:'quiff',beard:false,scar:false,trunk:'#7a4fd1',glove:'#7a4fd1',bg:['#3a2b5e','#140f22'],hp:210,pow:1.2,spd:1.1,aggr:0.62,blk:0.5,react:0.26,chin:.45,dn:'d1',gs:'stripe',c2:'#ecebe6',cc:'th',kg:57,cm:166,rec:[11,4,0,5]},
 {id:3,rk:6, skin:'#e6b9a0',hair:'#6b4a2a',style:'bald',beard:true,scar:false,trunk:'#8a5a2b',glove:'#8a5a2b',bg:['#4a3523','#17110b'],hp:260,pow:1.25,spd:1.0,aggr:0.66,blk:0.55,react:0.24,chin:.8,dn:'d6',ts:'band',t2:'#e3a72a',cc:'ro',kg:98,cm:190,rec:[15,6,0,11]},
 {id:4,rk:8, skin:'#d7a07a',hair:'#1f120c',style:'curly',beard:false,scar:false,trunk:'#1fb5a3',glove:'#1fb5a3',bg:['#1b4a49','#0c1b1b'],hp:230,pow:1.35,spd:1.2,aggr:0.72,blk:0.62,react:0.2,chin:.5,dn:'d2',ts:'stars',t2:'#ffffff',cc:'nl',kg:61,cm:173,rec:[19,6,1,9]},
 {id:5,rk:10,skin:'#8a5a3a',hair:'#0b0b0b',style:'short',beard:true,scar:false,trunk:'#d9852a',glove:'#d9852a',bg:['#5a3a17','#1c1208'],hp:280,pow:1.45,spd:1.12,aggr:0.78,blk:0.7,react:0.18,chin:.7,dn:'d5',gs:'flame',c2:'#ffd24a',cc:'cu',kg:72,cm:179,rec:[24,7,1,17]},
 {id:6,rk:12,skin:'#b97a52',hair:'#c9c9c9',style:'mohawk',beard:false,scar:true,trunk:'#2a7a3a',glove:'#2a7a3a',bg:['#233d1f','#0d150c'],hp:270,pow:1.55,spd:1.22,aggr:0.84,blk:0.78,react:0.16,chin:.6,dn:'d3',gs:'camo',c2:'#8b9b5a',ts:'tiger',t2:'#17171c',cc:'mx',kg:66,cm:174,rec:[29,8,2,18]},
 {id:7,rk:15,skin:'#f0cdb4',hair:'#d9c27a',style:'short',beard:true,scar:true,trunk:'#e3a72a',glove:'#e3a72a',bg:['#5c4412','#1a1306'],hp:320,pow:1.7,spd:1.28,aggr:0.9,blk:0.85,react:0.14,chin:.9,dn:'d4',gs:'gold',c2:'#fff1b0',ts:'gold',t2:'#17171c',cc:'ru',kg:94,cm:191,rec:[41,2,1,33]},
 {id:8,rk:3, skin:'#e9b896',hair:'#8a5a2b',style:'short',beard:true,scar:false,trunk:'#ecebe6',glove:'#e8c14f',bg:['#4a3d2b','#17130d'],hp:200,pow:1.15,spd:1.05,aggr:0.58,blk:0.46,react:0.28,chin:.4,dn:'d0',ts:'band',t2:'#e8c14f',cc:'fr',kg:55,cm:169,rec:[9,4,1,3]},
 {id:9,rk:5, skin:'#6b4429',hair:'#0a0a0a',style:'buzz',beard:true,scar:false,trunk:'#17171c',glove:'#8a3fd1',bg:['#2a1b3f','#0f0a18'],hp:225,pow:1.25,spd:1.15,aggr:0.65,blk:0.54,react:0.24,chin:.5,dn:'d2',ts:'band',t2:'#8a3fd1',gs:'stripe',c2:'#ecebe6',cc:'ng',kg:59,cm:172,rec:[14,5,1,8]},
 {id:10,rk:7,skin:'#e6b98a',hair:'#101010',style:'topknot',beard:false,scar:false,trunk:'#c9302c',glove:'#e3a72a',bg:['#4a1a1a','#150808'],hp:240,pow:1.32,spd:1.12,aggr:0.68,blk:0.6,react:0.22,chin:.55,dn:'d1',ts:'flames',t2:'#ffb02e',gs:'gold',c2:'#fff1b0',cc:'jp',kg:63,cm:171,rec:[17,5,2,7]},
 {id:11,rk:9,skin:'#c58f64',hair:'#141414',style:'short',beard:true,scar:false,trunk:'#1f6f5a',glove:'#e8e6df',bg:['#1b3a33','#0a1512'],hp:255,pow:1.4,spd:1.16,aggr:0.74,blk:0.66,react:0.19,chin:.62,dn:'d3',ts:'stripes',t2:'#ecebe6',cc:'ma',kg:76,cm:181,rec:[22,6,2,12]},
 {id:12,rk:11,skin:'#eac3a5',hair:'#a8441c',style:'short',beard:true,scar:false,trunk:'#2a63c9',glove:'#f0eee8',bg:['#233a63','#0b1220'],hp:262,pow:1.5,spd:1.24,aggr:0.8,blk:0.72,react:0.17,chin:.6,dn:'d5',ts:'stars',t2:'#ffffff',gs:'star',c2:'#2a63c9',cc:'se',kg:79,cm:186,rec:[26,6,0,15]},
 {id:13,rk:13,skin:'#5a3820',hair:'#050505',style:'afro',beard:false,scar:false,trunk:'#e0b21a',glove:'#1a1a1f',bg:['#3b3512','#12100a'],hp:300,pow:1.6,spd:1.2,aggr:0.86,blk:0.8,react:0.15,chin:.75,dn:'d6',ts:'checker',t2:'#17171c',gs:'neon',c2:'#ffe96a',cc:'gh',kg:90,cm:192,rec:[31,7,1,24]},
 {id:14,rk:14,skin:'#c89068',hair:'#1a1a1a',style:'spiky',beard:false,scar:true,trunk:'#6a6f78',glove:'#d12f2f',bg:['#2d3138','#0f1114'],hp:310,pow:1.65,spd:1.24,aggr:0.88,blk:0.82,react:0.145,chin:.8,dn:'d4',ts:'tiger',t2:'#2a2d33',gs:'tiger',c2:'#17171c',cc:'tr',kg:69,cm:177,rec:[34,6,1,22]}
];
const NRIV=FIGHTERS.length;                                      /* 15 rivales + tú = 16 en el cuadro */
const CHIN=FIGHTERS.map(f=>f.chin);                              /* aguante de cada rival ante el KO */
const UPG=[{k:'pow'},{k:'spd'},{k:'hp'},{k:'def'}];
const MAXUP=5;
const UPCOST=[150,300,500,800,1200];                             /* lo que cuesta cada nivel de entrenamiento */

/* premios por combate. base = premio de ganar en cada fase (octavos, cuartos, semifinales, final) */
const PRIZE={win:[300,450,700,1100],draw:.5,loss:.25,ko:.5,kd:30,champ:1500};

const ATK={
  jab:  {start:.06,act:.07,rec:.12,dmg:4, rng:86, kb:90, stun:.20},
  cross:{start:.12,act:.08,rec:.20,dmg:7, rng:94, kb:170,stun:.30},
  low:  {start:.16,act:.09,rec:.26,dmg:8, rng:112,kb:150,stun:.34},
  high: {start:.22,act:.10,rec:.34,dmg:13,rng:120,kb:300,stun:.45},
  /* rodilla en salto: la más fuerte y la más lenta. Avanza saltando, casi no se puede parar con el bloqueo (gb) y deja al rival aturdido */
  knee: {start:.30,act:.12,rec:.46,dmg:21,rng:112,kb:430,stun:.62,gb:.35,gbs:.22,lunge:230}
};
const KNEE_JUMP=78;                                              /* altura del salto en píxeles */

/* arenas: cada fase del torneo usa unas u otras */
const ARENAS=[
 {floor:'#2a4d8f',banner:'#2e74dc'},
 {floor:'#23704f',banner:'#27a36a'},
 {floor:'#5a3d96',banner:'#7a4fd1'},
 {floor:'#6b4a2a',banner:'#a8743a'},
 {floor:'#16766d',banner:'#1fb5a3'},
 {floor:'#9a5b17',banner:'#d9852a'},
 {floor:'#27602d',banner:'#2a7a3a'},
 {floor:'#8a1f1a',banner:'#e3a72a'}
];
const ARENA_FOR_STAGE=[[0,1],[2,3],[4,5,6],[7]];                 /* octavos, cuartos, semifinal, final */
const arenaFor=(stage,opp)=>{const l=ARENA_FOR_STAGE[stage]||[4];return l[(opp|0)%l.length]};

/* ---------- vestuario ----------
   p = precio. c/c2 = colores, s = estilo de dibujo (ver gear.js). Los nombres están en i18n.js como it.<id>. */
const SHOP={
 glove:[
  {id:'g0',p:0,   c:'#d9382f',c2:'#ecebe6',s:'plain'},
  {id:'g1',p:150, c:'#2e74dc',c2:'#ecebe6',s:'plain'},
  {id:'g2',p:250, c:'#1b1b21',c2:'#d9382f',s:'stripe'},
  {id:'g3',p:400, c:'#25d27a',c2:'#eaffb0',s:'neon'},
  {id:'g4',p:700, c:'#e3a72a',c2:'#fff1b0',s:'gold'},
  {id:'g5',p:900, c:'#c8321e',c2:'#ffb02e',s:'flame'},
  {id:'g6',p:1100,c:'#4f6b3a',c2:'#8b9b5a',s:'camo'},
  {id:'g7',p:1500,c:'#f0eee8',c2:'#2e74dc',s:'star'},
  {id:'g8',p:2200,c:'#e8821e',c2:'#1a1208',s:'tiger'}
 ],
 trunk:[
  {id:'t0',p:0,   c:'#d9382f',c2:'#ecebe6',s:'plain'},
  {id:'t1',p:150, c:'#2e74dc',c2:'#ecebe6',s:'plain'},
  {id:'t2',p:350, c:'#17171c',c2:'#e3a72a',s:'band'},
  {id:'t3',p:500, c:'#1f9a5f',c2:'#ecebe6',s:'stripes'},
  {id:'t4',p:800, c:'#2a3f8f',c2:'#ffffff',s:'stars'},
  {id:'t5',p:1000,c:'#1a1a1f',c2:'#ff7a1e',s:'flames'},
  {id:'t6',p:1300,c:'#e8821e',c2:'#1a1208',s:'tiger'},
  {id:'t7',p:1700,c:'#ecebe6',c2:'#1a1a1f',s:'checker'},
  {id:'t8',p:2600,c:'#e3a72a',c2:'#17171c',s:'gold'}
 ],
 dance:[
  {id:'d0',p:0},{id:'d1',p:300},{id:'d2',p:500},{id:'d3',p:800},{id:'d4',p:1000},{id:'d5',p:1400},{id:'d6',p:2000}
 ]
};
const SHOP_CATS=['glove','trunk','dance'];
const itemOf=(cat,id)=>SHOP[cat].find(x=>x.id===id)||SHOP[cat][0];

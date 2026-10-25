/* profile.js · fichas de luchador: país (con su bandera), récord, peso y altura.
   Los datos de cada rival están en FIGHTERS (config.js: cc, kg, cm, rec). Los tuyos salen de PLAYER y de tus estadísticas reales (save.stats). */

/* ---------- banderas: SVG de 30x20, sencillas pero reconocibles ---------- */
function starPts(cx,cy,r,rot){                                   /* estrella de cinco puntas (rot = grados; -90 apunta hacia arriba) */
  const a=[];
  for(let i=0;i<10;i++){
    const q=((rot==null?-90:rot)+i*36)*Math.PI/180,rr=i%2?r*.382:r;
    a.push((cx+rr*Math.cos(q)).toFixed(2)+','+(cy+rr*Math.sin(q)).toFixed(2));
  }
  return a.join(' ');
}
function pentagram(cx,cy,r){                                     /* estrella de cinco puntas dibujada de un trazo (bandera de Marruecos) */
  const P=k=>{const q=(-90+k*72)*Math.PI/180;return (cx+r*Math.cos(q)).toFixed(2)+','+(cy+r*Math.sin(q)).toFixed(2)};
  return 'M'+[0,2,4,1,3].map(P).join('L')+'Z';
}
const rc=(x,y,w,h,f)=>'<rect'+(x?' x="'+x+'"':'')+(y?' y="'+y+'"':'')+' width="'+w+'" height="'+h+'" fill="'+f+'"/>';
const hbands=(...c)=>c.map((f,i)=>rc(0,+(i*20/c.length).toFixed(2),30,+(20/c.length+.02).toFixed(2),f)).join('');   /* franjas horizontales iguales */
const vbands=(...c)=>c.map((f,i)=>rc(+(i*30/c.length).toFixed(2),0,+(30/c.length+.02).toFixed(2),20,f)).join('');   /* franjas verticales iguales */
const FLAGS={
  es:rc(0,0,30,20,'#c60b1e')+rc(0,5,30,10,'#ffc400'),
  br:rc(0,0,30,20,'#009b3a')+'<path d="M15 2.4 27.2 10 15 17.6 2.8 10z" fill="#fedf00"/><circle cx="15" cy="10" r="4.4" fill="#002776"/><path d="M10.7 9c3.2-.9 6.6-.4 8.8 1.4" fill="none" stroke="#fff" stroke-width=".9"/>',
  th:rc(0,0,30,20,'#a51931')+rc(0,3.33,30,13.34,'#f4f5f8')+rc(0,6.67,30,6.66,'#2d2a4a'),
  ro:vbands('#002b7f','#fcd116','#ce1126'),
  nl:hbands('#ae1c28','#ffffff','#21468b'),
  cu:rc(0,0,30,20,'#002a8f')+rc(0,4,30,4,'#fff')+rc(0,12,30,4,'#fff')+'<path d="M0 0 17.3 10 0 20z" fill="#cf142b"/><polygon points="'+starPts(5.6,10,3)+'" fill="#fff"/>',
  mx:vbands('#006847','#ffffff','#ce1126')+'<circle cx="15" cy="10" r="2.5" fill="#8c5a2b"/><path d="M12.7 11.9a3 3 0 0 0 4.6 0" fill="none" stroke="#006847" stroke-width=".9"/>',
  ru:hbands('#ffffff','#0039a6','#d52b1e'),
  fr:vbands('#0055a4','#ffffff','#ef4135'),
  ng:vbands('#008751','#ffffff','#008751'),
  jp:rc(0,0,30,20,'#fff')+'<circle cx="15" cy="10" r="6" fill="#bc002d"/>',
  ma:rc(0,0,30,20,'#c1272d')+'<path d="'+pentagram(15,10.7,5.4)+'" fill="none" stroke="#006233" stroke-width=".95"/>',
  se:rc(0,0,30,20,'#006aa7')+rc(9,0,3.6,20,'#fecc00')+rc(0,8.2,30,3.6,'#fecc00'),
  gh:hbands('#ce1126','#fcd116','#006b3f')+'<polygon points="'+starPts(15,10,3.4)+'" fill="#111"/>',
  tr:rc(0,0,30,20,'#e30a17')+'<circle cx="11.2" cy="10" r="5" fill="#fff"/><circle cx="12.7" cy="10" r="4" fill="#e30a17"/><polygon points="'+starPts(17.4,10,2.6,0)+'" fill="#fff"/>'
};
const flagSvg=(cc,cls)=>!cc?'':'<svg class="flag'+(cls?' '+cls:'')+'" viewBox="0 0 30 20" aria-hidden="true" focusable="false">'+(FLAGS[cc]||rc(0,0,30,20,'#555'))+'</svg>';
const cName=cc=>cc?t('cn.'+cc):'';

/* ---------- datos de la ficha ---------- */
function profOf(id){
  if(id==='p'){const s=save.stats;return {cc:null,kg:PLAYER.kg,cm:PLAYER.cm,w:s.w,l:s.l,d:s.d,ko:s.ko}}      /* tu luchador no tiene país; su récord es el de verdad */
  const f=FIGHTERS[id],r=f.rec;
  return {cc:f.cc,kg:f.kg,cm:f.cm,w:r[0],l:r[1],d:r[2],ko:r[3]};
}
/* línea corta: bandera, país y récord */
const miniHTML=id=>{const p=profOf(id);return (p.cc?flagSvg(p.cc,'sm')+' '+esc(cName(p.cc))+' · ':'')+'<bdi>'+p.w+'-'+p.l+'-'+p.d+'</bdi>'};
const countryHTML=(id,cls)=>{const cc=profOf(id).cc;return !cc?'':flagSvg(cc,cls)+'<b>'+esc(cName(cc))+'</b>'};
/* ficha completa: bandera y país (tu luchador no tiene: queda un hueco para que las dos fichas se alineen), y debajo récord (victorias-derrotas-empates y KO), peso y altura.
   Los números van en <bdi> para que el árabe no los dé la vuelta. */
function fichaHTML(id){
  const p=profOf(id),b=s=>'<bdi>'+s+'</bdi>';
  return '<div class="fx">'+(p.cc?'<div class="fc">'+countryHTML(id)+'</div>':'<div class="fc nocc" aria-hidden="true"><b>&nbsp;</b></div>')+'<dl>'+
    '<div><dt>'+esc(t('fi.rec'))+'</dt><dd title="'+esc(t('fi.rec.d'))+'">'+b(p.w+'-'+p.l+'-'+p.d)+'<small>'+b(p.ko+' '+esc(t('tag.ko')))+'</small></dd></div>'+
    '<div><dt>'+esc(t('fi.wt'))+'</dt><dd>'+b(p.kg+' '+esc(t('u.kg')))+'</dd></div>'+
    '<div><dt>'+esc(t('fi.ht'))+'</dt><dd>'+b(p.cm+' '+esc(t('u.cm')))+'</dd></div></dl></div>';
}

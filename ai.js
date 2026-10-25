/* ai.js · inteligencia artificial de los rivales */
const COMBOS_CLOSE=[['jab'],['cross'],['jab','cross'],['jab','jab','cross'],['jab','cross','high'],['jab','cross','knee']];
const COMBOS_MID=[['low'],['high'],['low','high'],['cross','high'],['low','low','high'],['knee']];
const reachOf=a=>ATK[a].rng+(ATK[a].lunge||0);                     /* la rodilla avanza saltando: llega mucho más lejos */
function aiInput(dt){
  const a=G.op,p=G.pl,L=a.ai,dx=p.x-a.x,dist=Math.abs(dx),dir=Math.sign(dx)||1;
  const inp=Object.assign({},NOINP);
  if(p.state==='ko')return inp;
  if(p.atk&&p.aid!==L.seen&&dist<reachOf(p.atk)+30){
    L.seen=p.aid;
    if(Math.random()<L.blk){
      const knee=p.atk==='knee',dodge=Math.random()<(knee?.5:.3)&&a.dodgeCd<=0;
      /* la esquiva dura poco: contra la rodilla (que tarda en llegar) hay que esperar un poco o se acaba antes del golpe */
      L.pend={t:Math.max(knee&&dodge?.1:0,L.react*(.25+.35*Math.random())),act:dodge?'dodge':'block'};
    }
  }
  if(L.pend){
    L.pend.t-=dt;
    if(L.pend.t<=0){
      if(L.pend.act==='dodge')inp.dodge=true;else{L.mode='block';L.hold=.35}
      L.q=[];L.pend=null;
    }
  }
  if(L.q.length&&!a.atk&&a.stun<=0&&a.state!=='dodge'){
    if(L.gap>0)L.gap-=dt;else{inp[L.q.shift()]=true;L.gap=.03+Math.random()*.1}
    return inp;
  }
  const pRec=p.atk&&p.at>=ATK[p.atk].start+ATK[p.atk].act;
  if((pRec||p.stun>0)&&dist<112&&!a.atk&&L.q.length===0&&Math.random()<Math.min(1,L.aggr*dt*14)){
    const list=dist<92?COMBOS_CLOSE:COMBOS_MID;L.q=list[Math.min(list.length-1,2+Math.floor(Math.random()*3))].slice();return inp;
  }
  L.t-=dt;L.hold-=dt;
  if(L.t<=0){
    L.t=L.react*(.6+Math.random()*.8);
    const pa=p.atk&&p.at<ATK[p.atk].start+ATK[p.atk].act;
    const r=Math.random();
    if(pa&&dist<reachOf(p.atk)+40&&r<L.blk){
      if(Math.random()<.35&&a.dodgeCd<=0&&p.atk!=='knee'){inp.dodge=true;L.hold=.2}else{L.mode='block';L.hold=.3+Math.random()*.3}
    }else if(L.hold<=0){
      if(dist>100){
        /* los más agresivos entran a veces con una rodilla en salto */
        if(dist<260&&L.aggr>=.7&&Math.random()<.14){L.q=['knee'];L.hold=.25;L.mode='idle'}
        else{L.mode='approach';L.hold=.2+Math.random()*.3}
      }
      else{
        const q=Math.random();
        if(q<L.aggr){
          const list=dist<92?COMBOS_CLOSE:COMBOS_MID;
          const maxIdx=Math.min(list.length-1,Math.floor(1+L.aggr*5));
          L.q=list[Math.floor(Math.random()*(maxIdx+1))].slice();L.hold=.15;L.mode='idle';
        }else if(q<L.aggr+.2){L.mode='retreat';L.hold=.3+Math.random()*.3}
        else{L.mode='idle';L.hold=.15}
      }
    }
  }
  if(L.mode==='approach'){if(dist>88)inp.move=dir;else L.mode='idle'}
  else if(L.mode==='retreat'){inp.move=-dir}
  else if(L.mode==='block'){inp.block=true;if(L.hold<=0)L.mode='idle'}
  return inp;
}

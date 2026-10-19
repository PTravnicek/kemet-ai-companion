// Version 3.0.0-beta: paid actions and explicit movement, entirely client side.
// Manual M2/M4-M8 is primary. A limited numeric power-effect subset is documented in README.
import * as B from '../v2/core.js';
import {ZONES,ADJ,zone,other} from './map.js';
export {ZONES,ADJ,zone,other};
export const VERSION='3.0.0-beta.1';
export const {CARDS,IDS,TILES,DIVINE,CREATURES,copy,card,clamp}=B;
export const SLOTS=[
 {id:'move1',type:'move',row:1,name:'Move · top'},
 {id:'recruit',type:'recruit',row:1,name:'Recruit · top'},
 {id:'raise',type:'raise',row:2,name:'Raise pyramid · middle'},
 {id:'move2',type:'move',row:2,name:'Move · middle'},
 {id:'pray2',type:'pray',row:2,name:'Pray · middle'},
 {id:'buy-white',type:'buy',color:'white',row:3,name:'Buy white · base'},
 {id:'buy-red',type:'buy',color:'red',row:3,name:'Buy red · base'},
 {id:'buy-blue',type:'buy',color:'blue',row:3,name:'Buy blue · base'},
 {id:'pray3',type:'pray',row:3,name:'Pray · base'}
];
export const EFFECTS={
 'Charge!':{attack:1},'Stargate':{teleportDiscount:1},'God Speed':{move:1},
 'Carnage':{damage:1},'Open Gates':{open:true},'Teleport':{obeliskStart:true},
 'Blades of Neith':{strength:1},'Victory Point':{vp:1},
 'Recruiting Scribe':{freeRecruits:2},'Defense!':{defend:1},'Legion':{limit:7},
 'Shield of Neith':{protection:1},'Defensive Victory':{defenseVP:1},
 'Priest':{pray:1},'Priestess':{buyDiscount:1},'Slaves':{levelDiscount:1},
 'High Priest':{night:2},'Priest of Ra':{discount:1},'Priest of Amon':{night:5}
};
const need=(ok,text)=>{if(!ok)throw Error(text);};
const integer=(n,min,max,text='Invalid number')=>need(Number.isInteger(n)&&n>=min&&n<=max,text);
export const total=(s,w)=>Object.values(s.zones).reduce((a,z)=>a+z[w],0);
export const owned=(s,w)=>TILES.filter(t=>s.tiles[t.id]===w);
export const has=(s,w,name)=>owned(s,w).some(t=>t.name===name);
export const effect=(s,w,key)=>owned(s,w).reduce((a,t)=>a+Number(EFFECTS[t.name]?.[key]||0),0);
export const troopMax=(s,w)=>has(s,w,'Legion')?7:5;
export const actionsLeft=(s,w)=>5-s.players[w].slots.length;
export function fresh(){
 const player=()=>({prayer:7,permanent:0,battleVP:0,pyramids:{red:1,blue:1,white:1},slots:[],hand:[...IDS],used:[],di:[]});
 const s={schema:3,rev:0,mode:'rules',day:1,phase:'day',active:'human',order:['human','ai'],target:8,
  players:{human:player(),ai:player()},zones:Object.fromEntries(ZONES.map(z=>[z.id,{human:0,ai:0,creatures:{human:null,ai:null}}])),
  tiles:{},battle:null,lastMove:null,winner:null,history:['Day 1 test setup: 5 starting prayer + 2 first-Night prayer. Mirror your physical DI draws separately.']};
 for(const w of ['human','ai']){const prefix=w==='human'?'h':'a';s.zones[`${prefix}-r`][w]=5;s.zones[`${prefix}-b`][w]=5;}
 return s;
}
export function owner(s,id){const z=s.zones[id];return z.human&&!z.ai?'human':z.ai&&!z.human?'ai':null;}
export function pyramidController(s,id){const z=zone(id);if(!z.pyramid)return null;return owner(s,id)||z.home;}
export function score(s,w){let temporary=0;for(const z of ZONES){if(z.kind==='temple'&&owner(s,z.id)===w)temporary++;if(z.pyramid&&s.players[z.home].pyramids[z.pyramid]===4&&pyramidController(s,z.id)===w)temporary++;}return {permanent:s.players[w].permanent,temporary,total:s.players[w].permanent+temporary};}
export function validate(s){
 need(s&&s.schema===3,'Not a V3 save. V2 saves remain untouched.');integer(s.rev,0,1e9);integer(s.day,1,999);
 need(['rules','mirror'].includes(s.mode)&&['day','dusk','night','finished'].includes(s.phase),'Invalid mode/phase.');
 need(['human','ai'].includes(s.active)&&[8,10].includes(s.target),'Invalid turn.');
 need(Array.isArray(s.order)&&s.order.length===2&&new Set(s.order).size===2&&s.order.every(w=>['human','ai'].includes(w)),'Invalid turn order.');
 need(s.zones&&Object.keys(s.zones).length===ZONES.length,'Invalid map.');need(s.tiles&&typeof s.tiles==='object','Missing tile inventory.');
 for(const [id,w] of Object.entries(s.tiles))need(TILES.some(t=>t.id===id)&&['human','ai'].includes(w),'Invalid power ownership.');
 for(const w of ['human','ai']){const p=s.players?.[w];need(p,'Missing player');integer(p.prayer,0,11);integer(p.permanent,0,99);integer(p.battleVP,0,99);
  need(Array.isArray(p.slots)&&p.slots.length<=5&&new Set(p.slots).size===p.slots.length&&p.slots.every(id=>SLOTS.some(x=>x.id===id)),'Invalid action spaces.');
  for(const k of ['red','blue','white'])integer(p.pyramids?.[k],0,4,'Invalid pyramid.');
  const all=[...(p.hand||[]),...(p.used||[])];need(all.length===6&&new Set(all).size===6&&all.every(id=>IDS.includes(id))&&p.hand.length%2===0,'Invalid battle hand.');
  need(Array.isArray(p.di)&&p.di.length<=35&&p.di.every(id=>DIVINE.some(d=>d.id===id)),'Invalid DI hand.');
  const names=owned(s,w).map(t=>t.name);need(new Set(names).size===names.length,'Duplicate equivalent power.');
  for(const z of ZONES){integer(s.zones[z.id]?.[w],0,troopMax(s,w),'Invalid troop size.');const c=s.zones[z.id]?.creatures?.[w];need(c===null||CREATURES.includes(c),'Invalid creature.');need(!c||s.zones[z.id][w]>0,'Creature without troop.');}
  need(total(s,w)<=12,'Only twelve units per player.');
 }
 need(Array.isArray(s.history)&&s.history.length<=200&&s.history.every(x=>typeof x==='string'&&x.length<1000),'Invalid history.');
 if(s.mode==='rules'&&!s.battle)need(!Object.values(s.zones).some(z=>z.human&&z.ai),'Opposing troops need a resolved battle before Rules mode.');
 if(s.battle){const b=s.battle;need(['choose','result'].includes(b.phase),'Invalid battle phase.');need(['ai','human'].includes(b.attacker),'Invalid attacker.');for(const w of ['human','ai'])integer(b.units[w],1,troopMax(s,w));need(b.binding===null||!!s.zones[b.binding],'Invalid battle region.');for(const id of [b.aiPlay,b.aiDiscard])need(IDS.includes(id),'Invalid AI card.');need(b.aiPlay!==b.aiDiscard,'AI play/discard must differ.');if(b.phase==='choose'){for(const w of ['human','ai'])for(const id of [b[`${w}Play`],b[`${w}Discard`]])need(id===null||s.players[w].hand.includes(id),'Card is not in hand.');}else{need(b.humanPlay!==b.humanDiscard&&IDS.includes(b.humanPlay)&&IDS.includes(b.humanDiscard),'Invalid human choices.');need(JSON.stringify(b.result)===JSON.stringify(B.resolve(b,b.humanPlay,b.aiPlay)),'Invalid combat result.');}}
 return s;
}
export function coverage(s){return [...new Set(Object.keys(s.tiles).map(id=>TILES.find(t=>t.id===id).name).filter(n=>!EFFECTS[n]))];}
function ready(s,w){need(!Object.values(s.zones).some(z=>z.creatures.human||z.creatures.ai),'Creature effects are not automated in this beta; resolve them in Mirror mode.');need(s.mode==='rules','Switch to Rules mode to spend actions.');need(!s.battle,'Finish the current battle first.');need(s.phase==='day','Finish the phase before taking an action.');need(w===s.active,'It is '+(s.active==='human'?'your':'the AI’s')+' turn.');need(!coverage(s).length,'Rule not automated: '+coverage(s).join(', ')+'. Use Mirror mode for referee resolution.');}
export function slotProblem(s,w,id){const p=s.players[w],a=SLOTS.find(a=>a.id===id);if(!a)return 'Unknown action space.';if(p.slots.includes(id))return 'That action space is already occupied.';if(!actionsLeft(s,w))return 'All five standard tokens are spent.';const rows=new Set([...p.slots,id].map(id=>SLOTS.find(a=>a.id===id).row));if(3-rows.size>actionsLeft(s,w)-1)return 'Save enough tokens for at least one action in each row.';return null;}
export const legalSlots=(s,w,type,color)=>SLOTS.filter(a=>a.type===type&&(!color||a.color===color)&&!slotProblem(s,w,a.id));
function useSlot(s,w,id,type,color){const a=SLOTS.find(a=>a.id===id);need(a?.type===type&&(!color||a.color===color),'Wrong action space.');need(!slotProblem(s,w,id),slotProblem(s,w,id));s.players[w].slots.push(id);}
function pay(s,w,n){integer(n,0,99,'Invalid cost.');need(s.players[w].prayer>=n,`Need ${n} prayer; you have ${s.players[w].prayer}.`);s.players[w].prayer-=n;}
function advance(s){if(s.battle)return;if(!actionsLeft(s,'human')&&!actionsLeft(s,'ai')){s.phase='dusk';return;}const next=other(s.active);if(actionsLeft(s,next))s.active=next;}
export function pyramidCost(s,w,color,target){const cur=s.players[w].pyramids[color];integer(target,cur+1,4,'Choose a higher level, up to four.');const levels=Array.from({length:target-cur},(_,i)=>cur+i+1);return {levels,cost:Math.max(0,levels.reduce((a,n)=>a+Math.max(0,n-effect(s,w,'levelDiscount')),0)-effect(s,w,'discount'))};}
export function pyramidAccess(s,w,color){return Math.max(0,...ZONES.filter(z=>z.pyramid===color&&pyramidController(s,z.id)===w).map(z=>s.players[z.home].pyramids[color]));}
export function moveRoutes(s,{who,from,n,slot}){
 ready(s,who);need(legalSlots(s,who,'move').some(a=>a.id===slot),'No available Move space in that row.');zone(from);integer(n,1,s.zones[from][who],'Choose units from this army.');
 need(!s.zones[from].creatures[who],'Creature movement is not automated in this beta; use Mirror mode.');
 const max=1+effect(s,who,'move'),budget=s.players[who].prayer,cost=Math.max(0,2-effect(s,who,'teleportDiscount')-effect(s,who,'discount'));
 const found={},queue=[{id:from,path:[from],modes:[],steps:0,cost:0}],best=new Map();
 for(let it=0;queue.length&&it<3000;it++){
  const r=queue.shift();const key=`${r.id}:${r.steps}`;if((best.get(key)??Infinity)<r.cost)continue;
  if(r.id!==from){const old=found[r.id];if(!old||r.cost<old.cost||r.cost===old.cost&&r.steps<old.steps)found[r.id]={...r,max,n,from,who,slot,battle:!!s.zones[r.id][other(who)]};if(s.zones[r.id][other(who)])continue;}
  let options=ADJ[r.id].map(id=>({id,mode:'walk',steps:1,cost:0}));const z=zone(r.id);
  if((z.pyramid&&s.players[z.home].pyramids[z.pyramid]>0)||(z.obelisk&&has(s,who,'Teleport')))options.push(...ZONES.filter(z=>z.obelisk).map(z=>({id:z.id,mode:'teleport',steps:0,cost})));
  for(const o of options){if(r.path.includes(o.id))continue;const dest=zone(o.id),at=s.zones[o.id];if(dest.home&&dest.home!==who&&!has(s,who,'Open Gates')&&!ADJ[from].includes(o.id))continue;
   if(r.steps+o.steps>max||r.cost+o.cost>budget||at[who]+n>troopMax(s,who))continue;
   const next={id:o.id,path:[...r.path,o.id],modes:[...r.modes,o.mode],steps:r.steps+o.steps,cost:r.cost+o.cost};const key2=`${next.id}:${next.steps}`;if((best.get(key2)??Infinity)<=next.cost)continue;best.set(key2,next.cost);queue.push(next);
  }
 }
 return found;
}
export function moveProblem(s,c,to){try{const r=moveRoutes(s,c);if(r[to])return null;if(to===c.from)return 'This is the selected source, not a destination.';const d=zone(to);if(s.zones[to][c.who]+c.n>troopMax(s,c.who))return 'Joining this troop would exceed its unit limit.';if(d.home&&d.home!==c.who&&!has(s,c.who,'Open Gates')&&!ADJ[c.from].includes(to))return 'City wall: this action did not begin beside that district.';if(d.obelisk&&s.players[c.who].prayer<Math.max(0,2-effect(s,c.who,'teleportDiscount')-effect(s,c.who,'discount')))return 'Not enough prayer for teleportation, and no affordable walking route.';return `Not reachable with ${1+effect(s,c.who,'move')} ordinary movement step(s). Rivers are not ground connections.`;}catch(e){return e.message;}}
function battleMods(s,w,attacker){return {s:effect(s,w,'strength')+effect(s,w,w===attacker?'attack':'defend'),d:effect(s,w,'damage'),p:effect(s,w,'protection')};}
function startBound(s,id,attacker,rng){const b={phase:'choose',binding:id,practice:false,attacker,units:{human:s.zones[id].human,ai:s.zones[id].ai},mods:{human:battleMods(s,'human',attacker),ai:battleMods(s,'ai',attacker)},humanPlay:null,humanDiscard:null};const pick=B.chooseAI(s.players.ai.hand,b,rng);s.battle={...b,aiPlay:pick.play,aiDiscard:pick.discard};}
function applyAction(s,c,rng){const w=c.who;ready(s,w);let receipt={title:'',prayerBefore:s.players[w].prayer,cost:0,slot:c.slot};
 switch(c.type){
 case 'raise':{need(['red','blue','white'].includes(c.color),'Choose a pyramid color.');const home=ZONES.find(z=>z.home===w&&z.pyramid===c.color);need(pyramidController(s,home.id)===w,'You do not control that pyramid.');const quote=pyramidCost(s,w,c.color,c.target);pay(s,w,quote.cost);useSlot(s,w,c.slot,'raise');receipt={...receipt,cost:quote.cost,levels:quote.levels,title:`Raise ${c.color}: ${s.players[w].pyramids[c.color]} → ${c.target}`};s.players[w].pyramids[c.color]=c.target;break;}
 case 'pray':{useSlot(s,w,c.slot,'pray');const gain=2+effect(s,w,'pray');s.players[w].prayer=Math.min(11,s.players[w].prayer+gain);receipt.title=`Pray: +${s.players[w].prayer-receipt.prayerBefore} prayer`;break;}
 case 'recruit':{let count=0,battles=[];need(c.allocations&&Object.keys(c.allocations).length,'Choose city districts.');for(const [id,n]of Object.entries(c.allocations)){need(zone(id).home===w,'Recruit only in your own city.');integer(n,0,troopMax(s,w)-s.zones[id][w],'Troop limit exceeded.');count+=n;if(n&&s.zones[id][other(w)])battles.push(id);}
  need(count>0&&count<=12-total(s,w),'Not enough units in reserve.');need(battles.length<=1,'Multiple simultaneous recruitment battles need referee resolution.');const price=Math.max(0,count-effect(s,w,'freeRecruits')-effect(s,w,'discount'));pay(s,w,price);useSlot(s,w,c.slot,'recruit');for(const [id,n]of Object.entries(c.allocations))s.zones[id][w]+=n;receipt={...receipt,title:`Recruit ${count} units`,cost:price};if(battles.length)startBound(s,battles[0],w,rng);break;}
 case 'buy':{const t=TILES.find(t=>t.id===c.id);need(t,'Unknown tile');need(!s.tiles[t.id],'This tile is already owned.');need(!has(s,w,t.name),'You already own this power, including its equivalent in another color.');need(EFFECTS[t.name],'This effect is not automated. It can be recorded in Mirror mode, not bought as an automatically supported action.');need(pyramidAccess(s,w,t.color)>=t.level,`Need a ${t.color} pyramid of level ${t.level}.`);const price=Math.max(0,t.level-effect(s,w,'buyDiscount')-effect(s,w,'discount'));pay(s,w,price);useSlot(s,w,c.slot,'buy',t.color);s.tiles[t.id]=w;if(t.name==='Victory Point')s.players[w].permanent++;receipt={...receipt,title:`Buy ${t.name}`,cost:price};break;}
 case 'move':{const routes=moveRoutes(s,c),route=routes[c.to];need(route,moveProblem(s,c,c.to));pay(s,w,route.cost);useSlot(s,w,c.slot,'move');s.zones[c.from][w]-=c.n;s.zones[c.to][w]+=c.n;s.lastMove=copy(route);receipt={...receipt,title:`Move ${c.n}: ${zone(c.from).name} → ${zone(c.to).name}`,cost:route.cost,route};if(route.battle){need(!s.zones[c.to].creatures[other(w)],'Creature combat is not automated. Use referee resolution.');startBound(s,c.to,w,rng);}break;}
 case 'skip':{const a=SLOTS.find(a=>a.id===c.slot);need(a,'Select an action space.');useSlot(s,w,c.slot,a.type,a.color);receipt.title='Placed a token without taking its action';break;}
 default:throw Error('Unsupported action.');
 }
 receipt.prayerAfter=s.players[w].prayer;advance(s);return receipt;
}
export function preview(s,c){try{const draft=copy(s),receipt=applyAction(draft,c,()=>0.5);validate(draft);return {ok:true,rev:s.rev,command:copy(c),receipt};}catch(e){return {ok:false,error:e.message,rev:s.rev,command:copy(c)};}}
export function execute(s,quote,rng=Math.random){need(quote?.ok,'Choose a valid action first.');need(quote.rev===s.rev,'The board changed. Preview the action again.');const draft=copy(s),receipt=applyAction(draft,quote.command,rng);draft.rev++;draft.history.unshift(receipt.title+` · ${receipt.cost} prayer`);draft.history=draft.history.slice(0,180);validate(draft);return {state:draft,receipt};}
export function chooseCard(s,role,id){const g=copy(s);B.selectCard(g,role,id);g.rev++;return validate(g);}
export function revealBattle(s){const g=copy(s),b=g.battle;need(b?.phase==='choose','Battle already revealed.');need(b.humanPlay&&b.humanDiscard&&b.humanPlay!==b.humanDiscard,'Select your played and discarded cards.');b.result=B.resolve(b,b.humanPlay,b.aiPlay);b.phase='result';
 if(!b.practice){for(const w of ['human','ai']){const p=g.players[w],used=[b[`${w}Play`],b[`${w}Discard`]];p.hand=p.hand.filter(id=>!used.includes(id));p.used.push(...used);if(!p.hand.length){p.hand=[...IDS];p.used=[];}g.zones[b.binding][w]=b.result.survivors[w];}
  if(b.result.battleVP){g.players[b.attacker].permanent++;g.players[b.attacker].battleVP++;}if(b.result.winner!==b.attacker&&has(g,b.result.winner,'Defensive Victory'))g.players[b.result.winner].permanent++;
 }
 g.rev++;g.history.unshift('Battle revealed. AI discard remains hidden.');return validate(g);
}
export function retreatOptions(s){const b=s.battle;need(b?.phase==='result','Reveal first.');return b.binding?ADJ[b.binding].filter(id=>!s.zones[id].human&&!s.zones[id].ai):[];}
export function finishBattle(s,{loser='recall',destination=null,winnerRecall=false}={}){const g=copy(s),b=g.battle;need(b?.phase==='result','Reveal the battle first.');
 if(!b.practice){const win=b.result.winner,lose=other(win),z=g.zones[b.binding];if(z[lose]){if(loser==='recall'){g.players[lose].prayer=Math.min(11,g.players[lose].prayer+z[lose]);z[lose]=0;}else if(loser==='retreat'){need(retreatOptions(g).includes(destination),'Choose an empty adjacent retreat space.');g.zones[destination][lose]=z[lose];z[lose]=0;}else need(loser==='stay'&&b.result.survivors[win]===0,'The defeated troop cannot stay while the winner survives.');}if(winnerRecall&&z[win]){g.players[win].prayer=Math.min(11,g.players[win].prayer+z[win]);z[win]=0;}}
 g.battle=null;if(!b.practice)advance(g);g.rev++;g.history.unshift('Battle finished; retreat / recall resolved.');return validate(g);
}
export function practice(s){need(!s.battle,'Finish the current battle.');const g=copy(s),b={phase:'choose',practice:true,binding:null,attacker:'human',units:{human:3,ai:3},mods:{human:{s:0,d:0,p:0},ai:{s:0,d:0,p:0}},humanPlay:null,humanDiscard:null};const a=B.chooseAI(g.players.ai.hand,b);g.battle={...b,aiPlay:a.play,aiDiscard:a.discard};g.rev++;return validate(g);}
export function edit(s,fn,label='Setup correction'){need(!s.battle,'Finish the battle before editing.');need(s.mode==='mirror','Use Mirror / setup mode for free corrections.');const g=copy(s);fn(g);g.rev++;g.history.unshift(label+' · costs not applied');g.history=g.history.slice(0,180);return validate(g);}
export function mode(s,m){need(!s.battle,'Finish the battle before switching modes.');const g=copy(s);g.mode=m;g.rev++;if(m==='rules'){need(!Object.values(g.zones).some(z=>z.creatures.human||z.creatures.ai),'Creature effects require referee resolution.');need(!coverage(g).length,'Unimplemented active powers: '+coverage(g).join(', '));for(const w of ['human','ai']){need(new Set(g.players[w].slots.map(id=>SLOTS.find(a=>a.id===id).row)).size+actionsLeft(g,w)>=3,'Action row coverage is inconsistent.');}}
 return validate(g);
}
export function endDay(s,{sacrifice=false}={}){const g=copy(s);need(g.mode==='rules'&&g.phase==='dusk'&&!g.battle,'Finish all Day actions first.');need(!coverage(g).length,'Night effects require referee resolution.');const delta=owner(g,'delta');if(delta&&sacrifice){g.zones.delta[delta]--;g.players[delta].prayer=Math.min(11,g.players[delta].prayer+5);}for(const w of ['human','ai']){for(const id of ['south','sphinx'])if(owner(g,id)===w)g.players[w].prayer=Math.min(11,g.players[w].prayer+zone(id).income);if(ZONES.filter(z=>z.kind==='temple'&&owner(g,z.id)===w).length>=2)g.players[w].permanent++;}
 const ranked=[...g.order].sort((a,b)=>score(g,b).total-score(g,a).total||g.players[b].battleVP-g.players[a].battleVP);if(score(g,ranked[0]).total>=g.target){g.winner=ranked[0];g.phase='finished';}else g.phase='night';g.rev++;g.history.unshift('End-of-Day temple income and victory check.');return validate(g);}
export function nextDay(s,first){const g=copy(s);need(g.mode==='rules'&&g.phase==='night'&&!g.battle,'Resolve end of Day first.');need(['human','ai'].includes(first),'Choose turn order.');for(const w of ['human','ai']){g.players[w].prayer=Math.min(11,g.players[w].prayer+2+effect(g,w,'night'));g.players[w].slots=[];}g.order=[first,other(first)];g.active=first;g.phase='day';g.day++;g.rev++;g.history.unshift('Night resolved; physical DI draws acknowledged.');return validate(g);}
export function aiSuggestion(s){ready(s,'ai');const choices=[];const offer=(c,weight)=>{const q=preview(s,c);if(q.ok)choices.push({q,weight});};
 for(const a of legalSlots(s,'ai','pray'))offer({type:'pray',who:'ai',slot:a.id},s.players.ai.prayer<4?16:1);
 for(const z of ZONES)if(s.zones[z.id].ai){for(const a of legalSlots(s,'ai','move')){const c={type:'move',who:'ai',from:z.id,n:s.zones[z.id].ai,slot:a.id};try{for(const r of Object.values(moveRoutes(s,c))){const t=zone(r.id);offer({...c,to:r.id},t.kind==='temple'?20-r.cost+(r.battle?-3:2):(r.battle?6:2));}}catch{}}}
 for(const a of legalSlots(s,'ai','raise'))for(const color of ['red','blue','white'])if(s.players.ai.pyramids[color]<4)offer({type:'raise',who:'ai',slot:a.id,color,target:s.players.ai.pyramids[color]+1},5);
 for(const t of TILES)for(const a of legalSlots(s,'ai','buy',t.color))offer({type:'buy',who:'ai',slot:a.id,id:t.id},t.name==='Victory Point'?20:6);
 for(const a of legalSlots(s,'ai','recruit'))for(const z of ZONES.filter(z=>z.home==='ai')){const n=Math.min(12-total(s,'ai'),troopMax(s,'ai')-s.zones[z.id].ai,s.players.ai.prayer);if(n)offer({type:'recruit',who:'ai',slot:a.id,allocations:{[z.id]:n}},5);}
 for(const a of SLOTS)if(!slotProblem(s,'ai',a.id))offer({type:'skip',who:'ai',slot:a.id},-100);
 choices.sort((a,b)=>b.weight-a.weight);need(choices.length,'No implemented AI action available.');return choices[0].q;
}

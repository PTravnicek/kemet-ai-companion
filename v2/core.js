/* Kemet original-edition tabletop companion. Pure, independently testable state.
   Rules: owner's 2018 manual pp.2,6–8. Catalog provenance: v2/README.md.
   Tile/DI inventory is a mirror, not a complete effect/legality engine. */
export const VERSION='2.0.0';
export const CARDS=[
 {id:'c41',name:'Cavalry',s:4,d:1,p:0,art:'horse'},
 {id:'c32',name:'Assault',s:3,d:2,p:0,art:'swords'},
 {id:'c301',name:'Shield push',s:3,d:0,p:1,art:'shield'},
 {id:'c221',name:'Mixed tactics',s:2,d:2,p:1,art:'swords'},
 {id:'c202',name:'Phalanx',s:2,d:0,p:2,art:'shield'},
 {id:'c13',name:'Chariot',s:1,d:3,p:0,art:'chariot'}
];
export const IDS=CARDS.map(c=>c.id);
const tileNames={
 red:['Charge!','Charge!','Stargate','God Speed','Carnage','Offensive Strategy','Open Gates','Teleport','Royal Scarab','Blades of Neith','Divine Wound','Victory Point','Giant Scorpion','Initiative','Phoenix','Act of God'],
 blue:['Recruiting Scribe','Recruiting Scribe','Defense!','Defense!','Legion','Ancestral Elephant','Defensive Strategy','Deep Desert Snake','Shield of Neith','Defensive Victory','Prescience','Victory Point','Reinforcements','Sphinx','Divine Will','Act of God'],
 white:['Priest','Priest','Priestess','Priestess','Slaves','High Priest','Crusade','Divine Boon','Hand of God','Vision','Holy War','Victory Point','Priest of Ra','Priest of Amon','The Mummy','Act of God']
};
export const TILES=Object.entries(tileNames).flatMap(([color,names])=>names.map((name,i)=>({id:color+'-'+i,name,color,level:1+Math.floor(i/4)})));
export const DIVINE=['War Rage','Bloody Battle','Bronze Wall','War Fury','Bloodbath','Iron Wall','Prayer','Enlistment','Raining Fire','Mana Theft','Teleportation','Open Gates','Escape','Veto'].map((name,i)=>({id:'di-'+i,name}));
// An original drawn WEST-BANK layout for tabletop mirroring. Paths are not a movement graph.
export const ZONES=[
 {id:'h-r',name:'Your city · red district',x:92,y:195,kind:'city',home:'human',pyramid:'red'},
 {id:'h-b',name:'Your city · blue district',x:98,y:274,kind:'city',home:'human',pyramid:'blue'},
 {id:'h-w',name:'Your city · white district',x:178,y:238,kind:'city',home:'human',pyramid:'white'},
 {id:'a-r',name:'AI city · red district',x:199,y:773,kind:'city',home:'ai',pyramid:'red'},
 {id:'a-b',name:'AI city · blue district',x:294,y:773,kind:'city',home:'ai',pyramid:'blue'},
 {id:'a-w',name:'AI city · white district',x:385,y:773,kind:'city',home:'ai',pyramid:'white'},
 {id:'delta',name:'Delta temple',x:249,y:120,kind:'temple'},
 {id:'sphinx',name:'Riverside temple',x:328,y:414,kind:'temple'},
 {id:'south',name:'Southern temple',x:96,y:650,kind:'temple'},
 {id:'north',name:'Northern desert',x:251,y:306,kind:'desert'},
 {id:'west',name:'Western desert',x:129,y:467,kind:'desert'},
 {id:'obelisk',name:'Obelisk desert',x:263,y:610,kind:'desert'}
];
export const CREATURES=['Ancestral Elephant','Deep Desert Snake','Royal Scarab','Giant Scorpion','Phoenix','Sphinx','Mummy'];
export const copy=x=>JSON.parse(JSON.stringify(x));
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const card=id=>{const c=CARDS.find(c=>c.id===id);if(!c)throw Error('Unknown battle card');return c;};
export function fresh(){
 const player=()=>({prayer:5,vp:0,actions:5,pyramids:{red:1,blue:1,white:1},hand:[...IDS],used:[],di:[]});
 const zones=Object.fromEntries(ZONES.map(z=>[z.id,{human:0,ai:0,creatures:{human:null,ai:null}}]));
 zones['h-r'].human=5;zones['h-b'].human=5;zones['a-r'].ai=5;zones['a-b'].ai=5;
 return {version:2,day:1,players:{human:player(),ai:player()},zones,tiles:{},battle:null,history:[]};
}
const require=(ok,message)=>{if(!ok)throw Error(message);};
export const troopTotal=(s,w)=>Object.values(s.zones).reduce((n,z)=>n+z[w],0);
export const troopMax=(s,w)=>TILES.some(t=>t.name==='Legion'&&s.tiles[t.id]===w)?7:5;
export function validate(s){
 require(s&&s.version===2,'This save is not a version 2 game.');
 require(Number.isInteger(s.day)&&s.day>=1&&s.day<=999,'Invalid day.');
 require(s.zones&&s.players&&s.tiles&&Array.isArray(s.history)&&s.history.length<=200,'Invalid save.');
 for(const w of ['human','ai']){
  const p=s.players[w];require(!!p,'Missing player.');
  for(const [key,max] of [['prayer',11],['vp',99],['actions',5]])require(Number.isInteger(p[key])&&p[key]>=0&&p[key]<=max,'Invalid '+key);
  require(p.pyramids&&Object.keys(p.pyramids).length===3,'Invalid pyramids.');
  for(const k of ['red','blue','white'])require(Number.isInteger(p.pyramids[k])&&p.pyramids[k]>=0&&p.pyramids[k]<=4,'Invalid pyramid.');
  require(Array.isArray(p.hand)&&Array.isArray(p.used)&&p.hand.length%2===0,'Invalid battle hand.');
  const all=[...p.hand,...p.used];require(all.length===6&&new Set(all).size===6&&all.every(id=>IDS.includes(id)),'Invalid card inventory.');
  require(Array.isArray(p.di)&&p.di.length<=35&&p.di.every(id=>DIVINE.some(c=>c.id===id)),'Invalid DI inventory.');
  require(troopTotal(s,w)<=12,'Only 12 units per player.');
 }
 require(Object.keys(s.zones).length===ZONES.length,'Invalid board regions.');
 for(const z of ZONES){require(!!s.zones[z.id]&&!!s.zones[z.id].creatures,'Invalid region.');for(const w of ['human','ai']){
  const n=s.zones[z.id][w];require(Number.isInteger(n)&&n>=0&&n<=troopMax(s,w),'Troop limit exceeded.');
  const c=s.zones[z.id].creatures[w];require(c===null||CREATURES.includes(c),'Unknown creature.');
 }}
 require(Object.keys(s.tiles).every(id=>TILES.some(t=>t.id===id)&&['human','ai'].includes(s.tiles[id])),'Invalid power tiles.');
 require(s.history.every(x=>typeof x==='string'&&x.length<=1000),'Invalid history.');
 if(s.battle){const b=s.battle;
  require(['choose','result'].includes(b.phase)&&['human','ai'].includes(b.attacker),'Invalid battle.');require(b.binding===null||ZONES.some(z=>z.id===b.binding),'Invalid battle region.');
  for(const w of ['human','ai']){require(Number.isInteger(b.units[w])&&b.units[w]>0&&b.units[w]<=troopMax(s,w),'Invalid battle troop.');for(const k of ['s','d','p'])require(Number.isInteger(b.mods[w][k])&&b.mods[w][k]>=0&&b.mods[w][k]<=20,'Invalid modifier.');}
  require(IDS.includes(b.aiPlay)&&IDS.includes(b.aiDiscard)&&b.aiPlay!==b.aiDiscard,'Invalid AI commitment.');
  require(b.humanPlay===null||IDS.includes(b.humanPlay),'Invalid human play.');
  require(b.humanDiscard===null||IDS.includes(b.humanDiscard),'Invalid human discard.');
  if(b.phase==='choose'){require(s.players.ai.hand.includes(b.aiPlay)&&s.players.ai.hand.includes(b.aiDiscard),'AI cards unavailable.');for(const id of [b.humanPlay,b.humanDiscard])require(id===null||s.players.human.hand.includes(id),'Human card unavailable.');}
  else{require(b.humanPlay&&b.humanDiscard&&b.humanPlay!==b.humanDiscard,'Missing selected cards.');require(b.result&&typeof b.applied==='boolean','Invalid result.');require(JSON.stringify(b.result)===JSON.stringify(resolve(b,b.humanPlay,b.aiPlay)),'Battle result does not match the cards.');}
 }
 return s;
}
export function setUnits(s,id,w,n){
 require(!s.battle,'Finish the battle before changing the board.');
 const z=s.zones[id];require(z&&['human','ai'].includes(w),'Choose an army.');
 require(Number.isInteger(n)&&n>=0&&n<=troopMax(s,w),'Troop limit: '+troopMax(s,w));
 require(troopTotal(s,w)-z[w]+n<=12,'All 12 units are already on the board.');
 z[w]=n;if(n===0)z.creatures[w]=null;
}
export function moveUnits(s,from,to,w,n){
 require(from!==to,'Choose a different destination.');require(s.zones[from]&&s.zones[to],'Choose a region.');
 require(Number.isInteger(n)&&n>0&&s.zones[from][w]>=n,'Not enough units.');
 require(s.zones[to][w]+n<=troopMax(s,w),'Destination troop is full.');
 require(!s.battle,'Finish the battle first.');
 // Board-mirroring operation, not automatic Kemet movement validation.
 s.zones[from][w]-=n;s.zones[to][w]+=n;
 if(s.zones[from][w]===0){s.zones[to].creatures[w]=s.zones[to].creatures[w]||s.zones[from].creatures[w];s.zones[from].creatures[w]=null;}
}
export function resolve(b,humanID,aiID){
 const cards={human:card(humanID),ai:card(aiID)},value={},loss={},survivors={};
 for(const w of ['human','ai'])value[w]=b.units[w]+cards[w].s+b.mods[w].s;
 const tie=value.human===value.ai;
 const winner=tie?(b.attacker==='human'?'ai':'human'):(value.human>value.ai?'human':'ai');
 for(const w of ['human','ai']){const other=w==='human'?'ai':'human';loss[w]=clamp(cards[other].d+b.mods[other].d-cards[w].p-b.mods[w].p,0,b.units[w]);survivors[w]=b.units[w]-loss[w];}
 return {winner,tie,value,loss,survivors,battleVP:winner===b.attacker&&survivors[winner]>0};
}
export function chooseAI(hand,b,rng=Math.random){
 // No human private cards/selections are accepted here. Evaluate all six possible opponent plays.
 const ranks=hand.map(id=>{let score=0;for(const h of IDS){const r=resolve(b,h,id);score+=(r.winner==='ai'?7:0)+(r.battleVP&&b.attacker==='ai'?4:0)+r.survivors.ai*.7+r.loss.human*.45;}return {id,score:score/6-card(id).s*.06+rng()*.08};}).sort((a,b)=>b.score-a.score);
 const play=ranks[0].id;const discard=ranks.filter(x=>x.id!==play).at(-1).id;return {play,discard};
}
export function startBattle(s,context,rng){
 require(!s.battle,'A battle is already active.');
 const b={...copy(context),phase:'choose',humanPlay:null,humanDiscard:null,applied:false};
 for(const w of ['human','ai']){require(b.units[w]>=1&&b.units[w]<=troopMax(s,w),'Choose the armies in battle.');require(s.players[w].hand.length>=2,'Card inventory needs recovery.');}
 const ai=chooseAI(s.players.ai.hand,b,rng);b.aiPlay=ai.play;b.aiDiscard=ai.discard;s.battle=b;
}
export function selectCard(s,role,id){const b=s.battle;require(b&&b.phase==='choose','No open card selection.');require(['humanPlay','humanDiscard'].includes(role)&&s.players.human.hand.includes(id),'Card not available.');const other=role==='humanPlay'?'humanDiscard':'humanPlay';require(b[other]!==id,'Play and discard must be different cards.');b[role]=id;}
export function reveal(s){
 const b=s.battle;require(b&&b.phase==='choose','Battle already revealed.');
 require(b.humanPlay&&b.humanDiscard&&b.humanPlay!==b.humanDiscard,'Select your play and discard.');
 b.result=resolve(b,b.humanPlay,b.aiPlay);b.phase='result';
 for(const w of ['human','ai']){const used=w==='human'?[b.humanPlay,b.humanDiscard]:[b.aiPlay,b.aiDiscard];const p=s.players[w];p.hand=p.hand.filter(id=>!used.includes(id));p.used.push(...used);if(!p.hand.length){p.hand=[...IDS];p.used=[];}}
}
export function finishBattle(s){require(s.battle&&s.battle.phase==='result','Reveal first.');s.battle=null;}
export function assignTile(s,id,who){
 require(!s.battle,'Finish the battle before changing powers.');const t=TILES.find(t=>t.id===id);require(t,'Unknown tile.');
 if(who==='supply'){if(t.name==='Legion'&&s.tiles[id])require(!Object.values(s.zones).some(z=>z[s.tiles[id]]>5),'Reduce troops to five before removing Legion.');delete s.tiles[id];return;}
 require(['human','ai'].includes(who),'Choose a player.');
 require(!TILES.some(x=>x.name===t.name&&x.id!==id&&s.tiles[x.id]===who),'That player already owns this power.');s.tiles[id]=who;
}

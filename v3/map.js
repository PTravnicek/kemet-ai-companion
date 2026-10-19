// West-bank topology: owner's board scan; independently cross-checked against
// dd00f/Kemet old-code/data/TwoPlayerGame.java (topology facts, no code copied).
// The island has no ground/harbor edge. All east-bank harbor endpoints are out of play.
export const ZONES=[
 {id:'h-r',name:'Your red district',kind:'city',home:'human',pyramid:'red',x:78,y:203},
 {id:'h-b',name:'Your blue district',kind:'city',home:'human',pyramid:'blue',x:84,y:272},
 {id:'h-w',name:'Your white district',kind:'city',home:'human',pyramid:'white',x:165,y:246},
 {id:'a-r',name:'AI red district',kind:'city',home:'ai',pyramid:'red',x:218,y:765},
 {id:'a-b',name:'AI blue district',kind:'city',home:'ai',pyramid:'blue',x:300,y:765},
 {id:'a-w',name:'AI white district',kind:'city',home:'ai',pyramid:'white',x:383,y:765},
 {id:'delta',name:'Delta temple',kind:'temple',obelisk:true,income:5,x:232,y:115},
 {id:'sphinx',name:'Riverside temple',kind:'temple',obelisk:true,income:3,x:317,y:405},
 {id:'south',name:'Southern temple',kind:'temple',obelisk:true,income:2,x:68,y:585},
 {id:'north',name:'Your city approach',kind:'desert',x:155,y:392},
 {id:'west',name:'AI city approach',kind:'desert',x:219,y:680},
 {id:'obelisk',name:'Obelisk desert',kind:'desert',obelisk:true,x:259,y:568},
 {id:'river',name:'River approach',kind:'desert',x:377,y:566}
];
const pairs=[['obelisk','south'],['obelisk','river'],['river','sphinx']];
for(const [prefix,front] of [['h','north'],['a','west']]){
 const ids=['r','b','w'].map(c=>`${prefix}-${c}`);
 for(let i=0;i<ids.length;i++){pairs.push([ids[i],front]);for(let j=i+1;j<ids.length;j++)pairs.push([ids[i],ids[j]]);}
 for(const id of ['south','obelisk','river'])pairs.push([front,id]);
}
export const EDGES=pairs;
export const ADJ=Object.fromEntries(ZONES.map(z=>[z.id,pairs.flatMap(([a,b])=>a===z.id?[b]:b===z.id?[a]:[])]));
export const zone=id=>{const z=ZONES.find(x=>x.id===id);if(!z)throw Error('Region outside the two-player map.');return z;};
export const other=w=>w==='human'?'ai':'human';

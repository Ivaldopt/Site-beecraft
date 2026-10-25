export const sectionNames={notes:'Anotações',personal:'Dados pessoais',dates:'Agenda com datas',passwords:'Senhas / palavras-passe'};
export function calendarPages(year,layout){if(layout==='weekly')return 106;const y=Number(year)||2027;const days=(Date.UTC(y+1,0,1)-Date.UTC(y,0,1))/86400000;return Math.ceil(days/2)*2}
export function buildDeck({baseSheets,paperType='ruled',personal=false,passwords=false,dated=false,year=2027,layout='daily',customLeaves=[]}){
 const total=Math.max(2,Math.floor(baseSheets)*2),deck=[];let serial=0;
 const push=(section,count)=>{for(let index=0;index<count;index++)deck.push({id:'base-'+serial++,section,index,paperType})};
 const personalCount=personal?2:0,passwordCount=passwords?4:0;
 push('personal',Math.min(personalCount,total));
 const remaining=Math.max(0,total-deck.length-passwordCount-2);
 if(dated){const start=deck.length;push('dates',Math.min(calendarPages(year,layout),Math.floor(remaining/2)*2));if(layout==='daily'){const days=(Date.UTC(Number(year)+1,0,1)-Date.UTC(Number(year),0,1))/86400000;if(deck.length-start>days){deck[start+days]={...deck[start+days],section:'notes',index:0};}}}
 push('passwords',Math.min(passwordCount,total-deck.length));
 push('notes',Math.max(0,total-deck.length));
 for(const leaf of customLeaves){const at=deck.findIndex(p=>p.id===leaf.afterId),insert=at<0?deck.length:at+1;const pages=[0,1].map(i=>({...leaf.page,id:leaf.id+'-'+i,index:leaf.index+i,leafId:leaf.id}));deck.splice(insert,0,...pages)}
 return deck;
}

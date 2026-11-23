import {errors,preview} from './review.mjs';
const $=id=>document.getElementById(id);
function node(tag,text){const item=document.createElement(tag);item.textContent=text;return item}
const training={
  name:'Champion training exercise',
  article:{P1:'If a recording is missing from the timeline, check the selected camera and time range.',P2:'If the gap remains, record the affected interval and send the issue through the team’s designated escalation path.'},
  sources:{N1:'If a recording is missing from the timeline, check the selected camera and time range.',N2:'If the gap remains, record the affected interval and send the issue through the team’s designated escalation path.'}
};
training.suggestion={target:'P2',wording:training.article.P2+' Missing recordings will automatically return.',citations:[{id:'N1',quote:training.sources.N1},{id:'N2',quote:training.sources.N2}],question:null};

async function start(){
  const response=await fetch(new URL('./runs.json',import.meta.url));
  if(!response.ok)throw Error('Recorded cases unavailable.');
  const cases=[training,...await response.json()];
  const states=cases.map(c=>({status:c.suggestion.question?'Flagged':'Pending',question:c.suggestion.question,history:c.suggestion.question?['Held for clarification before review.']:[],edited:false}));
  cases.forEach((c,i)=>$('cases').add(new Option(c.name,i)));
  let selected=0,mode='';
  const current=()=>cases[selected],state=()=>states[selected];
  function render(){
    const c=current(),s=c.suggestion,d=state(),issues=errors(c,s);
    $('origin').textContent=selected?'Recorded AI run · '+c.model:'Training exercise · Deliberately planted suggestion';
    $('target').textContent=s.target;$('current').textContent=c.article[s.target]??'Unknown paragraph';
    $('version').textContent=d.edited?'Reviewer-edited':selected?'Model suggestion':'Practice suggestion';
    $('proposed').textContent=d.text??s.wording;
    $('quotes').replaceChildren();
    for(const e of s.citations??[])$('quotes').append(node('small',e.id),node('p',e.quote));
    $('original').replaceChildren();
    for(const [id,value] of Object.entries({...c.article,...c.sources}))$('original').append(node('dt',id),node('dd',value));
    $('warning').textContent=issues.join(' ')||s.question||'';
    $('accept').disabled=!!(issues.length||s.question||d.status==='Accepted');
    $('edit').disabled=!!(issues.length||s.question);
    $('flag').disabled=false;$('reject').disabled=false;
    $('change').hidden=true;mode='';
    $('draft').textContent=preview(c,d);
    $('question').textContent=d.question?'Unresolved question · '+d.question:'';
    $('log').replaceChildren(...(d.history.length?d.history:['Awaiting your decision.']).map(line=>node('li',line)));
    $('feedback').textContent=d.history.length?d.status+(selected===0?' · The notes support checking the camera and time range, recording the interval and escalating a persistent gap. Neither note promises recovery. Keep those steps and remove the recovery promise.':''):'';
    $('copied').textContent='';
  }
  function decide(status,text,edited=false,question=null){
    if(status==='Accepted' && (errors(current(),current().suggestion).length||current().suggestion.question||!text.trim()))return;
    const d=state();Object.assign(d,{status,text,edited,question});
    const entry=current().suggestion.target+' · '+status+(edited?' · reviewer-edited':'')+(status==='Accepted'?' · '+text:'')+(question?' · '+question:'');
    d.history.push(entry);render();
  }
  $('cases').onchange=()=>{selected=Number($('cases').value);render()};
  $('accept').onclick=()=>decide('Accepted',state().text??current().suggestion.wording,state().edited);
  $('reject').onclick=()=>decide('Rejected',undefined,false,current().suggestion.question);
  function openForm(action){
    for(const id of ['accept','edit','reject','flag'])$(id).disabled=true;
    mode=action;$('change').hidden=false;const edit=mode==='edit';
    $('prompt').textContent=edit?'Reviewer-edited wording':'What needs clarification?';
    $('entry').value=edit?(state().text??current().suggestion.wording):(state().question??'');
    $('confirm').textContent=edit?'Confirm and accept edit':'Save clarification question';
    $('entry').focus();
  }
  $('edit').onclick=()=>openForm('edit');$('flag').onclick=()=>openForm('flag');
  $('cancel').onclick=render;
  $('change').onsubmit=e=>{e.preventDefault();const value=$('entry').value.trim();if(!value)return;
    if(mode==='edit')decide('Accepted',value,true);else if(mode==='flag')decide('Flagged',undefined,false,value)};
  $('copy').onclick=async()=>{
    const content=['Missing footage on the timeline',$('draft').textContent,$('question').textContent,'Decision log',...Array.from($('log').children,e=>e.textContent)].filter(Boolean).join('\n\n');
    try{await navigator.clipboard.writeText(content);$('copied').textContent='Copied.'}catch{$('copied').textContent='Select the draft and log above to copy them.'}
  };
  render();
}
start().catch(()=>{$('warning').textContent='Could not load the editor. Reload the page to try again.'});

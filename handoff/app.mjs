import {keys,known,lines,problems,approvedText} from './rules.mjs';
const $=id=>document.getElementById(id);
const el=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e};
const names={installer:'Installer note',checklist:'Commissioning checklist',update:'Project update'};
let current,owners={},approved='',revision=0;
function resetApproval(){
  approved=''; $('output').hidden=true;$('output').textContent='';$('copy').disabled=true;
}
function gate(){
  resetApproval();
  const errors=problems(current.report,current.sources,owners);
  if(!$('reviewed').checked)errors.push('Confirm you checked the evidence.');
  $('approve').disabled=!!errors.length;$('gate').textContent=errors.join(' ')||'Ready to approve for Support.';
}
function render(run,local=false){
  revision++;current=run;owners={};$('reviewed').checked=false;
  $('mode').textContent=local?'Local model run':'Recorded AI run';
  $('message').textContent=run.name+' · '+run.model;
  $('findings').replaceChildren();$('original').replaceChildren();$('sources').open=false;
  const src=lines(run.sources);
  for(const k of keys){
    $('original').append(el('h3',names[k]));
    for(const [id,line] of Object.entries(src).filter(([id])=>id.startsWith(k+'-'))){
      const p=el('p','');p.append(el('small',id),document.createTextNode(line||'(blank)'));p.id='source-'+id;p.tabIndex=-1;$('original').append(p);
    }
  }
  const items=Array.isArray(run.report?.findings)?run.report.findings:[];
  items.forEach((f,i)=>{
    if(!f)return;
    const row=el('article','');row.className='finding';
    const body=el('div',''), evidence=el('div','');row.append(body,evidence);
    body.append(el('small',f.status),el('h3',f.summary));
    if(['Open','Unknown'].includes(f.status)){
      body.append(el('p','Next action: '+(f.action||'Unknown')));
      if(known(f.owner))body.append(el('p','Owner: '+f.owner));
      else{
        const label=el('label','Follow-up owner'),input=el('input','');input.className='owner';input.placeholder='Enter a fictional owner';label.append(input);
        const marker=el('small','Missing owner');body.append(label,marker);
        input.oninput=()=>{owners[i]=input.value.trim();marker.textContent=owners[i]?'Reviewer-entered':'Missing owner';$('reviewed').checked=false;gate()};
      }
    }
    for(const c of Array.isArray(f.cites)?f.cites:[]){
      if(!c)continue;
      const q=el('blockquote',''),link=el('a',c.id);link.href='#source-'+c.id;
      link.onclick=()=>{$('sources').open=true};q.append(link,el('p',c.quote));evidence.append(q);
    }
    $('findings').append(row);
  });
  gate();
}
$('reviewed').onchange=gate;
$('approve').onclick=()=>{
  if(!$('reviewed').checked)return;
  approved=approvedText(current.report,current.sources,owners);$('output').textContent=approved;$('output').hidden=false;$('copy').disabled=false;$('approve').disabled=true;$('gate').textContent='Approved for handoff.';
};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(approved);$('gate').textContent='Copied approved handoff.'}catch{$('gate').textContent='Select and copy the approved text below.'}};
try{
  const runs=await (await fetch('./runs.json')).json();
  runs.forEach((r,i)=>$('cases').add(new Option(r.name,String(i))));
  $('cases').onchange=()=>render(runs[Number($('cases').value)]);
  render(runs[0]);
  if(location.origin==='http://127.0.0.1:8787'){
    $('custom').hidden=false;$('portfolio').href='https://sculptron.github.io/selected-work-AI-Enablement/';
    $('form').onsubmit=async e=>{
      e.preventDefault();const version=++revision;const sources=Object.fromEntries(keys.map(k=>[k,$(k).value]));
      $('message').textContent='Extracting from the submitted notes…';$('form').querySelector('button').disabled=true;
      try{const res=await fetch('/extract',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(sources)});
        if(!res.ok)throw Error(await res.text());const data=await res.json();
        if(version===revision){$('cases').selectedIndex=-1;render({name:'Pasted sources',sources,...data},true);$('custom').open=false}
      }catch(err){if(version===revision)$('message').textContent='Extraction failed. Previous review retained. '+err.message}
      finally{$('form').querySelector('button').disabled=false}
    };
  }
}catch{$('message').textContent='Could not load the handoff. Reload to try again.'}

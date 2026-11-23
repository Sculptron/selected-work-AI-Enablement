// Node 20+. Only the two checked-in fictional fixtures are sent to Anthropic.
import {readFile,writeFile} from 'node:fs/promises';
import {errors} from './review.mjs';
const file = name => new URL(name,import.meta.url);
if(!process.env.ANTHROPIC_API_KEY) throw Error('Set ANTHROPIC_API_KEY in the local environment.');
const system = 'You edit one paragraph of an internal Support article using two equally approved notes. Suggest one targeted replacement for P2. Preserve every supported prerequisite and conditional step. When notes conflict, do not pick a winner: propose holding the current text, cite BOTH instructions and ask the owner a specific clarification question. Return one JSON object {target,wording,citations:[{id,quote}],question}. For every citation, id must be the bare key N1 or N2 and quote must copy the corresponding source value character for character, including punctuation. question is null for compatible notes and a nonempty string for disagreement. Do not wrap JSON in markdown.';
const fixtures=JSON.parse(await readFile(file('fixtures.json'),'utf8'));
const runs=[];
for(const fixture of fixtures){
  const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:process.env.EDITOR_MODEL||'claude-sonnet-4-6',max_tokens:1000,system,messages:[{role:'user',content:JSON.stringify(fixture)}]}),signal:AbortSignal.timeout(90000)});
  if(!res.ok)throw Error('Model request failed: HTTP '+res.status);
  const data=await res.json();const suggestion=JSON.parse(data.content.filter(x=>x.type==='text').map(x=>x.text).join('').trim().replace(/^\x60\x60\x60(?:json)?\s*|\s*\x60\x60\x60$/g,''));
  const issues=errors(fixture,suggestion);if(issues.length)throw Error(issues.join(' '));
  runs.push({...fixture,suggestion,model:data.model,runId:data.id});
}
await writeFile(file('runs.json'),JSON.stringify(runs,null,2)+'\n');

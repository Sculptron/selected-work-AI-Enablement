import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {forReview,problems,approvedText} from './rules.mjs';
const runs=JSON.parse(await readFile(new URL('runs.json',import.meta.url)));
const [conflict,clean,missing]=runs.map(forReview);
const status=(run,s)=>run.report.findings.filter(f=>f.status===s);
assert.match(status(conflict,'Verified')[0].summary,/23/);
assert.equal(status(conflict,'Disagreement').length,1);
const open=status(conflict,'Open');
assert.equal(open.length,1);assert.match(open[0].summary,/C-24/);assert.equal(open[0].owner,null);
const owners={[conflict.report.findings.indexOf(open[0])]:'Rowan Vale'};
assert.throws(()=>approvedText(conflict.report,conflict.sources,{}),/owner/);
assert.match(approvedText(conflict.report,conflict.sources,owners),/C-24[^\n]*\nStatus — Open/);
assert.match(approvedText(conflict.report,conflict.sources,owners),/Rowan Vale \(reviewer-entered\)/);
assert.equal(clean.report.findings.every(f=>f.status==='Verified'),true);
assert.deepEqual(problems(clean.report,clean.sources),[]);
assert.match(approvedText(missing.report,missing.sources,{}),/recording[^\n]*\nStatus — Unknown/i);
for(const [change,error] of [
  [f=>f.cites[0].id='checklist-999',/evidence/],
  [f=>f.cites[0].quote='Fabricated quotation.',/evidence/],
  [f=>f.action='',/next action/]
]){
  const report=structuredClone(conflict.report);change(report.findings.find(f=>f.status==='Open'));
  assert.throws(()=>approvedText(report,conflict.sources,owners),error);
}
console.log('Passed recorded cases, owner provenance, preserved status, invalid line, altered quotation, missing action.');

const orphan=structuredClone(conflict.report);
orphan.findings=orphan.findings.filter(f=>f.status!=='Open');
assert.ok(problems(orphan,conflict.sources).length);
assert.throws(()=>approvedText(orphan,conflict.sources,{}),/owner/);
const unrelated={...open[0],id:'another-task',owner:'Other reviewer',action:'Check another item.'};
orphan.findings.push(unrelated);
assert.throws(()=>approvedText(orphan,conflict.sources,{}),/owner/);
assert.deepEqual(problems(conflict.report,conflict.sources,owners),[]);
const copied=approvedText(conflict.report,conflict.sources,owners);
assert.ok(copied.includes('Status — Open\nNext action — Run and document the C-24 recording check.\nCurrent owner — Rowan Vale (reviewer-entered)'));
assert.doesNotMatch(copied,/owner is unassigned/);
const disagreement=orphan.findings.find(f=>f.status==='Disagreement');
Object.assign(disagreement,{owner:'Direct owner',action:'Check the disputed result.'});
assert.ok(approvedText(orphan,conflict.sources,{}).includes('Current owner — Direct owner'));
console.log('Passed orphaned disagreement, unrelated task, direct and linked follow-ups, and consistent export.');

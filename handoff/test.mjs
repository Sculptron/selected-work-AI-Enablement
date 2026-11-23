import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {problems,approvedText} from './rules.mjs';
const runs=JSON.parse(await readFile(new URL('runs.json',import.meta.url)));
const [conflict,clean,missing]=runs;
const status=(run,s)=>run.report.findings.filter(f=>f.status===s);
assert.match(status(conflict,'Verified')[0].summary,/23/);
assert.equal(status(conflict,'Disagreement').length,1);
const open=status(conflict,'Open');
assert.equal(open.length,1);assert.match(open[0].summary,/C-24/);assert.equal(open[0].owner,null);
const owners={[conflict.report.findings.indexOf(open[0])]:'Rowan Vale'};
assert.throws(()=>approvedText(conflict.report,conflict.sources,{}),/owner/);
assert.match(approvedText(conflict.report,conflict.sources,owners),/Open — [^\n]*C-24/);
assert.match(approvedText(conflict.report,conflict.sources,owners),/Rowan Vale \(reviewer-entered\)/);
assert.equal(clean.report.findings.every(f=>f.status==='Verified'),true);
assert.deepEqual(problems(clean.report,clean.sources),[]);
assert.match(approvedText(missing.report,missing.sources,{}),/Unknown — [^\n]*recording/i);
for(const [change,error] of [
  [f=>f.cites[0].id='checklist-999',/evidence/],
  [f=>f.cites[0].quote='Fabricated quotation.',/evidence/],
  [f=>f.action='',/next action/]
]){
  const report=structuredClone(conflict.report);change(report.findings.find(f=>f.status==='Open'));
  assert.throws(()=>approvedText(report,conflict.sources,owners),error);
}
console.log('Passed recorded cases, owner provenance, preserved status, invalid line, altered quotation, missing action.');

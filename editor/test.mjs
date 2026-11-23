import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {errors,preview} from './review.mjs';
const [plain,conflict]=JSON.parse(await readFile(new URL('runs.json',import.meta.url)));
for(const c of [plain,conflict])assert.deepEqual(errors(c,c.suggestion),[]);
const accept=c=>({status:'Accepted',text:c.suggestion.wording});
assert.match(preview(plain,accept(plain)),/camera and time range.*if the gap persists.*affected interval.*designated escalation path/is);
assert.equal(new Set(conflict.suggestion.citations.map(c=>c.id)).size,2);
assert.match(conflict.suggestion.question,/escalate.*check/is);
assert.equal(preview(conflict,accept(conflict)),Object.values(conflict.article).join('\n\n'));
for(const mutate of [s=>s.target='P9',s=>s.citations[0].id='N9',s=>s.citations[0].quote='Invented evidence.']){
 const c=structuredClone(plain);mutate(c.suggestion);assert.ok(errors(c,c.suggestion).length);assert.equal(preview(c,accept(c)),Object.values(c.article).join('\n\n'));
}
console.log('Recorded edits and citation/target checks passed.');

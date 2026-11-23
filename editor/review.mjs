import {known} from '../handoff/rules.mjs';
export function errors(c,s){
  const issues=[];
  if(!s || !Object.hasOwn(c.article,s.target))issues.push('Unknown article paragraph.');
  if(!known(s?.wording))issues.push('Missing proposed wording.');
  if(!Array.isArray(s?.citations)||!s.citations.length||s.citations.some(e=>!e||!Object.hasOwn(c.sources,e.id)||!known(e.quote)||!c.sources[e.id].includes(e.quote)))issues.push('Invalid source citation.');
  return issues;
}
export function preview(c,decision){
  const article={...c.article};
  if(decision.status==='Accepted' && !errors(c,c.suggestion).length && !c.suggestion.question && known(decision.text))article[c.suggestion.target]=decision.text;
  return Object.values(article).join('\n\n');
}

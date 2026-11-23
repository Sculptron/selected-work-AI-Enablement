export const keys = ['installer','checklist','update'];
export function lines(sources) {
  return Object.fromEntries(keys.flatMap(key => sources[key].split(/\r?\n/).map((line,i) => [key+'-'+(i+1),line])));
}
export const known = value => typeof value === 'string' && !!value.trim() && !/^(unknown|unassigned|none|null|tbd|n\/a|not assigned)$/i.test(value.trim());
export function problems(report,sources,owners = {}) {
  const errors = [];
  const source = lines(sources);
  if (!Array.isArray(report?.findings) || !report.findings.length) return ['No findings to review.'];
  report.findings.forEach((f,i) => {
    const issue = message => errors.push('Finding '+(i+1)+': '+message);
    if (!f || !['Verified','Open','Unknown','Disagreement'].includes(f.status) || !known(f.summary)) return issue('missing finding or status.');
    if (!Array.isArray(f.cites) || !f.cites.length || f.cites.some(c => !c || !Object.hasOwn(source,c.id) || !known(c.quote) || !source[c.id].includes(c.quote))) issue('invalid or missing source evidence.');
    if (f.status==='Disagreement' && new Set((Array.isArray(f.cites)?f.cites:[]).map(c=>c?.id?.split('-')[0])).size<2) issue('cite both sources.');
    if (['Open','Unknown'].includes(f.status)) {
      if (!known(owners[i] ?? f.owner)) issue('assign a follow-up owner.');
      if (!known(f.action)) issue('next action required.');
    }
  });
  return errors;
}
export function approvedText(report,sources,owners) {
  const errors=problems(report,sources,owners);
  if(errors.length) throw Error(errors.join(' '));
  return ['Approved for Support handoff',...report.findings.map((f,i)=>[
    f.status+' — '+f.summary,
    ...(['Open','Unknown'].includes(f.status)?['Next action from source review: '+f.action,'Current owner: '+(owners[i] ?? f.owner)+(Object.hasOwn(owners,i)?' (reviewer-entered)':'')]:[]),
    ...f.cites.map(c=>c.id+': '+c.quote)
  ].join('\n'))].join('\n\n');
}

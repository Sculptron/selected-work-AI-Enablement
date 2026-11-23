export const keys = ['installer','checklist','update'];
export function lines(sources) {
  return Object.fromEntries(keys.flatMap(key => sources[key].split(/\r?\n/).map((line,i) => [key+'-'+(i+1),line])));
}
export const known = value => typeof value === 'string' && !!value.trim() && !/^(unknown|unassigned|none|null|tbd|n\/a|not assigned)$/i.test(value.trim());
// Reviewed annotations for this immutable recording, kept outside the model output.
export function forReview(run) {
  if (run.runId !== 'msg_011ChKQcWGRSSYwKSCbuAoT5') return run;
  const report = structuredClone(run.report);
  for (const f of report.findings) {
    if (f.status === 'Disagreement' && f.summary.includes('C-24')) f.followUpId = 'C-24-recording';
    if (f.status === 'Open' && f.summary.includes('C-24 recording check')) {
      f.id = 'C-24-recording';
      if (f.action === 'Run and document the C-24 recording check; the follow-up owner is unassigned per installer-2.')
        f.action = 'Run and document the C-24 recording check.';
    }
  }
  return {...run,report};
}

export function linkedFollowUp(report,f) {
  if (f.status !== 'Disagreement' || !known(f.followUpId)) return null;
  const matches = report.findings.filter(item => item?.id === f.followUpId);
  const target = matches[0];
  if (matches.length !== 1 || !['Open','Unknown'].includes(target.status)) return null;
  // Require a common source line as well as an explicit, unambiguous reference.
  if (!Array.isArray(target.cites) || !Array.isArray(f.cites) ||
      !target.cites.some(a => a?.id && f.cites.some(b => b?.id === a.id))) return null;
  return target;
}
export function problems(report,sources,owners = {}) {
  const errors = [];
  const source = lines(sources);
  if (!Array.isArray(report?.findings) || !report.findings.length) return ['No findings to review.'];
  report.findings.forEach((f,i) => {
    const issue = message => errors.push('Finding '+(i+1)+': '+message);
    if (!f || !['Verified','Open','Unknown','Disagreement'].includes(f.status) || !known(f.summary)) return issue('missing finding or status.');
    if (!Array.isArray(f.cites) || !f.cites.length || f.cites.some(c => !c || !Object.hasOwn(source,c.id) || !known(c.quote) || !source[c.id].includes(c.quote))) issue('invalid or missing source evidence.');
    if (f.status==='Disagreement' && new Set((Array.isArray(f.cites)?f.cites:[]).map(c=>c?.id?.split('-')[0])).size<2) issue('cite both sources.');
    if (f.status !== 'Verified' && !linkedFollowUp(report,f)) {
      if (!known(owners[i] ?? f.owner)) issue('assign a follow-up owner.');
      if (!known(f.action)) issue('next action required.');
    }
  });
  return errors;
}
export function approvedText(report,sources,owners) {
  const errors=problems(report,sources,owners);
  if(errors.length) throw Error(errors.join(' '));
  const sections = report.findings.map((f,i) => {
    const fields = [f.summary, 'Status — '+f.status];
    if (linkedFollowUp(report,f)) {
      fields.push('Follow-up — '+f.followUpId);
    } else if (f.status !== 'Verified') {
      const owner = owners[i] ?? f.owner;
      const provenance = Object.hasOwn(owners,i) ? ' (reviewer-entered)' : '';
      fields.push('Next action — '+f.action, 'Current owner — '+owner+provenance);
    }
    return [...fields,...f.cites.map(c=>c.id+': '+c.quote)].join('\n');
  });
  return ['Approved for Support handoff',...sections].join('\n\n');
}

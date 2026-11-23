// Run against the local static site, or pass its public project URL.
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8000/';

async function check(browser, width) {
  const context = await browser.newContext({
    viewport: {width, height: 850},
    permissions: ['clipboard-read', 'clipboard-write']
  });
  const page = await context.newPage();
  const field = id => page.locator('#' + id);
  const click = id => field(id).click();
  async function clipboard() {
    await click('copy');
    await page.getByText('Copied.', {exact: true}).waitFor();
    return page.evaluate(() => navigator.clipboard.readText());
  }
  for (const entry of ['index.html', 'ai-champion-network.html']) {
    await page.goto(new URL(entry, base).href);
    await page.getByRole('link', {name:'Try the troubleshooting article editor →'}).click();
    await page.getByText('Practice suggestion', {exact:true}).waitFor();
  }
  const original = await field('draft').innerText();
  const planted = /Missing recordings will automatically return/i;
  const sourceText = await field('current').innerText();
  async function needsCorrection() {
    assert.match(await field('feedback').innerText(), /Needs correction.*Neither note promises recovery/);
    assert.equal(await field('draft').innerText(), original);
    assert.match(await field('log').innerText(), /Needs correction/);
    assert.doesNotMatch(await clipboard(), planted);
  }
  await click('accept');
  await needsCorrection();
  await click('edit');
  await field('entry').fill('Review the interval. ' + await field('proposed').innerText());
  await click('confirm');
  await needsCorrection();
  await click('reject');
  assert.match(await field('feedback').innerText(), /^Rejected/);
  await click('edit');
  const corrected = sourceText.replace('record the affected interval', 'document the affected interval');
  await field('entry').fill(corrected);
  await click('confirm');
  assert.ok((await field('draft').innerText()).includes(corrected));
  assert.doesNotMatch(await clipboard(), planted);
  await page.getByRole('button', {name:'Try a recorded AI suggestion'}).click();
  assert.equal(await field('cases').locator('option:checked').innerText(), 'Straightforward update');
  assert.equal(await page.evaluate(()=>document.activeElement.id), 'suggestion');
  assert.match(await field('origin').innerText(), /recorded ai run/i);
  await click('accept');
  assert.ok((await field('draft').innerText()).includes(await field('proposed').innerText()));

  await field('cases').selectOption({label:'Conflicting instructions'});
  const disputed = await field('draft').innerText();
  const modelQuestion = await field('question').innerText();
  await click('reject');
  assert.equal(await field('question').innerText(), modelQuestion);
  const custom = 'Which escalation sequence should technicians use?';
  await click('flag');
  await field('entry').fill(custom);
  await click('confirm');
  await click('reject');
  assert.equal(await field('question').innerText(), 'Unresolved question · ' + custom);
  assert.equal(await field('draft').innerText(), disputed);
  assert.ok((await clipboard()).includes('Unresolved question · ' + custom));
  await context.close();
  console.log('Passed reviewer flows at',width,base);
}
(async()=>{
  const browser = await chromium.launch({channel:'chrome'});
  try {for(const width of [1280,390]) await check(browser,width);}
  finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

// Static guards on the reveal player. The June 2026 audit found the player
// silently dropping authored copy (rendering only lines[0..1] of multi-line
// bodies) and shipping "IMAGE TO COME" placeholders to respondents. These
// checks pin the renderer behaviours that fixed that. They are string-level by
// design: cheap, browser-free and loud when someone restructures buildCard.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const playerHtml = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'reveal', 'index.html'),
  'utf8'
);

test('prose cards render their full authored body via appendProse', () => {
  assert.match(playerHtml, /function appendProse/, 'appendProse helper must exist');
  assert.match(playerHtml, /clean\.forEach/, 'appendProse must loop every line, not slice the first two');
  const costBranch = playerHtml.match(/card\.type === 'cost'[\s\S]*?card\.type === 'widening'/)?.[0] || '';
  const wideningBranch = playerHtml.match(/card\.type === 'widening'[\s\S]*?card\.type === 'surface'/)?.[0] || '';
  const surfaceBranch = playerHtml.match(/card\.type === 'surface'[\s\S]*?card\.type === 'reframe'/)?.[0] || '';
  assert.match(costBranch, /appendProse/, 'cost card must render the whole scene');
  assert.match(wideningBranch, /appendProse/, 'widening card must render the whole escalation');
  assert.match(surfaceBranch, /appendProse/, 'surface card must render the promise and the test');
});

test('the close card renders the character close line', () => {
  assert.match(playerHtml, /close-line/, 'close card must render card.body as the closing beat');
});

test('image slots carry real artwork and never a placeholder label', () => {
  assert.doesNotMatch(playerHtml, /IMAGE TO COME/, 'a placeholder label must never ship to respondents');
  for (const key of ['cost-velocity', 'cost-visibility', 'cost-coherence', 'fit-door']) {
    assert.match(playerHtml, new RegExp(`'${key}'`), `ART must define ${key}`);
  }
  const fn = playerHtml.match(/function visualTypeFor[\s\S]*?\n\}/)?.[0] || '';
  assert.match(fn, /revealHurdle/, 'cost slot must pick its variant by the respondent hurdle');
});

test('receipts carry no raw question IDs and no redundant proof line', () => {
  const receiptsBranch = playerHtml.match(/card\.type === 'receipts'[\s\S]*?card\.type === 'quote'/)?.[0] || '';
  assert.doesNotMatch(receiptsBranch, /receipt\.id/, 'internal question IDs must not render');
  assert.doesNotMatch(receiptsBranch, /receipt\.proves/, 'the proves line restates the read; payload-only');
});

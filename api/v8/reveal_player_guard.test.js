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
  const costBranch = playerHtml.match(/card\.type === 'cost'[\s\S]*?card\.type === 'firstMove'/)?.[0] || '';
  assert.match(costBranch, /appendProse/, 'cost card must render the whole scene');
});

test('important keywords can be rendered in bold', () => {
  assert.match(playerHtml, /function boldify/, 'a boldify helper must exist');
  // boldify escapes first, then promotes only **...** spans -- so user-derived
  // copy can never inject HTML.
  assert.match(playerHtml, /replace\(\/&\/g/, 'boldify must escape ampersands before promoting bold');
  assert.match(playerHtml, /<strong>\$1<\/strong>/, 'boldify must promote **...** to <strong>');
});

test('the score is shown out of 100', () => {
  assert.match(playerHtml, /num-denom/, 'the number card must render a /100 denominator');
});

test('the shape card renders a benchmark ghost bar and plain-language meaning', () => {
  assert.match(playerHtml, /bar-bench/, 'each pillar bar must carry a benchmark ghost');
  assert.match(playerHtml, /bar-plain/, 'each pillar must carry a plain-language meaning');
});

test('the opening card carries the A+A wordmark', () => {
  assert.match(playerHtml, /AA_WORDMARK/, 'the turn card must render the A+A wordmark');
  assert.match(playerHtml, /reveal-wordmark/, 'the wordmark needs its own slot on the opening card');
});

test('every non-final card carries a visible advance affordance', () => {
  assert.match(playerHtml, /card-advance/, 'cards must offer a visible Continue button, not only invisible zones');
});

test('the close card renders the character close line', () => {
  assert.match(playerHtml, /close-line/, 'close card must render the closing beat');
});

test('each reveal card type has a distinct photographic background', () => {
  const block = playerHtml.match(/const CARD_BACKGROUNDS = \{[\s\S]*?\n\};/)?.[0] || '';
  for (const type of ['turn', 'number', 'shape', 'hurdle', 'quote', 'cost', 'firstMove', 'close']) {
    assert.match(block, new RegExp(`${type}: \\{ name: '[^']+'`), `${type} must define a background image`);
  }
  const assets = [...block.matchAll(/name: '([^']+)'/g)].map((match) => match[1]);
  assert.equal(assets.length, 8, 'the eight-card reveal needs eight background entries');
  assert.equal(new Set(assets).size, assets.length, 'each card background asset must be different');
  assert.match(playerHtml, /function backgroundForCard/, 'the player must resolve media by card type');
  assert.match(playerHtml, /section\.dataset\.media/, 'cards should expose the selected asset for browser checks');
});

test('image slots carry real artwork and never a placeholder label', () => {
  assert.doesNotMatch(playerHtml, /IMAGE TO COME/, 'a placeholder label must never ship to respondents');
  for (const key of ['cost-velocity', 'cost-visibility', 'cost-coherence', 'fit-door']) {
    assert.match(playerHtml, new RegExp(`'${key}'`), `ART must define ${key}`);
  }
  const fn = playerHtml.match(/function visualTypeFor[\s\S]*?\n\}/)?.[0] || '';
  assert.match(fn, /revealHurdle/, 'cost slot must pick its variant by the respondent hurdle');
});

test('folded receipts render as supporting evidence, not raw question IDs', () => {
  const hurdleBranch = playerHtml.match(/card\.type === 'hurdle'[\s\S]*?card\.type === 'quote'/)?.[0] || '';
  assert.match(hurdleBranch, /support/, 'the hurdle card must show folded supporting evidence');
  assert.doesNotMatch(hurdleBranch, /receipt\.id/, 'internal question IDs must not render');
  assert.doesNotMatch(hurdleBranch, /receipt\.proves/, 'the proves line restates the read; payload-only');
});

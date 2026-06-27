// Static guards on the reveal player. These are string-level by design: cheap,
// browser-free and loud when someone restructures buildCard.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const playerHtml = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'reveal', 'index.html'),
  'utf8'
);

test('authored emphasis supports serif italic safely and never bold', () => {
  assert.match(playerHtml, /function formatCopy/, 'a copy emphasis helper must exist');
  assert.match(playerHtml, /replace\(\/&\/g/, 'copy helper must escape ampersands first');
  assert.match(playerHtml, /<em>\$1<\/em>/, 'copy helper must promote *...* to serif italic');
  assert.doesNotMatch(playerHtml, /<strong>/, 'copy helper must not render bold emphasis');
  assert.doesNotMatch(playerHtml, /function boldify/, 'old bold helper must not ship');
});

test('big reveal headers and more drawers are first-class player primitives', () => {
  assert.match(playerHtml, /function h\(text, delay\)/, 'player must expose a reveal header helper');
  assert.match(playerHtml, /\.reveal-h/, 'player must style the big Instrument Serif header');
  assert.match(playerHtml, /function buildDrawer/, 'player must expose one collapsed More drawer helper');
  assert.match(playerHtml, /more-drawer/, 'drawer class must ship');
  assert.match(playerHtml, /more-summary/, 'drawer summary class must ship');
});

test('pillar glyphs are embedded and rendered on required slides', () => {
  assert.match(playerHtml, /const PILLAR_ICONS/, 'pillar icon map must exist');
  for (const label of ['Visibility', 'Velocity', 'Coherence', 'Leverage']) {
    assert.match(playerHtml, new RegExp(`${label}: '<`), `${label} icon path must exist`);
  }
  assert.match(playerHtml, /function pillarIcon/, 'pillarIcon helper must exist');
  assert.match(playerHtml, /pillarIcon\(pillar\.icon \|\| pillar\.label, 'bar'\)/, 'shape bars must render pillar glyphs');
  assert.match(playerHtml, /pillarIcon\(card\.glyph, 'big anim d1'\)/, 'hurdle slide must render the large constraint glyph');
  assert.match(playerHtml, /pillarIcon\(card\.glyph, 'eyebrow-glyph'\)/, 'first move slide must render the constraint glyph');
  assert.match(playerHtml, /glyph-row/, 'close slide must render the four-glyph motif');
});

test('score line is not gated on count-up completion', () => {
  assert.match(playerHtml, /num-denom/, 'the number card must render a /100 denominator');
  assert.match(playerHtml, /setTimeout\(\(\) => afterItems\.forEach\(\(after\) => after\.classList\.add\('show'\)\), 250\)/, 'score line should show independently after 250ms');
  assert.doesNotMatch(playerHtml, /\.card\.is-active \.num-after\.show \{[\s\S]*?animation-delay/, 'score line should not carry a second CSS delay after the 250ms timer');
  assert.doesNotMatch(playerHtml, /afterItems\.forEach\(\(after\) => after\.classList\.add\('show'\)\);\s*\n\s*\}/, 'score line should not wait for the count-up else block');
});

test('shape card uses a benchmark tick and respondent value over the fill', () => {
  assert.match(playerHtml, /bar-myval/, 'respondent value must ride the filled bar');
  assert.match(playerHtml, /bar-benchval/, 'benchmark tick must show the benchmark value');
  assert.match(playerHtml, /bench\.style\.left/, 'benchmark must be positioned as a tick');
  assert.doesNotMatch(playerHtml, /bench\.style\.width/, 'benchmark must not render as a left-anchored ghost bar');
  assert.match(playerHtml, /bar-plain/, 'each pillar must carry a plain-language meaning');
});

test('drawers hold detail instead of default-view dense copy', () => {
  assert.match(playerHtml, /buildDrawer\('What this means'/, 'score interpretation should be in a drawer');
  assert.match(playerHtml, /buildDrawer\('Read the shape'/, 'shape read should be in a drawer');
  assert.match(playerHtml, /buildDrawer\('Show the answers behind this'/, 'hurdle evidence should be in a drawer');
  assert.match(playerHtml, /buildDrawer\('See the week behind this'/, 'cost scene should be in a drawer');
  assert.doesNotMatch(playerHtml, /cost-cascade/, 'cost receipts must not ship in the default finale view');
  assert.match(playerHtml, /buildDrawer\('The exact first move'/, 'first move brief should be in a drawer');
  assert.doesNotMatch(playerHtml, /buildDrawer\('What you walk out with'/, 'close slide must not carry a visible detail drawer');
  assert.doesNotMatch(playerHtml, /From your answers/, 'default hurdle view must not ship the anxious support label');
});

test('finale cards use distinct climactic layouts', () => {
  assert.match(playerHtml, /finale-grid/, 'cost slide must use a split finale layout');
  assert.match(playerHtml, /cost-impact/, 'cost slide must render a dedicated impact panel');
  assert.match(playerHtml, /costImpactLine/, 'cost slide must use a sharper impact line than the body copy');
  assert.match(playerHtml, /move-stage/, 'first move slide must use a distinct move layout');
  assert.match(playerHtml, /move-symbol/, 'first move slide must render a large constraint symbol');
  assert.match(playerHtml, /move-rail/, 'first move slide must render the three-step move rail');
  assert.match(playerHtml, /close-stage/, 'close slide must use a focused booking layout');
  assert.match(playerHtml, /close-action/, 'close slide must group the CTA as the final action');
});

test('quote reveal timing is the fast stagger', () => {
  assert.match(playerHtml, /300 \+ index \* 40/, 'quote words should use the faster word stagger');
  assert.match(playerHtml, /300 \+ spans\.length \* 40 \+ 450/, 'quote after-line should use the faster delay');
});

test('every reveal card type has a distinct photographic background', () => {
  const block = playerHtml.match(/const CARD_BACKGROUNDS = \{[\s\S]*?\n\};/)?.[0] || '';
  for (const type of ['turn', 'number', 'shape', 'hurdle', 'quote', 'cost', 'firstMove', 'close']) {
    assert.match(block, new RegExp(`${type}: \\{ name: '[^']+'`), `${type} must define a background image`);
  }
  const assets = [...block.matchAll(/name: '([^']+)'/g)].map((match) => match[1]);
  assert.equal(assets.length, 8, 'the eight-card reveal needs eight background entries');
  assert.equal(new Set(assets).size, assets.length, 'each card background asset must be different');
  assert.match(block, /close: \{ name: 'earth'/, 'close slide must use the sharper earth image, not the blurred city image');
  assert.match(playerHtml, /function backgroundForCard/, 'the player must resolve media by card type');
  assert.match(playerHtml, /section\.dataset\.media/, 'cards should expose the selected asset for browser checks');
});

test('image placeholders never ship to respondents', () => {
  assert.doesNotMatch(playerHtml, /IMAGE TO COME/, 'a placeholder label must never ship to respondents');
});

test('every non-final card carries a visible advance affordance', () => {
  assert.match(playerHtml, /card-advance/, 'cards must offer a visible Continue button, not only invisible zones');
});

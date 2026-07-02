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

test('hurdle card explains the profile name where it is earned', () => {
  assert.match(playerHtml, /function buildProfileRead/, 'profile explainer helper must exist');
  assert.match(playerHtml, /profile-read/, 'profile explainer must ship');
  assert.match(playerHtml, /buildProfileRead\(card\.profileRead\)/, 'hurdle slide must render profile explainer copy');
  assert.match(playerHtml, /The name describes the pattern your answers revealed/, 'fallback profile explainer must define what the name means');
});

test('drawers hold detail instead of default-view dense copy', () => {
  assert.match(playerHtml, /function buildOpenDetail/, 'score interpretation should render as an always-open detail block');
  assert.match(playerHtml, /buildOpenDetail\(card\.drawerLabel \|\| 'Score detail'/, 'score detail must be open by default, not hidden behind a toggle');
  assert.match(playerHtml, /card\.drawerLabel \|\| 'What the gap means'/, 'shape read should be in a labelled drawer');
  assert.match(playerHtml, /card\.drawerLabel \|\| 'The pattern'/, 'hurdle evidence should be in a labelled drawer');
  assert.match(playerHtml, /card\.drawerLabel \|\| 'Where the cost hides'/, 'cost scene should be in a labelled drawer');
  assert.doesNotMatch(playerHtml, /cost-cascade/, 'cost receipts must not ship in the default finale view');
  assert.match(playerHtml, /card\.drawerLabel \|\| 'Session map'/, 'first move brief should be in a labelled drawer');
  assert.doesNotMatch(playerHtml, /buildDrawer\('What you walk out with'/, 'close slide must not carry a visible detail drawer');
  assert.doesNotMatch(playerHtml, /From your answers/, 'default hurdle view must not ship the anxious support label');
});

test('pattern slide replaces the old quote-only beat', () => {
  assert.match(playerHtml, /buildPatternSupport/, 'pattern slide must render support rows');
  assert.match(playerHtml, /buildExactAnswers/, 'pattern slide must keep exact answers in a drawer');
  assert.match(playerHtml, /pattern-support/, 'pattern support rail must be styled');
  assert.match(playerHtml, /card\.header/, 'quote card branch must support the new pattern header');
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
  assert.match(playerHtml, /card\.advanceLabel \|\| 'Continue'/, 'advance buttons should support slide-specific next actions');
});

test('mobile advance CTAs stay in the content flow', () => {
  const advanceRules = [...playerHtml.matchAll(/\.card-advance\s*\{([^}]*)\}/g)].map((match) => match[1]);
  assert(advanceRules.length > 0, 'advance CTA rules must exist');
  assert.match(playerHtml, /@media \(max-width: 680px\)[\s\S]*?\.card-advance\s*\{[\s\S]*?position:\s*relative/, 'mobile advance buttons must remain in-flow');
  assert(advanceRules.every((rule) => !/position:\s*sticky/.test(rule)), 'advance buttons must not become sticky overlays');
  assert(advanceRules.every((rule) => !/position:\s*fixed/.test(rule)), 'advance buttons must not become fixed overlays');
});

test('reveal tap zones and drawer-open CTAs stay interactive', () => {
  assert.match(playerHtml, /document\.getElementById\('stage'\)\.addEventListener\('click'/, 'blank stage clicks must drive reveal navigation');
  assert.match(playerHtml, /\.card-inner/, 'stage navigation must ignore card content clicks');
  assert.match(playerHtml, /\.card-advance/, 'stage navigation must ignore advance CTA clicks');
  assert.match(playerHtml, /'summary'/, 'stage navigation must ignore drawer summary clicks');
  assert.match(playerHtml, /event\.clientX <= leftEdge[\s\S]*?go\(i - 1\)/, 'blank left-side clicks must go back');
  assert.match(playerHtml, /go\(i \+ 1\)/, 'blank right-side clicks must advance');
  assert.doesNotMatch(playerHtml, /\.card:has\(\.more-drawer\[open\]\)\s+\.card-advance\s*\{[\s\S]*?opacity:\s*0/, 'opening a drawer must not hide the advance CTA');
  assert.match(playerHtml, /\.card:has\(\.more-drawer\[open\]\)\s+\.card-inner\s*\{[\s\S]*?padding-bottom:/, 'open drawers need bottom clearance for the visible CTA');
});

test('booking link preserves invitee prefill while suppressing referrer data', () => {
  assert.match(playerHtml, /window\.open\(withInvitee\(url\), '_blank', 'noopener,noreferrer'\)/, 'calendar links should keep invitee prefill and suppress referrer data');
  assert.match(playerHtml, /function withInvitee/, 'calendar URL prefill must remain wired');
  assert.match(playerHtml, /searchParams\.set\('email'/, 'email prefill must remain wired for the scheduler');
  assert.match(playerHtml, /searchParams\.set\('name'/, 'name prefill must remain wired for the scheduler');
  assert.match(playerHtml, /body\.reveal\.email/, 'the reveal player should receive respondent email for scheduler prefill');
});

test('reveal demo URLs are ignored unless the review harness is enabled', () => {
  assert.match(playerHtml, /window\.__AA_DEMO_HARNESS_ALLOWED__ = false/);
  assert.match(playerHtml, /function resolveDemoHarnessAllowed/);
  assert.match(playerHtml, /body\.demoHarness\?\.enabled/);
  assert.match(playerHtml, /if \(!window\.__AA_DEMO_HARNESS_ALLOWED__\) throw new Error\('unknown_demo'\)/);
  assert.match(playerHtml, /const demoAllowed = await resolveDemoHarnessAllowed\(\)/);
  assert.match(playerHtml, /if \(demoAllowed && \(demoKey \|\| demoNavOn\)\)/);
  assert.doesNotMatch(playerHtml, /else if \(demoKey \|\| demoNavOn\) loadDemo/);
  assert.doesNotMatch(playerHtml, /window\.__AA_DEMO_HARNESS_ALLOWED__ = \['localhost', '127\.0\.0\.1', '::1'\]\.includes/);
});

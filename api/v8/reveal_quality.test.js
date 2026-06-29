import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  deriveProfile,
  deriveRevealInsights,
  sanitiseAnswers,
  scoreAfterLine
} from '../_lib/profile.js';
import {
  COST_HERO,
  PERSONA,
  QUOTE_SOWHAT,
  SESSION_OFFER
} from '../_lib/reveal_copy.js';
import { DEMO_SCENARIOS } from '../_lib/demo_scenarios.js';

const CARD_TYPES = ['turn', 'number', 'shape', 'hurdle', 'quote', 'cost', 'firstMove', 'close'];
const PROFILE_KEYS = ['c-vi', 'c-ve', 'c-co', 't-vi', 't-ve', 't-co', 's-vi', 's-ve', 's-co'];
const HURDLES = ['Visibility', 'Velocity', 'Coherence'];
const BUCKETS = ['Clarity', 'Traction', 'Scale'];

const RETIRED_COPY = [
  'Not a grade',
  'The next card shows you which way',
  'The shape behind',
  'From your answers',
  'From your own answers',
  'Thirty minutes with Saverio',
  'The working session',
  'Your words - the line we keep returning to',
  'What it is costing',
  'The first move - start Monday',
  'Ghost bar'
];

const BANNED_TERMS = [
  'honest',
  'honestly',
  'to be honest',
  'elevate',
  'unlock',
  'reimagine',
  'synergy',
  'landscape',
  'ecosystem',
  'north star',
  'move the needle',
  'game-changer',
  'disrupt',
  'seamless',
  'robust',
  'in a world where',
  'at the end of the day',
  'at your size',
  'the board',
  'board-level',
  'AI layer',
  'weak wiring',
  'best-in-class',
  'solutions'
];

function flatten(value) {
  if (Array.isArray(value)) return value.map(flatten).join('\n');
  if (value && typeof value === 'object') return Object.values(value).map(flatten).join('\n');
  return typeof value === 'string' ? value : '';
}

test('scoreAfterLine returns the four specified score-band lines', () => {
  assert.equal(scoreAfterLine(0), 'Clear enough to act. Low enough to show the first fix.');
  assert.equal(scoreAfterLine(44), 'Clear enough to act. Low enough to show the first fix.');
  assert.equal(scoreAfterLine(45), 'Enough signal to act. Too uneven to scale cleanly.');
  assert.equal(scoreAfterLine(64), 'Enough signal to act. Too uneven to scale cleanly.');
  assert.equal(scoreAfterLine(65), 'Strong base. One leak is carrying too much risk.');
  assert.equal(scoreAfterLine(79), 'Strong base. One leak is carrying too much risk.');
  assert.equal(scoreAfterLine(80), 'Strong base. Fix the rule before adding another tool.');
  assert.equal(scoreAfterLine(100), 'Strong base. Fix the rule before adding another tool.');
});

test('cost hero copy covers every hurdle and bucket combination', () => {
  for (const hurdle of HURDLES) {
    for (const bucket of BUCKETS) {
      assert.equal(Boolean(COST_HERO[hurdle]?.[bucket]), true, `${hurdle}/${bucket} needs a cost hero`);
    }
  }
});

test('every persona has the final close headline and close line', () => {
  for (const key of PROFILE_KEYS) {
    assert.equal(Boolean(PERSONA[key]?.headline), true, `${key} needs a slide-8 headline`);
    assert.equal(Boolean(PERSONA[key]?.closeLine), true, `${key} needs a slide-8 close line`);
  }
});

test('quote so-what copy covers every hurdle', () => {
  for (const hurdle of HURDLES) {
    assert.equal(Boolean(QUOTE_SOWHAT[hurdle]), true, `${hurdle} needs a quote so-what line`);
  }
});

test('demo reveal matrix emits the overhauled 8-card contract', () => {
  for (const [expectedKey, rawAnswers] of Object.entries(DEMO_SCENARIOS)) {
    const answers = sanitiseAnswers(rawAnswers);
    const profile = deriveProfile(answers);
    const insights = deriveRevealInsights(answers, profile, { name: 'James', brandName: 'A+A Demo' });
    const copy = flatten(insights.cards);
    const lowerCopy = copy.toLowerCase();

    assert.equal(profile.key, expectedKey, `${expectedKey} should derive to itself`);
    assert.deepEqual(insights.cards.map((card) => card.type), CARD_TYPES, `${expectedKey} should render the reveal spine`);

    const [turn, number, shape, hurdle, quote, cost, firstMove, close] = insights.cards;

    assert.equal(turn.eyebrow, 'A+A · AI READINESS');
    assert.equal(turn.personaName, profile.characterName);
    assert.equal(Boolean(turn.signature), true);
    assert.match(turn.headline, /(number|signal|work|pattern)/i);
    assert.match(turn.body, /score, the leak and the first rule/);

    assert.equal(number.label, 'WHERE YOUR BUSINESS STANDS TODAY');
    assert.equal(number.max, 100);
    assert.equal(number.after, scoreAfterLine(profile.score));
    assert.equal(number.interpretation.some((row) => row.label === 'Score read'), true);
    assert.equal(number.interpretation.some((row) => row.label === 'Next threshold'), true);
    assert.equal(number.drawerLabel, 'Score detail');
    assert.equal(number.advanceLabel, 'Find the leak');

    assert.equal(shape.eyebrow, 'WHERE YOU STAND VS BEST PRACTICE');
    assert.match(shape.header, /^Benchmark vs the best\. /);
    assert.match(shape.lede, /light line/);
    assert.match(shape.benchmarkNote, /Right-hand mark/);
    assert.equal(shape.pillars.length, 4);
    assert.equal(shape.header, 'Benchmark vs the best. The gap is the work.');
    const dragRows = shape.pillars.filter((pillar) => pillar.role === 'drag');
    assert.equal(dragRows.length, 0, `${expectedKey} should not over-highlight a single row on the benchmark card`);
    for (const pillar of shape.pillars) {
      assert.equal(pillar.icon, pillar.label, `${expectedKey} ${pillar.label} should expose its glyph key`);
      assert.equal(Boolean(pillar.plain), true, `${expectedKey} ${pillar.label} should have plain label copy`);
      assert.equal(Number.isFinite(pillar.benchmark), true, `${expectedKey} ${pillar.label} should carry benchmark value`);
      assert.equal(pillar.benchmark < 100, true, `${expectedKey} ${pillar.label} benchmark should not imply perfection`);
    }
    assert.equal(shape.shapeRead.some((row) => row.label === 'First leak'), true);
    assert.equal(shape.shapeRead.some((row) => row.label === 'AI risk'), true);
    assert.equal(shape.drawerLabel, 'What the gap means');
    assert.equal(shape.advanceLabel, 'Find the first leak');

    assert.equal(hurdle.eyebrow, 'THE ONE THING TO FIX FIRST');
    assert.equal(hurdle.glyph, profile.hurdle);
    assert.match(hurdle.close, /^First leak: /);
    assert.equal(hurdle.evidence?.length, 0);
    assert.equal(hurdle.drawerLabel, '');
    assert.equal(hurdle.advanceLabel, 'See the pattern');

    assert.equal(quote.eyebrow, 'THE PATTERN');
    assert.match(quote.header, /Your answers show/);
    assert.equal(Boolean(quote.body), true);
    assert.equal(Boolean(quote.signalLine), true);
    assert.doesNotMatch(quote.body, /clearest signal/i);
    assert.doesNotMatch(quote.signalLine, /^The useful pattern: /);
    assert.equal(Boolean(quote.quote), true);
    assert.equal(Boolean(quote.sowhat), true);
    assert.equal(quote.patternRows?.length, 3);
    assert.equal(quote.drawerLabel, '');
    assert.equal(quote.advanceLabel, 'Price the cost');

    assert.equal(cost.eyebrow, 'WHAT THE GAP COSTS');
    assert.equal(cost.glyph, profile.hurdle);
    assert.equal(Boolean(cost.hero || COST_HERO[profile.hurdle][profile.bucket]), true);
    assert.equal(Boolean(cost.compound), true);
    assert.equal(Boolean(cost.bill?.metric), true);
    assert.equal(Boolean(cost.bill?.line), true);
    assert.equal(cost.model.some((row) => row.label === 'Your number'), true);
    assert.equal(cost.model.some((row) => row.label === 'Track next'), true);
    assert.equal(cost.compounders.some((row) => row.label === 'If ignored'), true);
    assert.equal(cost.body.length >= 2, true);
    assert.equal(cost.drawerLabel, 'Where the cost hides');
    assert.equal(cost.advanceLabel, 'See the first move');

    assert.equal(firstMove.eyebrow, 'THE FIRST MOVE');
    assert.equal(firstMove.glyph, profile.hurdle);
    assert.match(firstMove.header, /Bring/);
    assert.equal((firstMove.header.match(/\*/g) || []).length, 2);
    assert.match(firstMove.move, /Our CEO/);
    assert.equal(firstMove.forward, 'You leave with one rule you can run next week.');
    assert.equal(firstMove.brief.some((row) => row.label === 'Bring'), true);
    assert.equal(firstMove.brief.some((row) => row.label === 'Leave with'), true);
    assert.equal(firstMove.drawerLabel, 'Session map');
    assert.equal(firstMove.advanceLabel, 'Book the session');

    assert.equal(close.eyebrow, 'WHERE THIS GOES NEXT');
    assert.equal(close.header, PERSONA[expectedKey].headline.replace('{brandName}', 'A+A Demo'));
    assert.equal(close.offer, SESSION_OFFER);
    assert.equal(close.fitBody, SESSION_OFFER);
    assert.equal(close.glyph, profile.hurdle);
    assert.equal(close.closeLine, PERSONA[expectedKey].closeLine);
    assert.equal(close.outputs?.length >= 3, true);
    assert.equal(close.qualifier, '');
    assert.doesNotMatch(close.qualifier, /Saverio/);

    assert.equal(Boolean(insights.summary.actionPlan?.artefactName), true);
    assert.equal(Boolean(insights.summary.actionPlan?.mondayMove), true);

    assert.doesNotMatch(copy, /—/, `${expectedKey} assembled reveal copy must not use em dashes`);
    assert.doesNotMatch(copy, /,\s+(and|or)\b/i, `${expectedKey} assembled reveal copy must not use Oxford-comma patterns`);
    assert.doesNotMatch(copy, /\*\*/, `${expectedKey} assembled reveal copy must not use bold-style emphasis markers`);
    assert.doesNotMatch(copy, /Saverio/, `${expectedKey} assembled reveal copy must not mention Saverio`);
    for (const retired of RETIRED_COPY) {
      assert.equal(copy.includes(retired), false, `${expectedKey} should not include retired copy: ${retired}`);
    }
    for (const banned of BANNED_TERMS) {
      assert.equal(lowerCopy.includes(banned), false, `${expectedKey} should not include banned term: ${banned}`);
    }
  }
});

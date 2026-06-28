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
  assert.equal(scoreAfterLine(0), 'Strong peers sit in the mid-80s. The first job is to stop the leak, not fix everything.');
  assert.equal(scoreAfterLine(44), 'Strong peers sit in the mid-80s. The first job is to stop the leak, not fix everything.');
  assert.equal(scoreAfterLine(45), 'Enough signal to act. One operating leak is making the rest pay.');
  assert.equal(scoreAfterLine(64), 'Enough signal to act. One operating leak is making the rest pay.');
  assert.equal(scoreAfterLine(65), 'Good base. One leak is carrying too much operating risk.');
  assert.equal(scoreAfterLine(79), 'Good base. One leak is carrying too much operating risk.');
  assert.equal(scoreAfterLine(80), 'Strong base. The next gain comes from one rule, not another tool.');
  assert.equal(scoreAfterLine(100), 'Strong base. The next gain comes from one rule, not another tool.');
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
    assert.match(turn.lede, /leaks in the \*decision\*/);
    assert.match(turn.body, /one to map first/);

    assert.equal(number.label, 'WHERE A+A Demo STANDS TODAY');
    assert.equal(number.max, 100);
    assert.equal(number.after, scoreAfterLine(profile.score));
    assert.equal(number.interpretation.some((row) => row.label === 'Score read'), true);
    assert.equal(number.interpretation.some((row) => row.label === 'Next threshold'), true);
    assert.equal(number.drawerLabel, 'Score detail');
    assert.equal(number.advanceLabel, 'Find the leak');

    assert.equal(shape.eyebrow, 'WHERE YOU STAND VS PEERS');
    assert.equal(shape.header, 'Benchmark vs *strong peers*.');
    assert.match(shape.lede, /strong-peer mark/);
    assert.match(shape.benchmarkNote, /not perfection/);
    assert.equal(shape.pillars.length, 4);
    for (const pillar of shape.pillars) {
      assert.equal(pillar.icon, pillar.label, `${expectedKey} ${pillar.label} should expose its glyph key`);
      assert.equal(Boolean(pillar.plain), true, `${expectedKey} ${pillar.label} should have plain label copy`);
      assert.equal(Number.isFinite(pillar.benchmark), true, `${expectedKey} ${pillar.label} should carry benchmark value`);
      assert.equal(pillar.benchmark < 100, true, `${expectedKey} ${pillar.label} benchmark should not imply perfection`);
    }
    assert.equal(shape.shapeRead.some((row) => row.label === 'First leak'), true);
    assert.equal(shape.shapeRead.some((row) => row.label === 'What AI inherits'), true);
    assert.equal(shape.shapeRead.some((row) => row.label === 'AI today'), true);
    assert.equal(shape.drawerLabel, 'Why it matters');
    assert.equal(shape.advanceLabel, 'Find the first leak');

    assert.equal(hurdle.eyebrow, 'THE ONE THING TO FIX FIRST');
    assert.equal(hurdle.glyph, profile.hurdle);
    assert.match(hurdle.close, /^First leak: /);
    assert.equal(hurdle.evidence?.length, 3);
    assert.equal(hurdle.drawerLabel, 'Answer proof');
    assert.equal(hurdle.advanceLabel, 'See the pattern');
    for (const row of hurdle.evidence) {
      assert.equal(Boolean(row.prompt), true);
      assert.equal(Boolean(row.answer), true);
      assert.equal(Boolean(row.read), true);
    }

    assert.equal(quote.eyebrow, 'THE PATTERN IN YOUR ANSWERS');
    assert.match(quote.header, /Three answers/);
    assert.equal(Boolean(quote.body), true);
    assert.equal(Boolean(quote.signalLine), true);
    assert.doesNotMatch(quote.body, /clearest signal/i);
    assert.match(quote.signalLine, /^Clearest signal: /);
    assert.equal(Boolean(quote.quote), true);
    assert.equal(Boolean(quote.sowhat), true);
    assert.equal(quote.proof?.length, 3);
    assert.equal(quote.drawerLabel, 'Exact answers');
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
    assert.equal(cost.body.length >= 3, true);
    assert.equal(cost.drawerLabel, 'Show the cost model');
    assert.equal(cost.advanceLabel, 'See the first move');

    assert.equal(firstMove.eyebrow, 'THE FIRST MOVE');
    assert.equal(firstMove.glyph, profile.hurdle);
    assert.match(firstMove.header, /\*.*rule\*/);
    assert.match(firstMove.move, /Our CEO/);
    assert.equal(firstMove.forward, 'That is the session: one decision path, written before another week leaks.');
    assert.equal(firstMove.brief.some((row) => row.label === 'Bring'), true);
    assert.equal(firstMove.brief.some((row) => row.label === 'Leave with'), true);
    assert.equal(firstMove.drawerLabel, 'What to bring');
    assert.equal(firstMove.advanceLabel, 'Book the session');

    assert.equal(close.eyebrow, 'WHERE THIS GOES NEXT');
    assert.equal(close.header, PERSONA[expectedKey].headline.replace('{brandName}', 'A+A Demo'));
    assert.equal(close.offer, SESSION_OFFER);
    assert.equal(close.fitBody, SESSION_OFFER);
    assert.equal(close.glyph, profile.hurdle);
    assert.equal(close.closeLine, PERSONA[expectedKey].closeLine);
    assert.equal(close.outputs?.length >= 3, true);
    assert.match(close.qualifier, /Our CEO/);
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

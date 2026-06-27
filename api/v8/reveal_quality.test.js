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
  assert.equal(scoreAfterLine(0), 'Strong brands sit near 90. That gap is what your operating system is quietly costing you.');
  assert.equal(scoreAfterLine(44), 'Strong brands sit near 90. That gap is what your operating system is quietly costing you.');
  assert.equal(scoreAfterLine(45), 'Enough to act on. One part of your operating system is making everything else work harder.');
  assert.equal(scoreAfterLine(64), 'Enough to act on. One part of your operating system is making everything else work harder.');
  assert.equal(scoreAfterLine(65), 'Usable readiness. One thing is now doing too much of the work.');
  assert.equal(scoreAfterLine(79), 'Usable readiness. One thing is now doing too much of the work.');
  assert.equal(scoreAfterLine(80), 'Strong. The question is no longer if you are ready. It is which strength to push next.');
  assert.equal(scoreAfterLine(100), 'Strong. The question is no longer if you are ready. It is which strength to push next.');
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
    assert.match(turn.lede, /gap they never measure/);
    assert.match(turn.body, /Here is yours\./);

    assert.equal(number.label, 'WHERE A+A Demo STANDS TODAY');
    assert.equal(number.max, 100);
    assert.equal(number.after, scoreAfterLine(profile.score));
    assert.equal(number.interpretation.some((row) => row.label === 'What it means'), true);
    assert.equal(number.interpretation.some((row) => row.label === 'Next threshold'), true);

    assert.equal(shape.eyebrow, 'WHERE YOU STAND VS THE BEST');
    assert.equal(shape.header, 'Benchmark vs *the best*.');
    assert.equal(shape.lede, 'Four readings. The best brands live on the right. Here is where you are.');
    assert.equal(shape.pillars.length, 4);
    for (const pillar of shape.pillars) {
      assert.equal(pillar.icon, pillar.label, `${expectedKey} ${pillar.label} should expose its glyph key`);
      assert.equal(Boolean(pillar.plain), true, `${expectedKey} ${pillar.label} should have plain label copy`);
      assert.equal(Number.isFinite(pillar.benchmark), true, `${expectedKey} ${pillar.label} should carry benchmark value`);
    }
    assert.equal(shape.shapeRead.some((row) => row.label === 'Where it leaks'), true);
    assert.equal(shape.shapeRead.some((row) => row.label === 'AI implication'), true);
    assert.equal(shape.shapeRead.some((row) => row.label === 'AI today'), true);

    assert.equal(hurdle.eyebrow, 'THE ONE THING TO FIX FIRST');
    assert.equal(hurdle.glyph, profile.hurdle);
    assert.match(hurdle.close, /^YOUR FIRST CONSTRAINT · /);
    assert.equal(hurdle.evidence?.length, 3);
    for (const row of hurdle.evidence) {
      assert.equal(Boolean(row.prompt), true);
      assert.equal(Boolean(row.answer), true);
      assert.equal(Boolean(row.read), true);
    }

    assert.equal(quote.eyebrow, 'IN YOUR OWN WORDS');
    assert.equal(Boolean(quote.quote), true);
    assert.equal(Boolean(quote.sowhat), true);

    assert.equal(cost.eyebrow, 'WHAT IT COSTS YOU NOW');
    assert.equal(cost.glyph, profile.hurdle);
    assert.equal(cost.hero, COST_HERO[profile.hurdle][profile.bucket]);
    assert.equal(Boolean(cost.compound), true);
    assert.equal(cost.model.some((row) => row.label === 'Your number'), true);
    assert.equal(cost.model.some((row) => row.label === 'Track next'), true);
    assert.equal(cost.compounders.some((row) => row.label === 'If ignored'), true);
    assert.equal(cost.body.length >= 3, true);

    assert.equal(firstMove.eyebrow, 'THE GOOD NEWS');
    assert.equal(firstMove.glyph, profile.hurdle);
    assert.equal(firstMove.header, "You don't fix all of it. You fix *one thing*.");
    assert.equal(Boolean(firstMove.move), true);
    assert.equal(firstMove.forward, 'That is the first move. The call is where we make it real.');
    assert.equal(firstMove.brief.some((row) => row.label === 'Monday move'), true);
    assert.equal(firstMove.brief.some((row) => row.label === 'Output'), true);

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

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { deriveProfile, deriveRevealInsights, sanitiseAnswers } from '../_lib/profile.js';
import { DEMO_SCENARIOS } from '../_lib/demo_scenarios.js';

const STALE_OR_OVERCLAIMING_COPY = [
  'That stops being true on a call',
  'Tanker with a Mandate',
  'Working Blind',
  'Working In, Not On',
  'The Stitcher',
  'Building on Air',
  'Outpacing Yourself',
  'Growing Apart',
  'Building on Belief',
  'Coalition of Pilots'
];

// The reveal was consolidated 14 -> 8 cards (Saverio: fewer pages, punchier).
// receipts fold onto the hurdle card, widening onto the cost card, surface onto
// firstMove, and fit + close merge into one working-session card.
const REMOVED_TYPES = ['receipts', 'gap', 'reframe', 'widening', 'surface', 'fit'];

function flatten(value) {
  if (Array.isArray(value)) return value.map(flatten).join('\n');
  if (value && typeof value === 'object') return Object.values(value).map(flatten).join('\n');
  return typeof value === 'string' ? value : '';
}

test('demo reveal matrix stays coherent across all profile states', () => {
  for (const [expectedKey, rawAnswers] of Object.entries(DEMO_SCENARIOS)) {
    const answers = sanitiseAnswers(rawAnswers);
    const profile = deriveProfile(answers);
    const insights = deriveRevealInsights(answers, profile, { name: 'James' });
    const copy = flatten(insights.cards);

    assert.equal(profile.key, expectedKey, `${expectedKey} should derive to itself`);
    assert.equal(insights.cards.length, 8, `${expectedKey} should render 8 reveal cards`);

    const turn = insights.cards.find((card) => card.type === 'turn');
    const number = insights.cards.find((card) => card.type === 'number');
    const shape = insights.cards.find((card) => card.type === 'shape');
    const hurdle = insights.cards.find((card) => card.type === 'hurdle');
    const quote = insights.cards.find((card) => card.type === 'quote');
    const cost = insights.cards.find((card) => card.type === 'cost');
    const firstMove = insights.cards.find((card) => card.type === 'firstMove');
    const close = insights.cards.find((card) => card.type === 'close');

    for (const removed of REMOVED_TYPES) {
      assert.equal(insights.cards.find((card) => card.type === removed), undefined,
        `${expectedKey} should no longer carry a standalone ${removed} card`);
    }

    // Card 1 (turn): human context + analyst basis (read by the PDF).
    assert.equal(turn?.basis?.some((row) => row.label === 'Seat'), true, `${expectedKey} should state the respondent lens`);
    assert.equal(turn.basis.some((row) => row.label === 'Footprint'), true, `${expectedKey} should state the channel footprint`);
    assert.equal(turn.basis.some((row) => row.label === 'Read lens'), true, `${expectedKey} should explain how to read the diagnosis`);
    assert.match(turn?.contextLine || '', /^You answered from/, `${expectedKey} turn card should carry the human context line`);

    // Card 2 (number): the score is out of 100.
    assert.equal(number?.max, 100, `${expectedKey} score should be expressed out of 100`);
    assert.equal(number.interpretation.some((row) => row.label === 'What it means'), true, `${expectedKey} should explain the score meaning`);
    assert.equal(number.interpretation.some((row) => row.label === 'Next threshold'), true, `${expectedKey} should name the next score threshold`);

    // Card 3 (shape): bars vs an advanced-brand benchmark + plain-language meaning.
    assert.equal(shape?.shapeRead?.some((row) => row.label === 'Where it leaks'), true, `${expectedKey} should name where the shape leaks`);
    assert.equal(shape.shapeRead.some((row) => row.label === 'AI implication'), true, `${expectedKey} should name what AI inherits from the shape`);
    assert.equal(shape.shapeRead.some((row) => row.label === 'AI today'), true, `${expectedKey} should interpret the leverage answers`);
    assert.equal(shape.shapeRead.every((row) => row.label !== 'Where power is'), true, `${expectedKey} shape panel should not restate the strength already shown by the bars`);
    assert.equal(Boolean(shape.benchmark), true, `${expectedKey} shape card should carry the benchmark`);
    assert.equal(shape.pillars.length, 4, `${expectedKey} shape should read four pillars`);
    for (const pillar of shape.pillars) {
      assert.equal(Boolean(pillar.plain), true, `${expectedKey} pillar ${pillar.label} should have a plain-language meaning`);
      assert.equal(Number.isFinite(pillar.benchmark), true, `${expectedKey} pillar ${pillar.label} should carry a benchmark value`);
    }

    // Card 4 (the constraint) reads as prose, plus folded supporting receipts.
    assert.equal(Boolean(hurdle?.body), true, `${expectedKey} should state the constraint as prose`);
    assert.equal(Boolean(hurdle.close), true, `${expectedKey} should close the constraint card by naming the hurdle`);
    assert.equal(hurdle.anatomy, undefined, `${expectedKey} constraint card should not carry an anatomy table`);
    assert.equal(hurdle.evidence?.length, 3, `${expectedKey} hurdle should carry three folded evidence rows`);
    for (const row of hurdle.evidence) {
      assert.equal(Boolean(row.prompt), true, `${expectedKey} evidence should name the source question`);
      assert.equal(Boolean(row.answer), true, `${expectedKey} evidence should show the selected answer`);
      assert.equal(Boolean(row.read), true, `${expectedKey} evidence should include the diagnostic read`);
      assert.equal(Boolean(row.proves), true, `${expectedKey} evidence should state what the answer proves`);
    }
    assert.equal(Boolean(hurdle.tail), true, `${expectedKey} hurdle should carry the receipt tail`);

    // Card 5 (the quote): dark emotional peak, quote + one implication, no lens.
    assert.equal(quote?.quote.length > 0, true);
    assert.equal(Boolean(quote.implication), true, `${expectedKey} should land one implication under the quote`);
    assert.equal(quote.lens, undefined, `${expectedKey} quote peak should not carry a lens table`);
    assert.equal(quote.eyebrow.startsWith('Your words'), true, `${expectedKey} quote eyebrow should address the respondent as you`);

    // Card 6 (cost): scene + cost model + folded widening ("If ignored").
    assert.equal(cost?.model?.some((row) => row.label === 'Loss unit'), true, `${expectedKey} should include a cost model loss unit`);
    assert.equal(cost.model.some((row) => row.label === 'Track next'), true, `${expectedKey} should include a cost model measurement`);
    const yourNumber = cost.model.find((row) => row.label === 'Your number');
    assert.match(yourNumber?.value || '', /gross margin, not revenue/, `${expectedKey} should price the cost in gross margin`);
    const channelLine = cost.body.find((line) => /You run (two|three|four|five)/.test(line));
    assert.equal(Boolean(channelLine), answers.CC.length >= 2, `${expectedKey} cost scene channel line should track the respondent footprint`);
    assert.equal(cost.compounders?.some((row) => row.label === 'Next quarter'), true, `${expectedKey} should include a compounding timeline`);
    assert.equal(cost.compounders.some((row) => row.label === 'If ignored'), true, `${expectedKey} should fold the ignored-cost consequence onto the cost card`);
    assert.equal(cost.body.length >= 3, true, `${expectedKey} cost scene must keep its payoff lines`);
    assert.match(cost.body[cost.body.length - 1], /Run that across/i, `${expectedKey} cost scene should end on the run-the-tape line`);

    // Card 7 (firstMove): the folded "what good looks like" promise + an output brief.
    assert.equal(firstMove?.brief?.some((row) => row.label === 'Output'), true, `${expectedKey} should structure the first move as an output brief`);
    assert.match(firstMove.promise || '', /What good looks like/i, `${expectedKey} first move should carry the folded promise line`);

    // Card 8 (close): merged working-session + character close.
    assert.equal(Boolean(close?.lede), true, `${expectedKey} close card should open with the fit line`);
    assert.equal(/bring/i.test(close.fitBody || ''), true, `${expectedKey} close card should still tell them what to bring`);
    assert.equal(close.outputs?.length >= 3, true, `${expectedKey} should name concrete working-session outputs`);
    assert.equal(close.outputs.some((line) => /live decision/i.test(line)), true, `${expectedKey} should anchor the close in a live decision`);
    assert.equal(close.outputs.some((line) => /rule/i.test(line)), true, `${expectedKey} should name an operating rule`);
    assert.equal(close.outputs.some((line) => /proof measure/i.test(line)), true, `${expectedKey} should name the proof measure`);
    assert.match(close.closeLine || '', /only changes when/, `${expectedKey} close card must carry the character close line`);

    // Action plan + copy hygiene.
    assert.equal(Boolean(insights.summary.actionPlan?.artefactName), true, `${expectedKey} should include an action-plan artefact`);
    assert.equal(Boolean(insights.summary.actionPlan?.mondayMove), true, `${expectedKey} should include a Monday move`);
    assert.equal(copy.includes(insights.summary.actionPlan.artefactName), true, `${expectedKey} should render the action plan`);
    assert.equal(copy.includes('generic AI plan'), false, `${expectedKey} should not use generic action language`);
    assert.equal(copy.includes('the reveal is testing'), false, `${expectedKey} copy must not refer to the reveal in third person`);
    assert.equal(copy.includes('the reveal finds'), false, `${expectedKey} copy must not refer to the reveal in third person`);
    assert.equal(copy.includes('sidecar'), false, `${expectedKey} copy must not use sidecar jargon`);
    assert.equal(copy.includes('That may still be real'), false, `${expectedKey} copy must not hedge the decoy read`);
    assert.equal(copy.includes('probably embedded'), false, `${expectedKey} copy must not hedge the none-case calibration`);
    assert.equal(copy.includes('Possible decoy'), false, `${expectedKey} decoy label should read as The easier answer`);
    assert.equal(copy.includes('.". '), false, `${expectedKey} should not have quote punctuation seams`);

    for (const stale of STALE_OR_OVERCLAIMING_COPY) {
      assert.equal(copy.includes(stale), false, `${expectedKey} should not include stale copy: ${stale}`);
    }
  }
});

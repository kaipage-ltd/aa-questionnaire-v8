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
    assert.equal(insights.cards.length, 14, `${expectedKey} should render 14 reveal cards`);
    const turn = insights.cards.find((card) => card.type === 'turn');
    const number = insights.cards.find((card) => card.type === 'number');
    const shape = insights.cards.find((card) => card.type === 'shape');
    const hurdle = insights.cards.find((card) => card.type === 'hurdle');
    const receipts = insights.cards.find((card) => card.type === 'receipts');
    const quote = insights.cards.find((card) => card.type === 'quote');
    const gap = insights.cards.find((card) => card.type === 'gap');
    const reframe = insights.cards.find((card) => card.type === 'reframe');
    const cost = insights.cards.find((card) => card.type === 'cost');
    const widening = insights.cards.find((card) => card.type === 'widening');
    const surface = insights.cards.find((card) => card.type === 'surface');
    const firstMove = insights.cards.find((card) => card.type === 'firstMove');
    const fit = insights.cards.find((card) => card.type === 'fit');
    const close = insights.cards.find((card) => card.type === 'close');
    assert.equal(quote?.quote.length > 0, true);
    assert.equal(turn?.basis?.some((row) => row.label === 'Seat'), true, `${expectedKey} should state the respondent lens`);
    assert.equal(turn.basis.some((row) => row.label === 'Footprint'), true, `${expectedKey} should state the channel footprint`);
    assert.equal(turn.basis.some((row) => row.label === 'Read lens'), true, `${expectedKey} should explain how to read the diagnosis`);
    assert.equal(number?.interpretation?.some((row) => row.label === 'What it means'), true, `${expectedKey} should explain the score meaning`);
    assert.equal(number.interpretation.some((row) => row.label === 'Next threshold'), true, `${expectedKey} should name the next score threshold`);
    assert.equal(shape?.shapeRead?.some((row) => row.label === 'Where it leaks'), true, `${expectedKey} should name where the shape leaks`);
    assert.equal(shape.shapeRead.some((row) => row.label === 'AI implication'), true, `${expectedKey} should name what AI inherits from the shape`);
    assert.equal(shape.shapeRead.some((row) => row.label === 'AI today'), true, `${expectedKey} should interpret the leverage answers`);
    assert.equal(shape.shapeRead.every((row) => row.label !== 'Where power is'), true, `${expectedKey} shape panel should not restate the strength already shown by the bars and the score card`);
    // Card 4 (the constraint) reads as prose, not a table: the "it has one problem" line carries the beat.
    assert.equal(Boolean(hurdle?.body), true, `${expectedKey} should state the constraint as prose`);
    assert.equal(Boolean(hurdle.close), true, `${expectedKey} should close the constraint card by naming the hurdle`);
    assert.equal(hurdle.anatomy, undefined, `${expectedKey} constraint card should not carry an anatomy table`);
    // Card 6 (the quote) is the dark emotional peak: quote + one implication, no analytical lens.
    assert.equal(Boolean(quote?.implication), true, `${expectedKey} should land one implication under the quote`);
    assert.equal(quote.lens, undefined, `${expectedKey} quote peak should not carry a lens table`);
    // Card 8 (the reframe) is the second dark peak: the realization builds as prose, not a logic table.
    assert.equal(Array.isArray(reframe?.body) && reframe.body.length >= 3, true, `${expectedKey} reframe should build the realization across prose lines`);
    assert.equal(reframe.logic, undefined, `${expectedKey} reframe peak should not carry a logic table`);
    assert.equal(receipts?.evidence?.length, 3, `${expectedKey} should include three evidence rows`);
    for (const row of receipts.evidence) {
      assert.equal(Boolean(row.prompt), true, `${expectedKey} evidence should name the source question`);
      assert.equal(Boolean(row.answer), true, `${expectedKey} evidence should show the selected answer`);
      assert.equal(Boolean(row.read), true, `${expectedKey} evidence should include the diagnostic read`);
      assert.equal(Boolean(row.proves), true, `${expectedKey} evidence should state what the answer proves`);
    }
    assert.equal(gap?.calibration?.length >= 3, true, `${expectedKey} should structure self-perception as calibration rows`);
    assert.equal(gap.calibration.some((row) => row.label === 'Measured signal'), true, `${expectedKey} should name the measured signal`);
    assert.equal(gap.calibration.some((row) => row.label === 'Inspect first'), true, `${expectedKey} should name the first inspection point`);
    assert.equal(cost?.model?.some((row) => row.label === 'Loss unit'), true, `${expectedKey} should include a cost model loss unit`);
    assert.equal(cost.model.some((row) => row.label === 'Track next'), true, `${expectedKey} should include a cost model measurement`);
    const yourNumber = cost.model.find((row) => row.label === 'Your number');
    assert.match(yourNumber?.value || '', /gross margin, not revenue/, `${expectedKey} should invite the respondent to price the cost in gross margin`);
    // The respondent's channel footprint is spent in the cost scene: multi-channel
    // profiles hear the scene multiply across their routes; single-channel must not.
    const channelLine = cost.body.find((line) => /You run (two|three|four|five)/.test(line));
    assert.equal(Boolean(channelLine), answers.CC.length >= 2, `${expectedKey} cost scene channel line should track the respondent footprint`);
    assert.equal(widening?.compounders?.some((row) => row.label === 'Next quarter'), true, `${expectedKey} should include a compounding timeline`);
    assert.equal(widening.compounders.some((row) => row.label === 'If ignored'), true, `${expectedKey} should include the ignored-cost consequence`);
    assert.equal(surface?.implementation?.some((row) => row.label === 'Embedded move'), true, `${expectedKey} should define the embedded implementation move`);
    assert.equal(surface.implementation.some((row) => row.label === 'Proof test'), true, `${expectedKey} should define how to prove the fix is real`);
    assert.equal(Boolean(insights.summary.actionPlan?.artefactName), true, `${expectedKey} should include an action-plan artefact`);
    assert.equal(Boolean(insights.summary.actionPlan?.mondayMove), true, `${expectedKey} should include a Monday move`);
    assert.equal(copy.includes(insights.summary.actionPlan.artefactName), true, `${expectedKey} should render the action plan`);
    assert.equal(copy.includes('generic AI plan'), false, `${expectedKey} should not use generic action language`);
    assert.equal(copy.includes('The compounding cost is'), true, `${expectedKey} should name the compounding cost`);
    assert.equal(copy.includes('The test:'), true, `${expectedKey} should give a test for whether the fix is real`);
    assert.equal(copy.includes('The output should tell you'), true, `${expectedKey} should make the first move concrete`);
    assert.equal(firstMove?.brief?.some((row) => row.label === 'Output'), true, `${expectedKey} should structure the first move as an output brief`);
    // Card 13 (the working session) is a CTA invitation in prose, not another spec table.
    assert.equal(fit.brief, undefined, `${expectedKey} working-session card should not duplicate the first-move brief as a table`);
    assert.equal(Boolean(fit?.body) && /bring/i.test(fit.body), true, `${expectedKey} should still tell them what to bring, in prose`);
    assert.equal(close?.outputs?.length >= 3, true, `${expectedKey} should name concrete working-session outputs`);
    assert.equal(close.outputs.some((line) => /live decision/i.test(line)), true, `${expectedKey} should anchor the close in a live decision`);
    assert.equal(close.outputs.some((line) => /rule/i.test(line)), true, `${expectedKey} should name an operating rule`);
    assert.equal(close.outputs.some((line) => /proof measure/i.test(line)), true, `${expectedKey} should name the proof measure`);
    // Authored-copy guards: the lines the player once silently dropped must stay
    // in the payload in renderable positions.
    assert.equal(cost.body.length >= 3, true, `${expectedKey} cost scene must keep its payoff lines, not just the opening anecdote`);
    assert.match(cost.body[cost.body.length - 1], /Run that across/i, `${expectedKey} cost scene should end on the run-the-tape line`);
    assert.equal(widening.body.length >= 3, true, `${expectedKey} widening should carry the full escalation, not one line`);
    assert.notEqual(widening.body[0], 'And it is getting more expensive.', `${expectedKey} widening lede must not duplicate the card eyebrow`);
    assert.match(widening.body[0], /^The compounding cost is/, `${expectedKey} widening should lead with the specific compounding cost`);
    assert.equal(surface.body.some((line) => /What good looks like for you/i.test(line)), true, `${expectedKey} surface card must state the promise, not only the negations`);
    assert.match(close.body || '', /only changes when/, `${expectedKey} close card must carry the character close line`);
    assert.match(turn?.contextLine || '', /^You answered from/, `${expectedKey} turn card should carry the human context line`);
    assert.equal(copy.includes('the reveal is testing'), false, `${expectedKey} copy must not refer to the reveal in third person`);
    assert.equal(copy.includes('the reveal finds'), false, `${expectedKey} copy must not refer to the reveal in third person`);
    assert.equal(copy.includes('sidecar'), false, `${expectedKey} copy must not use sidecar jargon`);
    assert.equal(copy.includes('That may still be real'), false, `${expectedKey} copy must not hedge the decoy read`);
    assert.equal(copy.includes('probably embedded'), false, `${expectedKey} copy must not hedge the none-case calibration`);
    assert.equal(copy.includes('Possible decoy'), false, `${expectedKey} decoy label should read as The easier answer`);
    assert.equal(quote.eyebrow.startsWith('Your words'), true, `${expectedKey} quote eyebrow should address the respondent as you`);
    assert.equal(copy.includes('You bring this live problem: Bring'), false, `${expectedKey} should not duplicate CTA bring copy`);
    assert.equal(copy.includes('working session: Bring'), false, `${expectedKey} should not repeat bring copy in the close`);
    assert.equal(copy.includes('.". '), false, `${expectedKey} should not have quote punctuation seams`);

    for (const stale of STALE_OR_OVERCLAIMING_COPY) {
      assert.equal(copy.includes(stale), false, `${expectedKey} should not include stale copy: ${stale}`);
    }
  }
});

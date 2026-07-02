import {
  ANSWER_OPTIONS,
  BENCHMARK,
  BENCHMARK_LABEL,
  BUCKET_COPY,
  CARD6_IMPLICATIONS,
  COST_BILL,
  COST_COMPOUND,
  COST_HERO,
  COST_SCENES,
  HURDLE_COPY,
  MONDAY_FORWARD,
  MOVE_BODY,
  MULTI_COPY,
  PERSONA,
  PILLAR_COPY,
  PILLAR_PLAIN,
  QUESTION_STEMS,
  QUOTE_SOWHAT,
  RECEIPT_IMPLICATIONS,
  RECEIPT_PROOFS,
  SAFE_TO_QUOTE,
  SESSION_OFFER,
  SP_GAP_COPY,
  SP_TO_HURDLE,
  STATIC
} from './reveal_copy.js';

const PILLAR_QUESTIONS = {
  Visibility: ['Q2', 'Q3', 'Q4', 'Q5'],
  Velocity: ['Q6', 'Q7', 'Q8', 'Q9'],
  Coherence: ['Q10', 'Q11', 'Q12', 'Q13'],
  Leverage: ['Q14', 'Q15', 'Q16', 'Q17', 'Q18']
};

const HURDLE_SUFFIX = {
  Visibility: 'vi',
  Velocity: 've',
  Coherence: 'co'
};

const BUCKET_PREFIX = {
  Clarity: 'c',
  Traction: 't',
  Scale: 's'
};

const CARD6_PRIORITY = {
  Visibility: ['Q3', 'Q2', 'Q5', 'Q4'],
  Velocity: ['Q7', 'Q8', 'Q9', 'Q6'],
  Coherence: ['Q10', 'Q13', 'Q11', 'Q12']
};

const ROLE_READ = [
  'Founder/CEO lens: unresolved leaks become senior attention cost.',
  'C-suite lens: unresolved leaks become confidence, capital and operating rhythm cost.',
  'Functional-lead lens: unresolved leaks become handoff, ownership and repeat-decision cost.',
  'Operator lens: the reveal stays on the repeated decision path, not the job title.'
];

const CHANNEL_READ = [
  'DTC/owned retail',
  'wholesale/concessions',
  'marketplaces',
  'multi-brand distribution',
  'multi-brand retail'
];

export const PROFILE_META = {
  'c-vi': { characterName: 'The Dead Reckoner', bucket: 'Clarity', hurdle: 'Visibility' },
  'c-ve': { characterName: 'The Sole Hand', bucket: 'Clarity', hurdle: 'Velocity' },
  'c-co': { characterName: 'The Patchwork Crew', bucket: 'Clarity', hurdle: 'Coherence' },
  't-vi': { characterName: 'The Blind Sprinter', bucket: 'Traction', hurdle: 'Visibility' },
  't-ve': { characterName: 'The Late Caller', bucket: 'Traction', hurdle: 'Velocity' },
  't-co': { characterName: 'The Splitting Pack', bucket: 'Traction', hurdle: 'Coherence' },
  's-vi': { characterName: 'The Flagship on Faith', bucket: 'Scale', hurdle: 'Visibility' },
  's-ve': { characterName: 'The Lagging Tanker', bucket: 'Scale', hurdle: 'Velocity' },
  's-co': { characterName: 'The Scattered Fleet', bucket: 'Scale', hurdle: 'Coherence' }
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function sentenceCaseSig(s) {
  if (!s) return '';
  const t = String(s).trim();
  return t.charAt(0).toUpperCase() + t.slice(1) + (/[.!?]$/.test(t) ? '' : '.');
}

function singleScore(value) {
  const index = Number.isFinite(value) ? clamp(value, 0, 3) : 3;
  return Math.round(100 - (index / 3) * 100);
}

function q14Score(value) {
  const picks = Array.isArray(value) ? value : [];
  if (picks.length === 0) return 0;
  const highest = Math.max(...picks.map((v) => clamp(Number(v), 0, 7)));
  return Math.round((highest / 7) * 100);
}

function scoreQuestion(id, answers) {
  if (id === 'Q14') return q14Score(answers[id]);
  return singleScore(answers[id]);
}

export function derivePillarScores(answers) {
  const out = {};
  for (const [pillar, ids] of Object.entries(PILLAR_QUESTIONS)) {
    const total = ids.reduce((sum, id) => sum + scoreQuestion(id, answers), 0);
    out[pillar] = Math.round(total / ids.length);
  }
  return out;
}

export function deriveOverallScore(pillars) {
  return Math.round(
    (pillars.Visibility + pillars.Velocity + pillars.Coherence + pillars.Leverage) / 4
  );
}

export function deriveHurdle(pillars, answers) {
  const candidates = ['Visibility', 'Velocity'];
  const channels = Array.isArray(answers.CC) ? answers.CC : [];
  const coherenceIsMateriallyWeaker =
    Number.isFinite(pillars.Coherence) &&
    pillars.Coherence <= Math.min(pillars.Visibility, pillars.Velocity) - 12;
  if (channels.length !== 1 || coherenceIsMateriallyWeaker) candidates.push('Coherence');
  return candidates.reduce((lowest, next) => (
    pillars[next] < pillars[lowest] ? next : lowest
  ), candidates[0]);
}

function bucketRank(bucket) {
  return { Clarity: 0, Traction: 1, Scale: 2 }[bucket];
}

function rankBucket(rank) {
  return ['Clarity', 'Traction', 'Scale'][rank];
}

export function deriveBucket(answers, overallScore) {
  const ownership = Number.isFinite(answers.Q17) ? answers.Q17 : 3;
  const floor =
    ownership === 0 ? 'Scale' :
    ownership === 1 ? 'Traction' :
    'Clarity';
  const ceiling =
    overallScore <= 40 ? 'Clarity' :
    overallScore <= 60 ? 'Traction' :
    'Scale';
  return rankBucket(Math.min(bucketRank(floor), bucketRank(ceiling)));
}

export function deriveProfile(answers) {
  const pillars = derivePillarScores(answers);
  const score = deriveOverallScore(pillars);
  const hurdle = deriveHurdle(pillars, answers);
  const bucket = deriveBucket(answers, score);
  const key = `${BUCKET_PREFIX[bucket]}-${HURDLE_SUFFIX[hurdle]}`;
  return {
    key,
    score,
    hurdle,
    bucket,
    characterName: PROFILE_META[key].characterName,
    pillars: Object.entries(pillars).map(([label, value]) => ({ label, value }))
  };
}

export function deriveActionPlan(profile) {
  const hurdle = profile.hurdle;
  const bucket = profile.bucket;
  const bucketLine = {
    Clarity: 'Keep it small enough to run this week.',
    Traction: 'Choose a growth decision that repeats often enough to compound.',
    Scale: 'Choose a decision big enough to affect margin, inventory, capital or leadership confidence.'
  }[bucket] || 'Choose one decision the business already repeats.';
  const base = {
    Visibility: {
      artefactName: 'Decision-Grade Number Map',
      why: 'Until one number is trusted, AI only speeds up debate.',
      mondayMove: 'Choose *the number that should change the week*. Write its owner, source, decision and the condition that would make the room stop trusting it.',
      whatToBringToCall: 'Bring the metric everyone references but still has to defend: payback, margin, stock risk, channel quality or the number currently slowing the room.',
      avoidForNow: 'Do not start with a reporting rebuild, dashboard redesign or summary layer. Make one number decision-grade first.'
    },
    Velocity: {
      artefactName: 'Decision Path Timing Map',
      why: 'The lost value is in the waiting, not only in the analysis.',
      mondayMove: 'Choose *one recurring decision*. Mark where the signal starts, where it waits, who owns the call and how many days the handoffs currently cost.',
      whatToBringToCall: 'Bring the live decision path that keeps missing its window: campaign response, stock action, pricing call, hiring approval or another repeated delay.',
      avoidForNow: 'Do not add another meeting, dashboard or tool before you know where the decision is actually waiting.'
    },
    Coherence: {
      artefactName: 'One-Source Decision Map',
      why: 'Separate teams can each be right and still slow the business.',
      mondayMove: 'Choose *one cross-team decision*. Write the source, definition, owner and escalation rule for when the numbers disagree.',
      whatToBringToCall: 'Bring the decision where teams keep arriving with different pictures: channel performance, stock exposure, customer value, margin or AI ownership.',
      avoidForNow: 'Do not scale more AI pilots until one shared decision has one source, one definition and one owner.'
    }
  }[hurdle] || {
    artefactName: 'Main Weakness Map',
    why: 'The next useful move is to make one repeated decision cleaner.',
    mondayMove: 'Choose *one recurring decision* and write the signal, owner, source, delay and first fix.',
    whatToBringToCall: 'Bring one live decision the business is already struggling to make cleanly.',
    avoidForNow: 'Do not broaden the work before the main weakness is visible.'
  };

  return {
    artefactName: base.artefactName,
    headline: `Build the ${base.artefactName} first.`,
    whyThisFirst: `${base.why} ${bucketLine}`,
    mondayMove: base.mondayMove,
    whatToBringToCall: base.whatToBringToCall,
    avoidForNow: base.avoidForNow
  };
}

// Booking link for the close-card CTA. Overridable per-environment via
// PUBLIC_CALENDAR_URL; this default keeps the button live everywhere.
const DEFAULT_CALENDAR_URL = 'https://calendly.com/atelier-and-avenue-saverio-bianchi/atelier-and-avenue-intro-20min';

export function deriveRevealInsights(answers, profile, context = {}) {
  const persona = PERSONA[profile.key];
  const firstName = firstNameOf(context.name);
  const brandName = context.brandName || 'your business';
  const pillars = normalisePillars(profile.pillars);
  const strongest = [...pillars].sort((a, b) => b.value - a.value)[0];
  const hurdlePillar = pillars.find((pillar) => pillar.label === profile.hurdle) || strongest;
  const gap = Math.max(0, strongest.value - hurdlePillar.value);
  const highEvenShape = strongest.value >= 80 && hurdlePillar.value >= 80 && gap <= 6;
  const balancedEvenShape = !highEvenShape && strongest.value >= 60 && hurdlePillar.value >= 60 && gap <= 6;
  const bShape = benchmarkShape(pillars);
  const weakAnswers = weakestAnswersForPillar(answers, profile.hurdle);
  const quote = selectCard6Quote(answers, profile.hurdle, weakAnswers);
  const sp = selfPerception(answers, profile.hurdle);
  const actionPlan = deriveActionPlan(profile);
  const interpolateContext = { firstName, brandName, characterName: profile.characterName };

  // Folded receipts (now supporting evidence on the hurdle card, not a card of
  // their own. Answers support the message rather than being the centre.
  const receiptImplications = weakAnswers.map(({ id, index }) => (
    RECEIPT_IMPLICATIONS[`${id}_${index}`] || answerOption(id, index)
  ));
  const evidence = weakAnswers.map(({ id, index }) => evidenceReceipt(id, index, profile.hurdle));
  const receiptTailLine = receiptTail(profile.hurdle, highEvenShape, balancedEvenShape);
  const surfaceLines = surfaceBody(profile.hurdle);

  // Eight cards, not fourteen. Each beat is its own composition; the heavy
  // Agitation/Promise run is concentrated. PDF still reads shape/hurdle/quote/
  // cost/firstMove by type; receipts fold onto hurdle, widening onto cost.
  const cards = [
    {
      type: 'turn',
      beat: 'Problem',
      eyebrow: STATIC.card1.eyebrow,
      nameLine: `${firstName}.`,
      headline: turnHeadline(profile.hurdle),
      personaName: profile.characterName,
      signature: sentenceCaseSig(persona.signature),
      body: fill(STATIC.card1.body, interpolateContext),
      contextLine: turnContextLine(answers),
      basis: diagnosticBasis(answers, profile),
      advanceLabel: 'Show my score'
    },
    {
      type: 'number',
      beat: 'Problem',
      label: fill(STATIC.card2.label, interpolateContext),
      score: profile.score,
      max: 100,
      interpretation: scoreInterpretation({ profile, strongest, hurdle: hurdlePillar, gap, highEvenShape, balancedEvenShape }),
      after: scoreAfterLine(profile.score),
      drawerLabel: 'Score detail',
      advanceLabel: 'Find the leak'
    },
    {
      type: 'shape',
      beat: 'Problem',
      eyebrow: 'WHERE YOU STAND VS BEST PRACTICE',
      header: 'Benchmark vs the best. The gap is the work.',
      lede: 'Your score is the light line. The mark on the right is best practice. The gap is what AI would inherit.',
      pillars: pillars.map((pillar) => ({
        ...pillar,
        role: 'normal',
        icon: pillar.label,
        plain: PILLAR_PLAIN[pillar.label] || '',
        benchmark: BENCHMARK[pillar.label] || 100
      })),
      benchmark: BENCHMARK,
      benchmarkLabel: BENCHMARK_LABEL,
      benchmarkNote: 'Right mark: best practice before AI carries more decisions.',
      shapeRead: shapeRead({ strongest, hurdle: hurdlePillar, gap, highEvenShape, balancedEvenShape, leverage: leverageReality(answers, profile) }),
      body: shapeBody({ bShape }),
      drawerLabel: 'What the gap means',
      advanceLabel: 'Find what to fix first'
    },
    {
      type: 'hurdle',
      beat: 'Problem',
      eyebrow: 'THE ONE THING TO FIX FIRST',
      ...hurdleCard(profile.hurdle, highEvenShape, balancedEvenShape),
      glyph: profile.hurdle,
      profileRead: {
        label: 'YOUR PROFILE TYPE',
        name: profile.characterName,
        meaning: persona.profileRead?.meaning || `${profile.characterName} is the operating pattern your answers revealed.`,
        fix: persona.profileRead?.fix || `First fix: ${profile.hurdle}.`
      },
      // Folded receipts: shown only in the optional detail drawer.
      receipts: receiptImplications,
      evidence: [],
      tail: receiptTailLine,
      drawerLabel: '',
      advanceLabel: 'See the pattern'
    },
    {
      type: 'quote',
      beat: 'Agitation',
      peak: 1,
      dark: true,
      eyebrow: STATIC.card6.eyebrow,
      lead: STATIC.card6.lead,
      header: patternHeader(profile.hurdle),
      body: patternBody(profile, evidence),
      signalLine: patternSignalLine(profile.hurdle),
      quote: quote.text,
      patternRows: patternRows(evidence),
      sowhat: patternSoWhat(profile.hurdle),
      implication: quoteImplication(quote, highEvenShape),
      drawerLabel: '',
      advanceLabel: 'Price the cost'
    },
    {
      type: 'cost',
      beat: 'Agitation',
      eyebrow: STATIC.card9.eyebrow,
      hero: COST_HERO[profile.hurdle]?.[profile.bucket] || costHero(profile, weakAnswers) || '',
      compound: COST_COMPOUND[profile.bucket] || '',
      bill: COST_BILL[`${profile.hurdle}_${profile.bucket}`] || null,
      glyph: profile.hurdle,
      model: costModel(profile),
      // Folded widening: the "If ignored" escalation rides on the cost card.
      compounders: compoundingModel(profile),
      body: costSceneBody(answers, profile, interpolateContext, quote),
      drawerLabel: 'Where the cost hides',
      advanceLabel: 'See the first move'
    },
    {
      type: 'firstMove',
      beat: 'Promise',
      eyebrow: STATIC.card12.eyebrow,
      header: firstMoveHeader(profile.hurdle),
      move: MOVE_BODY[profile.hurdle] || '',
      forward: MONDAY_FORWARD,
      glyph: profile.hurdle,
      actionPlan,
      // Folded surface: the one "what good looks like" promise frames the move.
      promise: surfaceLines.find((line) => /What good looks like/i.test(line)) || '',
      brief: firstMoveBrief({ actionPlan, hurdle: profile.hurdle, quote }),
      body: firstMoveBody({ actionPlan, hurdle: profile.hurdle, quote }),
      drawerLabel: 'Session map',
      advanceLabel: 'See the session'
    },
    {
      type: 'close',
      beat: 'Solution',
      dark: true,
      eyebrow: STATIC.card13.eyebrow,
      characterName: profile.characterName,
      actionPlan,
      header: fill(persona.headline, interpolateContext),
      offer: SESSION_OFFER,
      glyph: profile.hurdle,
      lede: fill(persona.headline, interpolateContext),
      fitBody: SESSION_OFFER,
      outputs: sessionOutputs(profile, actionPlan),
      closeLine: persona.closeLine,
      button: STATIC.card13.button,
      qualifier: STATIC.card13.qualifier,
      // Only let an env/context value override when it is a real https URL, so a
      // stale or empty PUBLIC_CALENDAR_URL never breaks the booking link.
      calendarUrl: (typeof context.calendarUrl === 'string' && /^https:\/\//i.test(context.calendarUrl))
        ? context.calendarUrl
        : DEFAULT_CALENDAR_URL
    }
  ];

  return {
    cards,
    summary: {
      firstName,
      brandName,
      persona: persona.name,
      signature: persona.signature,
      strongest,
      hurdle: hurdlePillar,
      gap,
      quote,
      receipts: receiptImplications,
      actionPlan,
      benchmarkShape: bShape
    }
  };
}

export function sanitiseAnswers(input) {
  const answers = {};
  for (const id of ['Q1', ...PILLAR_QUESTIONS.Visibility, ...PILLAR_QUESTIONS.Velocity, ...PILLAR_QUESTIONS.Coherence, 'Q15', 'Q16', 'Q17', 'Q18']) {
    if (Number.isFinite(input?.[id])) answers[id] = clamp(Number(input[id]), 0, 3);
  }
  for (const id of ['CC', 'Q14', 'SP']) {
    const value = input?.[id];
    const max = { CC: 4, Q14: 7, SP: 11 }[id];
    let picks = Array.isArray(value)
      ? value.map((v) => Number(v)).filter(Number.isFinite).map((v) => clamp(v, 0, max))
      : [];
    picks = [...new Set(picks)].sort((a, b) => a - b);
    if (id === 'Q14' && picks.includes(0)) picks = [0];
    if (id === 'SP' && picks.length > 1 && picks.includes(11)) picks = picks.filter((pick) => pick !== 11);
    answers[id] = picks;
  }
  return answers;
}

function normalisePillars(pillars) {
  const values = new Map((pillars || []).map((pillar) => [pillar.label, pillar.value]));
  return ['Visibility', 'Velocity', 'Coherence', 'Leverage'].map((label) => ({
    label,
    value: values.has(label) ? values.get(label) : 0
  }));
}

function benchmarkShape(pillars) {
  const vals = pillars.map((pillar) => pillar.value);
  const maxV = Math.max(...vals);
  const minV = Math.min(...vals);
  const spread = maxV - minV;
  const lowest = pillars.reduce((a, b) => (b.value < a.value ? b : a));
  const highest = pillars.reduce((a, b) => (b.value > a.value ? b : a));
  const highEven = maxV >= 80 && spread <= 10;
  const clustered = !highEven && spread <= 10;
  const clearLaggard = spread > 10;
  return { spread, lowest, highest, maxV, minV, highEven, clustered, clearLaggard };
}

// One human sentence acknowledging seat and footprint on the opening card,
// replacing the analyst-register basis table in the player.
function turnContextLine(answers) {
  const seat = [
    'the founder seat',
    'a C-suite seat',
    'a functional-lead seat',
    'an operator seat'
  ][clamp(Number.isFinite(answers?.Q1) ? answers.Q1 : 3, 0, 3)];
  const channels = Array.isArray(answers?.CC) ? answers.CC.length : 0;
  if (channels >= 2) {
    const count = ['two', 'three', 'four', 'five'][Math.min(channels, 5) - 2];
    return `You answered from ${seat}, running ${count} routes to market, so joins and handoffs are part of this read.`;
  }
  if (channels === 1) {
    return `You answered from ${seat} with one route to market, so the read stays close to the decision path itself.`;
  }
  return `You answered from ${seat}, so the read stays on the decisions the business repeats every week.`;
}

function diagnosticBasis(answers, profile) {
  const role = ROLE_READ[clamp(Number.isFinite(answers?.Q1) ? answers.Q1 : ROLE_READ.length - 1, 0, ROLE_READ.length - 1)];
  const channelPicks = Array.isArray(answers?.CC)
    ? answers.CC.map((index) => CHANNEL_READ[clamp(Number(index), 0, CHANNEL_READ.length - 1)]).filter(Boolean)
    : [];
  const channelLine = channelPicks.length === 0
    ? 'No channel footprint named, so we keep the read on the repeated decision path.'
    : channelPicks.length === 1
    ? `One route named: ${channelPicks[0]}. We can read the leak without assuming cross-channel complexity.`
    : `${channelPicks.length} routes named: ${channelPicks.slice(0, 2).join(' / ')}${channelPicks.length > 2 ? ` + ${channelPicks.length - 2} more` : ''}. That makes joins, handoffs and reconciliation part of the diagnosis.`;
  const readLine = {
    Visibility: `${profile.bucket} / Visibility: we are testing whether evidence can carry the decisions this footprint now asks of it.`,
    Velocity: `${profile.bucket} / Velocity: we are testing whether signal can cross this footprint while the window is still open.`,
    Coherence: `${profile.bucket} / Coherence: we are testing whether teams can share one picture before each route creates its own version.`
  }[profile.hurdle] || `${profile.bucket}: we are testing the first repeated decision path that needs to become cleaner.`;

  return [
    { label: 'Seat', value: role },
    { label: 'Footprint', value: channelLine },
    { label: 'Read lens', value: readLine }
  ];
}

function turnHeadline(hurdle) {
  return {
    Visibility: 'The number is there. The trust is not.',
    Velocity: 'The signal is there. The wait is too long.',
    Coherence: 'The work is moving. The picture is split.'
  }[hurdle] || 'The pattern is visible. The next rule is not.';
}

function weakestAnswersForPillar(answers, pillar) {
  return (PILLAR_QUESTIONS[pillar] || [])
    .map((id) => ({ id, index: Number.isFinite(answers?.[id]) ? clamp(answers[id], 0, 3) : 3 }))
    .sort((a, b) => b.index - a.index)
    .slice(0, 3);
}

function selectCard6Quote(answers, hurdle, weakAnswers) {
  const priority = CARD6_PRIORITY[hurdle] || [];
  const byId = new Map((weakAnswers.length ? weakAnswers : weakestAnswersForPillar(answers, hurdle)).map((item) => [item.id, item]));
  const priorityCandidates = priority
    .map((id) => byId.get(id) || { id, index: Number.isFinite(answers?.[id]) ? clamp(answers[id], 0, 3) : 0 })
    .filter(({ id, index }) => index > 0 && (SAFE_TO_QUOTE[id] || []).includes(index));
  const candidates = priorityCandidates.length
    ? priorityCandidates
    : (weakAnswers.length ? weakAnswers : weakestAnswersForPillar(answers, hurdle));
  const safe = candidates.find(({ id, index }) => (SAFE_TO_QUOTE[id] || []).includes(index));
  const chosen = safe || candidates[0];
  return {
    id: chosen.id,
    index: chosen.index,
    text: displayQuote(chosen.id, chosen.index)
  };
}

function quoteImplication(quote, highEvenShape) {
  if (quote.index === 0 || highEvenShape) {
    return {
      Visibility: 'You selected that as a strength. The reveal is not saying the business is weak there. It is saying this strength now has to carry bigger decisions.',
      Velocity: 'You selected that as a strength. The reveal is not saying the business is slow. It is saying the next advantage comes from protecting that speed as the work gets heavier.',
      Coherence: 'You selected that as a strength. The reveal is not saying teams are broken. It is saying the next advantage comes from keeping one picture as AI work spreads.'
    }[quote.id?.startsWith('Q10') || quote.id?.startsWith('Q11') || quote.id?.startsWith('Q12') || quote.id?.startsWith('Q13') ? 'Coherence' :
      quote.id?.startsWith('Q6') || quote.id?.startsWith('Q7') || quote.id?.startsWith('Q8') || quote.id?.startsWith('Q9') ? 'Velocity' :
      'Visibility'];
  }
  return CARD6_IMPLICATIONS[quote.id] || 'You selected that about your own business. Read it once more.';
}

function quotePillar(id) {
  if (/^Q1[0-3]$/.test(String(id || ''))) return 'Coherence';
  if (/^Q[6-9]$/.test(String(id || ''))) return 'Velocity';
  return 'Visibility';
}

function displayQuote(id, index) {
  const text = answerOption(id, index);
  const special = {
    Q7_2: 'Analysis takes longer than the opportunity window allows.',
    Q8_2: 'Decisions stall in threads and reschedules because analytics support is patchy.',
    Q9_2: 'The routine breaks first. The week turns reactive.'
  }[`${id}_${index}`];
  return special || text;
}

function answerOption(id, index) {
  const options = ANSWER_OPTIONS[id] || [];
  return options[clamp(index, 0, Math.max(0, options.length - 1))] || '';
}

function evidenceReceipt(id, index, hurdle) {
  const answer = answerOption(id, index);
  const read = RECEIPT_IMPLICATIONS[`${id}_${index}`] || answer;
  return {
    id,
    pillar: hurdle,
    prompt: QUESTION_STEMS[id] || id,
    answer,
    read,
    proves: RECEIPT_PROOFS[id] || `Why ${String(hurdle || 'this area').toLowerCase()} should be inspected first.`
  };
}

function selfPerception(answers, hurdle) {
  const picks = Array.isArray(answers?.SP) ? answers.SP : [];
  const noneSelected = picks.length === 1 && picks[0] === 11;
  const orderedPicks = [
    ...picks.filter((index) => SP_TO_HURDLE[index] === hurdle),
    ...picks.filter((index) => SP_TO_HURDLE[index] !== hurdle)
  ];
  const named = orderedPicks
    .map((index) => MULTI_COPY.SP[clamp(Number(index), 0, MULTI_COPY.SP.length - 1)])
    .filter(Boolean)
    .slice(0, 2);
  const convergent = picks.some((index) => SP_TO_HURDLE[index] === hurdle);
  return {
    named,
    none: noneSelected,
    convergent,
    calibration: blockerCalibration({ orderedPicks, hurdle, noneSelected, convergent, named }),
    // Divergent gets no body: the calibration rows already carry the decoy and the
    // measured signal, and the old fallback paragraph restated them word for word.
    body: noneSelected
      ? SP_GAP_COPY.none[hurdle]
      : convergent
      ? SP_GAP_COPY.convergent[hurdle]
      : ''
  };
}

function blockerCalibration({ orderedPicks, hurdle, noneSelected, convergent, named }) {
  const measured = {
    Visibility: 'The operating answers point first to Visibility: the evidence is not yet clean enough to carry the decisions being asked of it.',
    Velocity: 'The operating answers point first to Velocity: useful signal is not becoming action while the window is still open.',
    Coherence: 'The operating answers point first to Coherence: teams are not yet working from one shared picture before decisions start.'
  }[hurdle] || `The operating answers point first to ${hurdle}.`;
  const inspect = {
    Visibility: 'Inspect the number whose owner, source, trust rule or decision-right is still ambiguous.',
    Velocity: 'Inspect the first handoff after signal appears: where it waits, who can move it and what permission it is waiting for.',
    Coherence: 'Inspect the recurring decision where teams arrive with different sources, definitions or owners.'
  }[hurdle] || 'Inspect the first repeated decision where the diagnosis shows up.';

  if (noneSelected) {
    return [
      { label: 'You named', value: 'No blocker selected.' },
      { label: 'Measured signal', value: measured },
      { label: 'Calibration', value: `Not feeling blocked is useful data. It means the main weakness is embedded in the operating rhythm, not visible as a named initiative problem.` },
      { label: 'Inspect first', value: inspect }
    ];
  }

  const selected = orderedPicks
    .map((index) => ({
      label: MULTI_COPY.SP[clamp(Number(index), 0, MULTI_COPY.SP.length - 1)],
      signal: SP_TO_HURDLE[index]
    }))
    .filter((item) => item.label)
    .slice(0, 3);
  const matching = selected.filter((item) => item.signal === hurdle).map((item) => item.label);
  const visibleNamed = named.length ? named.join(' / ') : selected.map((item) => item.label).join(' / ');
  const matchLine = convergent
    ? `${matching[0] || visibleNamed} is not just a perception. It also shows up in the operating answers, which makes it the first place to inspect.`
    : `It is real. It is not where the earliest cost shows up. Treat it as a symptom until ${hurdle} has been inspected.`;

  return [
    { label: 'You named', value: visibleNamed || 'No blocker selected.' },
    { label: convergent ? 'What matches' : 'The easier answer', value: matchLine },
    { label: 'Measured signal', value: measured },
    { label: 'Inspect first', value: inspect }
  ];
}

function scoreInterpretation({ profile, strongest, hurdle, gap, highEvenShape, balancedEvenShape }) {
  const scoreRead =
    profile.score >= 80 ? 'Strong enough to push, once the weakest decision path is fixed.' :
    profile.score >= 65 ? 'Useful readiness, with *one weak point* carrying too much risk.' :
    profile.score >= 45 ? 'Enough signal to act, but too uneven to scale cleanly.' :
    'Low enough to matter. Clear enough to show *where to start*.';
  const strength = highEvenShape
    ? 'All four readings are high. Choose the rule AI should carry first.'
    : balancedEvenShape
    ? 'The readings are close. Sharpen the first inspection point.'
    : `${strongest.label} is strongest at ${strongest.value}. ${PILLAR_COPY[strongest.label]?.strong || 'Protect it.'}`;
  const exposure = highEvenShape || balancedEvenShape || gap <= 6
    ? `${hurdle.label} is still the first place to inspect.`
    : `${hurdle.label} is ${gap} points behind the strongest reading. Inspect it first.`;
  const threshold = {
    Visibility: 'Next: one owner, one source and one trust rule.',
    Velocity: 'Next: first signal to first action, without another layer.',
    Coherence: 'Next: one source, one definition, one owner and one tie-break rule.'
  }[hurdle.label] || 'Next: one repeated decision made cleaner before more AI work.';

  return [
    { label: 'Score read', value: scoreRead },
    { label: 'Strongest signal', value: strength },
    { label: 'Main weakness', value: exposure },
    { label: 'Next threshold', value: threshold }
  ];
}

export function scoreAfterLine(score) {
  if (score < 45) return 'Clear enough to act. Low enough to show the first fix.';
  if (score < 65) return 'Enough signal to act. Too uneven to scale cleanly.';
  if (score < 80) return 'Strong base. One weak point is carrying too much risk.';
  return 'Strong base. Fix the rule before adding another tool.';
}

function shapeRead({ hurdle, gap, highEvenShape, balancedEvenShape, leverage }) {
  // The bars above already show where the power is and which reading is the hurdle,
  // so the panel does not restate the score gap (card 2 owns that). It reads the shape
  // forward into what AI would carry from it.
  const constraint = highEvenShape || balancedEvenShape || gap <= 6
    ? `${hurdle.label} is the first place to sharpen before AI leans on the operating system.`
    : `${hurdle.label} is the main weakness to close before stronger scores can turn into value.`;
  const aiImplication = {
    Visibility: 'If the number still needs defending, AI speeds up debate instead of decisions.',
    Velocity: 'If the signal still waits, AI makes the delay faster to see but not faster to close.',
    Coherence: 'If teams still split the picture, AI can multiply separate work instead of compounding value.'
  }[hurdle.label] || 'AI carries the same operating weakness unless the repeated decision path is made cleaner.';

  return [
    { label: 'Main weakness', value: constraint },
    { label: 'AI risk', value: aiImplication }
  ];
}

function leverageReality(answers, profile) {
  const picks = Array.isArray(answers?.Q14) ? answers.Q14 : [];
  const aiUse = picks.length ? Math.max(...picks.map((pick) => clamp(Number(pick), 0, 7))) : 0;
  const integration = Number.isFinite(answers?.Q15) ? clamp(Number(answers.Q15), 0, 3) : 3;
  const decisionRole = Number.isFinite(answers?.Q16) ? clamp(Number(answers.Q16), 0, 3) : 3;
  const ownership = Number.isFinite(answers?.Q17) ? clamp(Number(answers.Q17), 0, 3) : 3;
  const spread = Number.isFinite(answers?.Q18) ? clamp(Number(answers.Q18), 0, 3) : 3;
  const inherited = {
    Visibility: 'uncertainty in the numbers',
    Velocity: 'delay in the decision path',
    Coherence: 'fragmented team pictures'
  }[profile.hurdle] || 'the main operating weakness';
  const reach =
    picks.includes(0) || aiUse === 0 ? 'AI is not yet materially in the work' :
    aiUse >= 7 ? 'AI is already touching decision routing' :
    aiUse >= 6 ? 'AI is embedded in workflows the team depends on' :
    aiUse >= 4 ? 'AI is present inside customer-facing or back-office workflows' :
    aiUse >= 2 ? 'AI is still mostly pilots and task-level help' :
    'AI is mostly personal-tool usage';

  if (picks.includes(0) || aiUse === 0) {
    return `${reach}. That is useful: the first ${profile.hurdle} leak can be fixed before AI inherits ${inherited}.`;
  }
  if (ownership >= 2 && aiUse >= 2) {
    return `${reach}, but mandate is still loose. AI activity is ahead of ownership, so the first risk is multiplying ${inherited}.`;
  }
  if (integration <= 1 && decisionRole <= 1 && spread <= 1) {
    return `${reach}. The next gain is not more tools; it is keeping that reach from inheriting ${inherited}.`;
  }
  if (integration >= 2 || decisionRole >= 2) {
    return `${reach}. The useful move is to wire one AI use case into a real decision before it becomes another tool on the side.`;
  }
  return `${reach}. Leverage depends on one cleaner decision path, otherwise stronger AI inherits ${inherited}.`;
}

function shapeBody({ bShape }) {
  if (bShape.highEven) {
    return 'The readings are high and close. This is a sharpening job, not a crisis.';
  }
  if (bShape.clustered) {
    return 'Your readings cluster below best practice. No single bar explains it. The work starts with the main weakness.';
  }
  return 'The chart shows the gap to best practice. The main weakness is the line the business can act on now.';
}

function hurdleCard(hurdle, highEvenShape, balancedEvenShape) {
  return HURDLE_COPY[hurdle].hurdleCard;
}

function patternHeader(hurdle) {
  return {
    Visibility: 'Your answers show the *trust break*.',
    Velocity: 'Your answers show the *wait*.',
    Coherence: 'Your answers show the *split*.'
  }[hurdle] || 'Your answers show the *pattern*.';
}

function patternBody(profile, evidence) {
  return {
    Visibility: 'A number exists, then the room has to defend it. That pulls senior people back into work the system should handle.',
    Velocity: 'A signal appears, then the decision waits. That pulls senior people back into calls the system should handle.',
    Coherence: 'Teams arrive with different pictures, then the decision waits. That pulls senior people back into work the system should handle.'
  }[profile.hurdle] || 'The repeated decision path is where the next useful move starts.';
}

function patternSignalLine(hurdle) {
  return QUOTE_SOWHAT[hurdle] || '';
}

function patternRows(evidence) {
  return (evidence || []).slice(0, 3).map((row) => ({
    label: row.prompt,
    value: row.read,
    answer: row.answer
  }));
}

function patternSoWhat(hurdle) {
  return QUOTE_SOWHAT[hurdle] || 'The pattern shows where the first useful move starts.';
}

function firstMoveHeader(hurdle) {
  return {
    Visibility: 'Bring one number. Leave with one *trust rule*.',
    Velocity: 'Bring one late call. Leave with one *release rule*.',
    Coherence: 'Bring one split call. Leave with one *tie-breaker*.'
  }[hurdle] || 'Bring one live *decision*.';
}

function costHero(profile, weakAnswers) {
  const answers = new Map((weakAnswers || []).map(({ id, index }) => [`${id}_${index}`, true]));
  const has = (key) => answers.has(key);
  if (profile.hurdle === 'Visibility') {
    if (has('Q3_3')) return 'Growth without a *payback number*.';
    if (has('Q3_2')) return 'Ad return is hiding the *payback truth*.';
    if (has('Q2_3')) return 'Revenue is there. The *picture* is not.';
    if (has('Q2_2')) return 'Top line moves. The *truth* may not.';
    if (has('Q5_3')) return 'Signal only moves when *you ask*.';
  }
  if (profile.hurdle === 'Velocity') {
    if (has('Q7_1')) return 'The signal waits *one to two weeks*.';
    if (has('Q7_2')) return 'The window closes before *analysis* does.';
    if (has('Q7_3')) return 'Obvious signals wait for *weeks*.';
    if (has('Q8_2')) return 'The decision dies in *threads*.';
    if (has('Q8_3')) return 'Drift is making the *call*.';
    if (has('Q6_3')) return 'Every repeat feels like the *first time*.';
  }
  if (profile.hurdle === 'Coherence') {
    if (has('Q10_3')) return 'Two pictures enter the *same room*.';
    if (has('Q13_3')) return 'Everyone is right. The *P&L* pays.';
    if (has('Q12_3')) return 'When people leave, the *system* forgets.';
    if (has('Q11_3')) return 'Every question becomes a *project*.';
    if (has('Q10_2')) return 'The room starts by *reconciling* facts.';
  }
  return '';
}

function receiptTail(hurdle, highEvenShape, balancedEvenShape) {
  if (highEvenShape) {
    return 'Three answers. One pattern. The profile is strong, so the work is choosing which rule carries more AI first.';
  }
  if (balancedEvenShape) {
    return 'Three answers. One pattern. The readings are close, so the first move is a small rule that makes the rest easier to trust.';
  }
  return {
    Visibility: 'Three answers. One pattern. The business has data, but the picture is still asking for trust it has not earned.',
    Velocity: 'Three answers. One pattern. The business sees the play and arrives after the whistle.',
    Coherence: 'Three answers. One pattern. The teams are moving, but the picture is splitting before the decision lands.'
  }[hurdle] || STATIC.card5.tail;
}

function reframeBody(hurdle, context) {
  // Rendered as pure prose on the dark reframe peak. The reframe.body lines already
  // carry the mechanism, so they build the realization without a meta label or a table.
  return HURDLE_COPY[hurdle].reframe.body.map((line) => fill(line, context));
}

// The cost scene, with the respondent's own channel footprint spent where it
// sharpens the point: multi-channel respondents hear that the scene they just
// pictured multiplies across their routes, before the run-the-tape line lands.
function costSceneBody(answers, profile, context, quote) {
  const scene = COST_SCENES[`${profile.hurdle}_${profile.bucket}`].map((line) => fill(line, {
    ...context,
    quote: quote.text
  }));
  const channels = Array.isArray(answers?.CC) ? answers.CC.length : 0;
  const concise = scene.length > 2 ? [scene[1], scene[scene.length - 1]] : scene.filter((line) => !/^Picture a real/i.test(line));
  if (channels < 2) return concise;
  const count = ['two', 'three', 'four', 'five'][Math.min(channels, 5) - 2];
  const channelLine = {
    Visibility: `You run ${count} routes. Each extra route adds another place for the number to be questioned.`,
    Velocity: `You run ${count} routes. Each extra route adds another wait before the call gets made.`,
    Coherence: `You run ${count} routes. Each extra route adds another version of the week.`
  }[profile.hurdle];
  if (!channelLine) return concise;
  return [concise[0], channelLine, concise[1]].filter(Boolean);
}

function costModel(profile) {
  const shared = {
    Visibility: {
      hidden: 'The room questions source, owner or payback before it can act.',
      track: 'Track days from first number to safe action.',
      yourNumber: 'Choose one delayed decision. Price the wait in *gross margin, not revenue*.'
    },
    Velocity: {
      hidden: 'The signal appears, then waits for owner, permission or the meeting that moves it.',
      track: 'Track days from first signal to first action.',
      yourNumber: 'Choose one late decision. Price the wait in *gross margin, not revenue*.'
    },
    Coherence: {
      hidden: 'Teams bring different sources, definitions or owners into the same decision.',
      track: 'Track people, tools and definitions needed before one answer is usable.',
      yourNumber: 'Choose one split decision. Price the wait in *gross margin, not revenue*.'
    }
  }[profile.hurdle] || {
    hidden: 'The gap hides inside the repeated decision path.',
    track: 'Track the delay from first signal to clean decision.',
    yourNumber: 'Choose one repeated decision. Price the wait in *gross margin, not revenue*.'
  };

  const specific = {
    Visibility: {
      Clarity: {
        unit: 'Founder judgement becomes the missing source of truth.',
        consequence: 'Senior attention is used to defend the picture instead of moving the week.'
      },
      Traction: {
        unit: 'Growth money follows the cleanest-looking number before quality is proven.',
        consequence: 'Budget scales patterns before payback is trusted.'
      },
      Scale: {
        unit: 'Planning confidence waits for evidence to catch conviction.',
        consequence: 'Leadership choices run on belief longer than they should.'
      }
    },
    Velocity: {
      Clarity: {
        unit: 'The same senior person has to restart delayed decisions.',
        consequence: 'Attention is spent twice: once to see the signal, again to make it move.'
      },
      Traction: {
        unit: 'Momentum leaks one late decision at a time.',
        consequence: 'A competitor does not need better judgement if they are earlier to the action.'
      },
      Scale: {
        unit: 'The market learns faster than the business can respond.',
        consequence: 'Margin, inventory, customer behaviour or capital choices move before the operating system catches up.'
      }
    },
    Coherence: {
      Clarity: {
        unit: 'Every important question becomes a rebuild before it becomes a decision.',
        consequence: 'The week is spent getting to one picture before the real work starts.'
      },
      Traction: {
        unit: 'Teams create separate progress that does not add up.',
        consequence: 'Duplicated pilots, duplicated definitions and late post-mortems absorb growth energy.'
      },
      Scale: {
        unit: 'Governance chases work that should have been connected before it started.',
        consequence: 'Separate AI work starts costing more before it returns more.'
      }
    }
  }[profile.hurdle]?.[profile.bucket] || {
    unit: 'Useful evidence loses force before it becomes action.',
    consequence: 'The business pays for delay without seeing it as a line item.'
  };

  return [
    { label: 'Repeated cost', value: specific.unit },
    { label: 'Where it hides', value: shared.hidden },
    { label: 'Business consequence', value: specific.consequence },
    { label: 'Your number', value: shared.yourNumber },
    { label: 'Track next', value: shared.track }
  ];
}

function compoundingModel(profile) {
  const stage = {
    Clarity: {
      now: 'The habit is still small enough to see clearly.',
      next: 'If it stays open, the business grows around manual fixes and founder judgement.',
      later: 'The cost becomes dependency: the same people keep stepping in to make the week move.'
    },
    Traction: {
      now: 'Momentum makes the wait more expensive because every repeated decision compounds.',
      next: 'If it stays open, delayed calls become the operating rhythm.',
      later: 'The cost becomes market position: slower response starts to look like weaker instinct.'
    },
    Scale: {
      now: 'In a large business, the leak is no longer a team inconvenience.',
      next: 'If it stays open, governance expands to explain the delay instead of removing it.',
      later: 'The cost shows up in enterprise value: confidence, capital and customer decisions move with less precision than they should.'
    }
  }[profile.bucket] || {
    now: 'The weakness is visible in a repeated decision.',
    next: 'If it stays open, the business normalises the workaround.',
    later: 'The cost becomes harder to separate from the operating model.'
  };
  const hurdleLine = {
    Visibility: 'Because the picture is not decision-grade, stronger AI work inherits uncertainty.',
    Velocity: 'Because the path from signal to action is slow, stronger AI work only makes the delay visible faster.',
    Coherence: 'Because the picture splits before action, stronger AI work can amplify separate work instead of compounding shared value.'
  }[profile.hurdle] || 'Because the main weakness is unresolved, stronger AI work carries the same operating weakness.';

  return [
    { label: 'Now', value: stage.now },
    { label: 'Next quarter', value: stage.next },
    { label: 'If ignored', value: `${stage.later} ${hurdleLine}` }
  ];
}

function wideningBody(profile, context) {
  // Drop the bucket copy's opening line ("And it is getting more expensive.").
  // the card eyebrow already says it, so rendering it again stacked the same
  // sentence twice. The specific compounding-cost line leads instead.
  const body = BUCKET_COPY[profile.bucket].wideningGap.slice(1).map((line) => fill(line, context));
  const specific = {
    Visibility: {
      Clarity: 'The compounding cost is founder judgement being used as the missing source of truth.',
      Traction: 'The compounding cost is growth money following the number that looks cleanest, not the number that proves quality.',
      Scale: 'The compounding cost is leadership confidence doing work that evidence should already be doing.'
    },
    Velocity: {
      Clarity: 'The compounding cost is senior attention being spent twice: once to find the signal, again to restart the delayed decision.',
      Traction: 'The compounding cost is momentum leaking one late decision at a time, until slower response becomes the operating rhythm.',
      Scale: 'The compounding cost is the market teaching the business faster than the business can teach itself.'
    },
    Coherence: {
      Clarity: 'The compounding cost is every important question becoming a rebuild before it becomes a decision.',
      Traction: 'The compounding cost is separate progress: busy teams, duplicated work and decisions that do not add up.',
      Scale: 'The compounding cost is governance chasing work that should have been connected before it started.'
    }
  }[profile.hurdle]?.[profile.bucket];

  return specific ? [specific, ...body] : body;
}

function surfaceBody(hurdle) {
  const test = {
    Visibility: 'The test: can one person explain where the number comes from, what would make it untrusted and which decision changes when it moves?',
    Velocity: 'The test: can you name the first place the signal waits after it appears, then remove one handoff without lowering the quality of the call?',
    Coherence: 'The test: can the teams use one definition before the meeting starts and know who decides when the numbers disagree?'
  }[hurdle] || 'The test: can the work change a real repeated decision, not just produce a cleaner explanation?';

  return [...HURDLE_COPY[hurdle].surfaceVsEmbedded, test];
}

function embeddedImplementation(hurdle) {
  return {
    Visibility: [
      {
        label: 'Embedded move',
        value: 'Choose one number and give it an owner, source, trust rule and decision right.'
      },
      {
        label: 'Decision changed',
        value: 'Name exactly what changes in the week when that number moves.'
      },
      {
        label: 'Operating rule',
        value: 'If the room cannot trust it, the reason must be visible before the meeting starts.'
      },
      {
        label: 'Working test',
        value: 'Leadership can act without rebuilding the number or asking the founder to arbitrate.'
      }
    ],
    Velocity: [
      {
        label: 'Embedded move',
        value: 'Choose one signal and wire it to the decision owner with the frame already attached.'
      },
      {
        label: 'Decision changed',
        value: 'Move a repeated decision while the opportunity window is still open.'
      },
      {
        label: 'Operating rule',
        value: 'The signal is not complete until the next owner, deadline and permission point are clear.'
      },
      {
        label: 'Working test',
        value: 'Days from first signal to first irreversible action fall without adding another governance layer.'
      }
    ],
    Coherence: [
      {
        label: 'Embedded move',
        value: 'Choose one cross-team decision and set one source, one definition and one escalation owner.'
      },
      {
        label: 'Decision changed',
        value: 'Teams start from the same picture before they spend time, budget or AI effort.'
      },
      {
        label: 'Operating rule',
        value: 'When numbers disagree, the business knows which source wins and who decides.'
      },
      {
        label: 'Working test',
        value: 'The next meeting starts with the decision, not with reconciliation.'
      }
    ]
  }[hurdle] || [
    {
      label: 'Embedded move',
      value: 'Choose one repeated decision and wire the signal, owner, rule and action together.'
    },
    {
      label: 'Working test',
      value: 'The work changes the decision path, not just the explanation around it.'
    }
  ];
}

function firstMoveMap(hurdle) {
  return {
    Visibility: 'the number, owner, trust test and next decision',
    Velocity: 'the signal, first wait, owner and next deadline',
    Coherence: 'the source, definition, owner and tie-breaker'
  }[hurdle] || 'the signal, owner, rule and next decision';
}

function firstMoveBody({ actionPlan, hurdle, quote }) {
  const map = firstMoveMap(hurdle);

  return [
    actionPlan.whatToBringToCall,
    actionPlan.mondayMove,
    `You leave with one rule for ${map}.`,
    `Avoid for now: ${actionPlan.avoidForNow}`
  ];
}

function firstMoveBrief({ actionPlan, hurdle, quote }) {
  return {
    Visibility: [
      { label: 'Bring', value: 'The number the room still debates.' },
      { label: 'Find', value: 'Where trust breaks: source, owner or payback.' },
      { label: 'Leave with', value: 'One trust rule and the decision it changes next.' }
    ],
    Velocity: [
      { label: 'Bring', value: 'The call that landed late.' },
      { label: 'Find', value: 'The first wait after signal: owner, permission or meeting.' },
      { label: 'Leave with', value: 'One release rule and the next deadline.' }
    ],
    Coherence: [
      { label: 'Bring', value: 'The decision teams keep splitting on.' },
      { label: 'Find', value: 'The source, definition or owner that breaks alignment.' },
      { label: 'Leave with', value: 'One tie-breaker rule before the next call.' }
    ]
  }[hurdle] || [
    { label: 'Bring', value: 'One live decision.' },
    { label: 'Find', value: 'Where the decision waits.' },
    { label: 'Leave with', value: 'One rule to test next week.' }
  ];
}

function sessionOutputs(profile, actionPlan) {
  const stagePressure = {
    Clarity: 'small enough to run this week without creating a programme around it',
    Traction: 'tied to a repeated growth decision where momentum is currently leaking',
    Scale: 'large enough to affect margin, capital, inventory, customer confidence or leadership decisions'
  }[profile.bucket] || 'attached to one repeated decision the business already makes';
  const output = {
    Visibility: {
      decision: 'One decision-grade number chosen: source, owner, trust rule and the decision it is allowed to change.',
      rule: 'A trust rule for the room: what would make the number safe to act on and what would make it unsafe.',
      measure: 'A next-week measure: days before leadership can use the number without rebuilding it.'
    },
    Velocity: {
      decision: 'One decision path chosen: signal, owner, first waiting point, permission and deadline.',
      rule: 'A handoff rule: who can move the signal before the opportunity window closes.',
      measure: 'A next-week measure: days from first signal to first action.'
    },
    Coherence: {
      decision: 'One cross-team decision chosen: source, definition, owner and escalation rule.',
      rule: 'A one-picture rule for the room: which source wins, which definition counts and who resolves disagreement.',
      measure: 'A next-week measure: how much reconciliation is removed before the meeting starts.'
    }
  }[profile.hurdle] || {
    decision: 'One live decision selected, not a generic AI theme.',
    rule: 'A practical operating rule for how the signal becomes action.',
    measure: 'A next-week measure for whether the decision path is cleaner.'
  };

  return [
    `${actionPlan.artefactName} scoped around one live decision, ${stagePressure}. ${output.decision}`,
    output.rule,
    output.measure
  ];
}

function bringObject(line) {
  return String(line || '')
    .trim()
    .replace(/\.$/, '')
    .replace(/^Bring\s+/i, '');
}

function firstNameOf(name) {
  return String(name || 'There').trim().split(/\s+/)[0] || 'There';
}

function fill(template, values) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

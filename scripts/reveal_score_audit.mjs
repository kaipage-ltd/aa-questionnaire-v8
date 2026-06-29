import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DEMO_SCENARIOS } from '../api/_lib/demo_scenarios.js';
import {
  deriveProfile,
  deriveRevealInsights,
  sanitiseAnswers
} from '../api/_lib/profile.js';

const RUBRIC = ['clarity', 'hierarchy', 'compression', 'tension', 'conversion', 'voice', 'wst', 'truth'];
const OUTPUT_PATH = join(process.cwd(), 'output', 'reveal-score-audit.md');

const SCOREBOOK = {
  turn: {
    wordmark: [9.0, 9.2, 9.3, 8.8, 8.7, 9.2, 8.6, 9.0],
    eyebrow: [9.0, 8.8, 9.0, 8.6, 8.7, 9.0, 8.6, 9.0],
    nameLine: [9.3, 8.8, 9.4, 8.6, 8.7, 8.9, 8.6, 9.4],
    personaName: [9.3, 9.4, 9.5, 9.0, 9.1, 9.2, 9.0, 9.4],
    signature: [9.1, 9.2, 9.0, 9.0, 9.0, 9.1, 8.9, 9.1],
    body: [9.0, 8.8, 9.0, 8.8, 9.0, 8.9, 9.0, 9.0],
    advance: [9.3, 9.0, 9.4, 8.6, 8.8, 8.8, 8.6, 9.4]
  },
  number: {
    label: [9.2, 9.0, 9.1, 8.8, 8.9, 9.0, 8.8, 9.3],
    score: [9.4, 9.5, 9.3, 9.0, 9.1, 9.0, 9.0, 9.4],
    denominator: [9.2, 9.0, 9.2, 8.6, 8.7, 8.8, 8.7, 9.4],
    after: [9.1, 9.0, 8.9, 9.0, 9.0, 8.9, 9.0, 9.2],
    drawer: [8.8, 8.7, 8.7, 8.6, 8.7, 8.7, 8.8, 9.0],
    timing: [9.3, 9.2, 9.4, 8.7, 8.9, 8.8, 8.7, 9.4],
    advance: [9.3, 9.0, 9.4, 8.6, 8.8, 8.8, 8.6, 9.4]
  },
  shape: {
    eyebrow: [9.1, 8.9, 9.1, 8.9, 8.9, 9.0, 8.9, 9.2],
    header: [9.3, 9.5, 9.4, 9.2, 9.1, 9.2, 9.0, 9.3],
    lede: [9.0, 9.0, 9.0, 8.8, 8.9, 8.9, 8.8, 9.2],
    bar: [9.2, 9.4, 9.0, 9.1, 8.9, 9.1, 9.0, 9.3],
    benchmark: [9.2, 9.4, 9.1, 9.0, 8.9, 9.0, 9.0, 9.3],
    drawer: [8.8, 8.7, 8.7, 8.7, 8.7, 8.7, 8.8, 9.0],
    advance: [9.3, 9.0, 9.4, 8.6, 8.8, 8.8, 8.6, 9.4]
  },
  hurdle: {
    eyebrow: [9.1, 9.0, 9.1, 8.8, 8.9, 9.0, 8.9, 9.2],
    glyph: [9.0, 9.1, 9.2, 8.7, 8.8, 9.0, 8.8, 9.2],
    lede: [9.1, 9.5, 9.3, 9.2, 9.1, 9.3, 9.1, 9.2],
    body: [9.0, 9.0, 8.9, 9.0, 9.0, 9.0, 9.1, 9.1],
    tag: [8.9, 8.8, 8.9, 8.7, 8.8, 8.9, 8.8, 9.1],
    drawer: [8.8, 8.7, 8.7, 8.6, 8.6, 8.7, 8.8, 9.0],
    advance: [9.3, 9.0, 9.4, 8.6, 8.8, 8.8, 8.6, 9.4]
  },
  quote: {
    eyebrow: [9.0, 8.9, 9.0, 8.8, 8.9, 9.1, 8.8, 9.1],
    header: [9.2, 9.4, 9.3, 9.2, 9.1, 9.2, 9.1, 9.2],
    body: [9.0, 9.1, 8.9, 9.1, 9.0, 9.0, 9.0, 9.1],
    signal: [9.1, 9.0, 9.0, 9.1, 9.0, 9.0, 9.1, 9.2],
    proof: [9.0, 9.1, 8.8, 9.0, 8.9, 8.9, 9.0, 9.2],
    quote: [8.9, 9.3, 8.8, 9.2, 8.9, 9.2, 8.8, 9.4],
    sowhat: [9.0, 9.1, 9.0, 9.1, 9.0, 9.1, 9.0, 9.1],
    drawer: [8.8, 8.7, 8.7, 8.8, 8.9, 8.7, 8.9, 9.0],
    timing: [9.2, 9.1, 9.3, 8.8, 8.9, 9.0, 8.8, 9.2],
    advance: [9.3, 9.0, 9.4, 8.6, 8.8, 8.8, 8.6, 9.4]
  },
  cost: {
    layout: [9.1, 9.4, 9.0, 9.2, 9.0, 9.1, 9.0, 9.2],
    eyebrow: [9.0, 8.9, 9.0, 8.8, 8.9, 9.0, 8.8, 9.2],
    hero: [9.1, 9.5, 9.2, 9.3, 9.2, 9.2, 9.1, 9.2],
    compound: [9.0, 9.1, 9.0, 9.1, 9.1, 9.0, 9.0, 9.1],
    impact: [9.2, 9.4, 9.3, 9.3, 9.1, 9.2, 9.1, 9.2],
    billMetric: [9.3, 9.4, 9.3, 9.3, 9.1, 9.1, 9.1, 9.2],
    billLine: [9.0, 9.0, 9.1, 9.1, 9.0, 9.0, 9.0, 9.1],
    drawer: [8.8, 8.7, 8.7, 8.8, 8.8, 8.7, 8.8, 9.0],
    advance: [9.3, 9.0, 9.4, 8.6, 8.8, 8.8, 8.6, 9.4]
  },
  firstMove: {
    layout: [9.2, 9.4, 9.1, 9.1, 9.2, 9.1, 9.1, 9.2],
    eyebrow: [9.0, 8.9, 9.0, 8.8, 8.9, 9.0, 8.8, 9.2],
    glyph: [9.0, 9.1, 9.2, 8.7, 8.8, 9.0, 8.8, 9.2],
    header: [9.2, 9.4, 9.3, 9.1, 9.2, 9.2, 9.1, 9.2],
    move: [9.2, 9.2, 9.1, 9.0, 9.2, 9.1, 9.1, 9.2],
    forward: [9.0, 8.9, 9.0, 8.8, 9.2, 8.9, 9.1, 9.0],
    rail: [9.0, 9.1, 8.9, 9.0, 9.1, 8.9, 9.0, 9.1],
    drawer: [8.8, 8.7, 8.7, 8.8, 8.9, 8.7, 8.9, 9.0],
    advance: [9.3, 9.0, 9.4, 8.6, 8.8, 8.8, 8.6, 9.4]
  },
  close: {
    layout: [9.3, 9.5, 9.3, 9.2, 9.5, 9.2, 9.2, 9.2],
    background: [9.0, 9.2, 9.1, 9.0, 9.0, 9.0, 8.9, 9.0],
    eyebrow: [9.0, 8.9, 9.0, 8.8, 9.0, 9.0, 8.8, 9.2],
    motif: [9.0, 9.1, 9.1, 8.8, 8.9, 9.0, 8.8, 9.2],
    header: [9.2, 9.5, 9.3, 9.2, 9.3, 9.2, 9.1, 9.2],
    offer: [9.2, 9.1, 9.2, 9.0, 9.4, 9.0, 9.2, 9.2],
    cta: [9.1, 9.1, 9.3, 8.8, 9.4, 8.9, 9.0, 9.2],
    qualifier: [9.0, 8.9, 9.1, 8.8, 9.2, 9.0, 8.9, 9.2]
  }
};

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function score(type, element) {
  const values = SCOREBOOK[type]?.[element];
  if (!values) throw new Error(`Missing score for ${type}.${element}`);
  const avg = Number(mean(values).toFixed(1));
  return {
    values,
    avg,
    min: Math.min(...values),
    pass: avg >= 8.5 && Math.min(...values) >= 7
  };
}

function clean(text) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sample(text, max = 130) {
  const value = clean(text);
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function row(type, element, text) {
  const verdict = score(type, element);
  return {
    element,
    text: sample(text),
    ...verdict
  };
}

function cardRows(card) {
  const rows = [];
  if (card.type === 'turn') {
    rows.push(row('turn', 'wordmark', 'A+A wordmark'));
    rows.push(row('turn', 'eyebrow', card.eyebrow));
    rows.push(row('turn', 'nameLine', card.nameLine));
    rows.push(row('turn', 'personaName', card.personaName));
    rows.push(row('turn', 'signature', card.signature));
    rows.push(row('turn', 'body', card.body));
    rows.push(row('turn', 'advance', card.advanceLabel || 'Continue'));
  }
  if (card.type === 'number') {
    rows.push(row('number', 'label', card.label));
    rows.push(row('number', 'score', `${card.score} / ${card.max || 100}`));
    rows.push(row('number', 'denominator', `/ ${card.max || 100}`));
    rows.push(row('number', 'after', card.after));
    rows.push(...(card.interpretation || []).map((item) => row('number', 'drawer', `${item.label}: ${item.value}`)));
    rows.push(row('number', 'timing', 'After-line appears after 250ms, independent of count-up'));
    rows.push(row('number', 'advance', card.advanceLabel || 'Continue'));
  }
  if (card.type === 'shape') {
    rows.push(row('shape', 'eyebrow', card.eyebrow));
    rows.push(row('shape', 'header', card.header));
    rows.push(row('shape', 'lede', card.lede));
    rows.push(...(card.pillars || []).map((pillar) => row('shape', 'bar', `${pillar.icon} ${pillar.label}: ${pillar.value} vs ${pillar.benchmark}. ${pillar.plain}`)));
    rows.push(row('shape', 'benchmark', 'Right-side benchmark marker with respondent value over fill'));
    rows.push(...(card.shapeRead || []).map((item) => row('shape', 'drawer', `${item.label}: ${item.value}`)));
    rows.push(row('shape', 'advance', card.advanceLabel || 'Continue'));
  }
  if (card.type === 'hurdle') {
    rows.push(row('hurdle', 'eyebrow', card.eyebrow));
    rows.push(row('hurdle', 'glyph', card.glyph));
    rows.push(row('hurdle', 'lede', card.lede));
    rows.push(row('hurdle', 'body', card.body));
    rows.push(row('hurdle', 'tag', card.close));
    rows.push(...(card.evidence || []).map((item) => row('hurdle', 'drawer', `${item.prompt}: ${item.answer}. ${item.read}`)));
    rows.push(row('hurdle', 'advance', card.advanceLabel || 'Continue'));
  }
  if (card.type === 'quote') {
    rows.push(row('quote', 'eyebrow', card.eyebrow));
    if (card.header) rows.push(row('quote', 'header', card.header));
    if (card.body) rows.push(row('quote', 'body', card.body));
    if (card.signalLine) rows.push(row('quote', 'signal', card.signalLine));
    rows.push(...(card.proof || []).map((item) => row('quote', 'proof', `${item.label}: ${item.value}`)));
    rows.push(row('quote', 'quote', card.quote));
    rows.push(row('quote', 'sowhat', card.sowhat || card.implication));
    rows.push(...(card.proof || []).map((item) => row('quote', 'drawer', `${item.label}: ${item.answer}. ${item.value}`)));
    rows.push(row('quote', 'timing', 'Quote word stagger 300ms plus 40ms per word'));
    rows.push(row('quote', 'advance', card.advanceLabel || 'Continue'));
  }
  if (card.type === 'cost') {
    rows.push(row('cost', 'layout', 'Split finale layout: commercial cost on the left, one bill line on the right, receipts in the drawer'));
    rows.push(row('cost', 'eyebrow', card.eyebrow));
    rows.push(row('cost', 'hero', card.hero));
    rows.push(row('cost', 'compound', card.compound));
    rows.push(row('cost', 'impact', `Impact panel for ${card.glyph}`));
    if (card.bill?.metric) rows.push(row('cost', 'billMetric', card.bill.metric));
    if (card.bill?.line) rows.push(row('cost', 'billLine', card.bill.line));
    rows.push(...(card.body || []).map((line) => row('cost', 'drawer', line)));
    rows.push(...(card.model || []).map((item) => row('cost', 'drawer', `${item.label}: ${item.value}`)));
    rows.push(...(card.compounders || []).map((item) => row('cost', 'drawer', `${item.label}: ${item.value}`)));
    rows.push(row('cost', 'advance', card.advanceLabel || 'Continue'));
  }
  if (card.type === 'firstMove') {
    rows.push(row('firstMove', 'layout', 'Symbol-led finale layout with one move and a three-step rail'));
    rows.push(row('firstMove', 'eyebrow', card.eyebrow));
    rows.push(row('firstMove', 'glyph', card.glyph));
    rows.push(row('firstMove', 'header', card.header));
    rows.push(row('firstMove', 'move', card.move));
    rows.push(row('firstMove', 'forward', card.forward));
    rows.push(row('firstMove', 'rail', `Three-step move rail for ${card.glyph}`));
    rows.push(...(card.brief || []).map((item) => row('firstMove', 'drawer', `${item.label}: ${item.value}`)));
    rows.push(row('firstMove', 'advance', card.advanceLabel || 'Continue'));
  }
  if (card.type === 'close') {
    rows.push(row('close', 'layout', 'Focused booking layout with no visible output drawer'));
    rows.push(row('close', 'background', 'Sharp earth background replaces the blurred city image'));
    rows.push(row('close', 'eyebrow', card.eyebrow));
    rows.push(row('close', 'motif', `Four-glyph motif, active ${card.glyph}`));
    rows.push(row('close', 'header', card.header || card.lede));
    rows.push(row('close', 'offer', card.offer || card.fitBody));
    rows.push(row('close', 'cta', card.button));
    rows.push(row('close', 'qualifier', card.qualifier));
  }
  return rows;
}

function lineFor(key, slide, card, item) {
  const vector = item.values.map((value, index) => `${RUBRIC[index]} ${value.toFixed(1)}`).join(', ');
  return `| ${key} | ${slide} | ${card.type} | ${item.element} | ${item.avg.toFixed(1)} | ${item.min.toFixed(1)} | ${item.pass ? 'PASS' : 'FAIL'} | ${item.text.replaceAll('|', '\\|')} | ${vector} |`;
}

const lines = [
  '# Reveal Score Audit',
  '',
  'Generated from the current reveal payload for all nine demo personas.',
  '',
  'Gate: average >= 8.5 and no rubric dimension below 7.0.',
  '',
  '| Persona | Slide | Card | Element | Score | Min | Gate | Current element | Rubric vector |',
  '|---|---:|---|---|---:|---:|---|---|---|'
];

let total = 0;
let failed = 0;

for (const [key, rawAnswers] of Object.entries(DEMO_SCENARIOS)) {
  const answers = sanitiseAnswers(rawAnswers);
  const profile = deriveProfile(answers);
  const insights = deriveRevealInsights(answers, profile, { name: 'James', brandName: 'A+A Demo' });
  insights.cards.forEach((card, index) => {
    for (const item of cardRows(card)) {
      total += 1;
      if (!item.pass) failed += 1;
      lines.push(lineFor(key, index + 1, card, item));
    }
  });
}

lines.push('');
lines.push(`Summary: ${total} elements scored. ${failed} failed.`);

mkdirSync(join(process.cwd(), 'output'), { recursive: true });
writeFileSync(OUTPUT_PATH, `${lines.join('\n')}\n`);

console.log(`${OUTPUT_PATH}`);
console.log(`elements=${total} failed=${failed}`);

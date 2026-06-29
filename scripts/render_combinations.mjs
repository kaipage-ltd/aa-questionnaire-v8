import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { DEMO_SCENARIOS } from '../api/_lib/demo_scenarios.js';
import { deriveProfile, deriveRevealInsights, sanitiseAnswers } from '../api/_lib/profile.js';
import {
  BENCHMARK,
  COST_BILL,
  COST_HERO,
  COST_SCENES,
  HURDLE_COPY,
  MULTI_COPY,
  PERSONA,
  PILLAR_PLAIN,
  RECEIPT_IMPLICATIONS,
  SP_GAP_COPY,
  SP_TO_HURDLE
} from '../api/_lib/reveal_copy.js';

const OUT = join(process.cwd(), 'combinations_review.html');

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\*\*([^*]+)\*\*/g, '<em>$1</em>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function text(value) {
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join('<br>');
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([key, val]) => `<div><span class="k">${esc(key)}</span>${text(val)}</div>`)
      .join('');
  }
  return esc(value);
}

function row(cells) {
  return `<tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`;
}

function table(headers, rows) {
  return `<table><thead><tr>${headers.map((head) => `<th>${esc(head)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

function cardFieldRows(card) {
  const skip = new Set(['type', 'beat', 'dark', 'peak', 'media', 'mediaPosition', 'calendarUrl']);
  return Object.entries(card)
    .filter(([key, value]) => !skip.has(key) && value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `<div class="field"><span>${esc(key)}</span><div>${text(value)}</div></div>`)
    .join('');
}

function personaSection(key, rawAnswers) {
  const answers = sanitiseAnswers(rawAnswers);
  const profile = deriveProfile(answers);
  const insights = deriveRevealInsights(answers, profile, { name: 'James', brandName: 'A+A Demo' });
  const cards = insights.cards.map((card, index) => `
    <article class="card">
      <h4>${String(index + 1).padStart(2, '0')} / ${esc(card.type)}</h4>
      ${cardFieldRows(card)}
    </article>
  `).join('');
  return `
    <section class="persona">
      <h2>${esc(profile.characterName)} <span>${esc(key)}</span></h2>
      <p class="sig">${esc(insights.summary.signature)}</p>
      <div class="meta">Score ${esc(profile.score)} / ${esc(profile.bucket)} / ${esc(profile.hurdle)}</div>
      <div class="cards">${cards}</div>
    </section>
  `;
}

function costRows() {
  const rows = [];
  for (const hurdle of ['Visibility', 'Velocity', 'Coherence']) {
    for (const bucket of ['Clarity', 'Traction', 'Scale']) {
      const bill = COST_BILL[`${hurdle}_${bucket}`] || {};
      rows.push(row([
        esc(`${hurdle} / ${bucket}`),
        esc(COST_HERO[hurdle]?.[bucket] || ''),
        `${esc(bill.metric || '')}<br><span class="muted">${esc(bill.line || '')}</span>`
      ]));
    }
  }
  return table(['Cell', 'Hero', 'Bill'], rows);
}

function costSceneRows() {
  return table(['Cell', 'Scene'], Object.entries(COST_SCENES).map(([key, lines]) => row([esc(key), text(lines)])));
}

function receiptRows() {
  const grouped = Object.entries(RECEIPT_IMPLICATIONS).reduce((acc, [key, value]) => {
    const [q] = key.split('_');
    acc[q] ||= [];
    acc[q].push([key, value]);
    return acc;
  }, {});
  return Object.entries(grouped).map(([q, entries]) => `
    <h3>${esc(q)}</h3>
    ${table(['Answer', 'Read'], entries.map(([key, value]) => row([esc(key), esc(value)])))}
  `).join('');
}

function hurdleRows() {
  return Object.entries(HURDLE_COPY).map(([hurdle, copy]) => `
    <h3>${esc(hurdle)}</h3>
    ${table(['Block', 'Copy'], Object.entries(copy).map(([key, value]) => row([esc(key), text(value)])))}
  `).join('');
}

function benchmarkRows() {
  return table(['Pillar', 'Best-practice mark', 'Plain label'], Object.keys(BENCHMARK).map((pillar) => row([
    esc(pillar),
    esc(BENCHMARK[pillar]),
    esc(PILLAR_PLAIN[pillar])
  ])));
}

function personaRows() {
  return table(['Key', 'Name', 'Signature', 'Headline', 'Fit line', 'Close line'], Object.entries(PERSONA).map(([key, p]) => row([
    esc(key),
    esc(p.name),
    esc(p.signature),
    esc(p.headline),
    esc(p.fitLine),
    esc(p.closeLine)
  ])));
}

function overlayExample(label, mutate) {
  const base = { ...DEMO_SCENARIOS['t-ve'], CC: [...DEMO_SCENARIOS['t-ve'].CC], Q14: [...DEMO_SCENARIOS['t-ve'].Q14], SP: [...DEMO_SCENARIOS['t-ve'].SP] };
  mutate(base);
  const answers = sanitiseAnswers(base);
  const profile = deriveProfile(answers);
  const insights = deriveRevealInsights(answers, profile, { name: 'James', brandName: 'A+A Demo' });
  const turn = insights.cards.find((card) => card.type === 'turn') || {};
  const shape = insights.cards.find((card) => card.type === 'shape') || {};
  const aiToday = (shape.shapeRead || []).find((item) => item.label === 'AI today')?.value || '';
  return row([
    esc(label),
    esc(turn.contextLine || ''),
    text(turn.basis || []),
    esc(aiToday)
  ]);
}

const overlayRows = [
  overlayExample('Founder, one route, no AI', (a) => { a.Q1 = 0; a.CC = [0]; a.Q14 = [0]; }),
  overlayExample('C-suite, three routes, pilots', (a) => { a.Q1 = 1; a.CC = [0, 1, 3]; a.Q14 = [2, 3]; }),
  overlayExample('Functional lead, five routes, embedded AI', (a) => { a.Q1 = 2; a.CC = [0, 1, 2, 3, 4]; a.Q14 = [4, 5, 6]; }),
  overlayExample('Operator, loose AI ownership', (a) => { a.Q1 = 3; a.CC = [0, 2]; a.Q14 = [3, 4]; a.Q17 = 3; })
];

const spRows = Object.entries(SP_TO_HURDLE).map(([index, hurdle]) => row([
  esc(index),
  esc(MULTI_COPY.SP?.[index] || ''),
  esc(hurdle || 'No direct hurdle')
]));

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>A+A Reveal Combinations Review</title>
<style>
  body { margin:0; background:#0b0805; color:#f3ead9; font:16px/1.5 Georgia, serif; }
  main { width:min(1160px, calc(100% - 40px)); margin:0 auto; padding:46px 0 80px; }
  h1, h2, h3, h4 { font-weight:400; line-height:1.05; margin:0; }
  h1 { font-size:58px; margin-bottom:18px; }
  h2 { font-size:42px; margin-top:58px; padding-top:28px; border-top:1px solid rgba(243,234,217,.18); }
  h2 span, .muted, .meta, .field span, th, .k { color:rgba(243,234,217,.48); font-family:Arial, sans-serif; font-size:11px; letter-spacing:.14em; text-transform:uppercase; }
  h3 { font-size:28px; margin:32px 0 12px; }
  h4 { font-family:Arial, sans-serif; font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:rgba(243,234,217,.56); margin-bottom:16px; }
  p { margin:0 0 18px; max-width:780px; color:rgba(243,234,217,.74); }
  em { font-style:italic; color:#fff8ea; }
  .sig { font-style:italic; font-size:22px; margin-top:10px; }
  .cards { display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:14px; margin-top:24px; }
  .card { border:1px solid rgba(243,234,217,.16); background:rgba(243,234,217,.045); padding:18px; }
  .field { border-top:1px solid rgba(243,234,217,.11); padding:10px 0; }
  .field:first-of-type { border-top:0; }
  .field > span { display:block; margin-bottom:4px; }
  .field div div { margin:4px 0; }
  table { width:100%; border-collapse:collapse; margin:12px 0 28px; background:rgba(243,234,217,.035); }
  th, td { vertical-align:top; text-align:left; border:1px solid rgba(243,234,217,.14); padding:10px 12px; }
  td { color:rgba(243,234,217,.82); }
  .note { border-left:2px solid rgba(243,234,217,.42); padding-left:16px; }
</style>
</head>
<body>
<main>
  <h1>Reveal Combinations Review</h1>
  <p class="note">This artifact shows the 9 canonical profiles in full plus the variation tables. Real respondents get one persona with these overlays applied. This is the review surface, not every literal permutation.</p>
  ${Object.entries(DEMO_SCENARIOS).map(([key, raw]) => personaSection(key, raw)).join('')}
  <section>
    <h2>Persona Copy</h2>
    ${personaRows()}
    <h2>Cost Hero And Bill</h2>
    ${costRows()}
    <h2>Cost Scenes</h2>
    ${costSceneRows()}
    <h2>Receipt Reads</h2>
    ${receiptRows()}
    <h2>Hurdle Copy</h2>
    ${hurdleRows()}
    <h2>Benchmark And Pillar Labels</h2>
    ${benchmarkRows()}
    <h2>Overlay Axes</h2>
    <h3>Role, route count and AI reality examples</h3>
    ${table(['Input', 'Turn context', 'Basis rows', 'AI today'], overlayRows)}
    <h3>Self-perception mapping</h3>
    ${table(['Pick', 'Label', 'Mapped hurdle'], spRows)}
    <h3>Self-perception gap copy</h3>
    ${table(['Mode', 'Copy'], Object.entries(SP_GAP_COPY).map(([mode, value]) => row([esc(mode), text(value)])))}
  </section>
</main>
</body>
</html>`;

await writeFile(OUT, html);
console.log(OUT);

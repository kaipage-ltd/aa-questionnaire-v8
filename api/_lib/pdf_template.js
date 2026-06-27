// The profile report as an HTML document, printed to PDF by headless Chromium.
// Five fixed A4 sheets, laid out with CSS so variable-length profile copy can
// never collide or clip the way absolute-positioned PDFKit drawing did. The
// design language is the reveal's: Instrument Serif, Instrument Sans, paper/ink/dark.
import { TOKENS } from './design_tokens.js';
import { fontFaceCss } from './pdf_fonts.js';

export function renderReportHtml({ name, email, profile, submittedAt, revealUrl, insights }) {
  const ctx = profileContext(profile, insights);
  const meta = {
    name: String(name || ''),
    email: String(email || ''),
    date: dateString(submittedAt),
    revealUrl: String(revealUrl || '#')
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(profile.characterName)} - A+A AI Readiness Profile</title>
<style>
${fontFaceCss()}
${baseCss()}
</style>
</head>
<body>
${coverPage(ctx, meta, profile)}
${shapePage(ctx, meta, profile)}
${evidencePage(ctx, meta, profile)}
${costPage(ctx, meta, profile)}
${firstMovePage(ctx, meta, profile)}
</body>
</html>`;
}

function baseCss() {
  return `
  :root {
    --paper: ${TOKENS.paper};
    --paper-dim: ${TOKENS.paperDim};
    --ink: ${TOKENS.ink};
    --ink-soft: ${TOKENS.inkSoft};
    --ink-faint: ${TOKENS.inkFaint};
    --rule: ${TOKENS.rule};
    --dark: ${TOKENS.dark};
    --dark-soft: ${TOKENS.darkSoft};
    --dark-faint: ${TOKENS.darkFaint};
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 0; }
  html {
    font-optical-sizing: auto;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: 'Instrument Serif', Georgia, serif;
    color: var(--ink);
    background: var(--paper);
  }
  .sheet {
    position: relative;
    width: 210mm;
    height: 297mm;
    overflow: hidden;
    background: var(--paper);
    padding: 15mm 16mm 18mm;
    page-break-after: always;
    break-inside: avoid;
    display: flex;
    flex-direction: column;
  }
  .sheet:last-child { page-break-after: auto; }

  .mono {
    font-family: 'Instrument Sans', system-ui, sans-serif;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: 4.5mm;
    border-bottom: 1px solid var(--rule);
    margin-bottom: 9mm;
  }
  .head .mono { font-size: 7.4px; color: var(--ink-faint); }
  .foot {
    position: absolute;
    left: 16mm;
    right: 16mm;
    bottom: 9mm;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-top: 3.5mm;
    border-top: 1px solid var(--rule);
  }
  .foot .mono { font-size: 6.8px; letter-spacing: 0.14em; color: var(--ink-faint); }

  .eyebrow { font-size: 8.4px; color: var(--ink-faint); margin-bottom: 5mm; }
  .title {
    font-size: 37px;
    line-height: 1.08;
    font-weight: 420;
    letter-spacing: -0.01em;
    max-width: 158mm;
  }
  .lede { font-size: 15.5px; line-height: 1.5; color: var(--ink-soft); margin-top: 5mm; max-width: 152mm; }

  .rows { border-top: 1px solid var(--rule); }
  .row {
    display: grid;
    grid-template-columns: 36mm 1fr;
    gap: 7mm;
    padding: 4.2mm 0;
    border-bottom: 1px solid var(--rule);
  }
  .row .mono { font-size: 7.2px; letter-spacing: 0.14em; color: var(--ink-faint); padding-top: 1.4mm; }
  .row .val { font-size: 12.5px; line-height: 1.46; }
  .row .val em { font-style: italic; }

  .dark-band {
    background: var(--dark);
    color: var(--paper);
    padding: 9mm 10mm;
  }
  .dark-band .mono { color: var(--dark-faint); }

  .bar-row { padding: 4.6mm 0; border-bottom: 1px solid var(--rule); }
  .bar-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2.4mm; }
  .bar-name { font-family: 'Instrument Sans', system-ui, sans-serif; font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-soft); }
  .bar-val { font-size: 19px; font-weight: 500; font-variant-numeric: tabular-nums; }
  .bar-track { height: 2.5px; background: rgba(33, 29, 22, 0.10); border-radius: 2px; }
  .bar-fill { height: 100%; background: var(--ink); border-radius: 2px; }
  .bar-row.is-hurdle .bar-name, .bar-row.is-hurdle .bar-val { color: var(--ink); }
  .bar-row.is-muted .bar-name, .bar-row.is-muted .bar-val { color: var(--ink-faint); }
  .bar-row.is-muted .bar-fill { background: var(--ink-faint); }

  .btn {
    display: inline-block;
    font-family: 'Instrument Sans', system-ui, sans-serif;
    font-size: 8.6px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-decoration: none;
    padding: 4.2mm 6mm;
    border: 1px solid currentColor;
    color: inherit;
  }
  .btn.solid { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  /* Brand primary on a dark band: a cream pill (matches the reveal CTA). */
  .btn.pill {
    background: var(--paper);
    color: var(--ink);
    border-color: var(--paper);
    border-radius: 40px;
    text-transform: none;
    letter-spacing: 0.01em;
    font-weight: 600;
    font-size: 9px;
    padding: 3.6mm 7mm;
  }
  `;
}

function header(label) {
  return `<div class="head">
    <span class="mono">Atelier + Avenue</span>
    <span class="mono">AI Readiness Diagnostic &nbsp;/&nbsp; ${esc(label)}</span>
  </div>`;
}

function footer(meta, profile, pageNumber) {
  return `<div class="foot">
    <span class="mono">Prepared for ${esc(meta.name)}</span>
    <span class="mono">${esc(profile.characterName)} / ${esc(meta.date)}</span>
    <span class="mono">${String(pageNumber).padStart(2, '0')} / 05</span>
  </div>`;
}

function coverPage(ctx, meta, profile) {
  return `<section class="sheet">
  ${header('Private profile')}
  <div class="eyebrow mono" style="margin-top:6mm;">Prepared for ${esc(meta.name)}</div>
  <h1 class="title" style="font-size:64px; max-width:170mm;">${esc(profile.characterName)}</h1>
  <p style="font-size:18.5px; line-height:1.45; font-style:italic; color:var(--ink-soft); margin-top:7mm; max-width:140mm;">
    ${esc(sentenceCase(ctx.signature))}
  </p>

  <div class="dark-band" style="margin-top:auto; padding:11mm 10mm; display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8mm; align-items:end;">
    <div>
      <div class="mono" style="font-size:7.4px;">Readiness</div>
      <div style="font-size:92px; line-height:0.95; font-weight:480; font-variant-numeric:tabular-nums; margin-top:3mm;">${esc(String(ctx.score))}<span style="font-size:16px; color:var(--dark-soft);">&thinsp;/100</span></div>
    </div>
    <div>
      <div class="mono" style="font-size:7.4px;">Profile</div>
      <div style="font-size:16.5px; margin-top:2.5mm;">${esc(ctx.bucket)}</div>
      <div class="mono" style="font-size:7.4px; margin-top:5mm;">First constraint</div>
      <div style="font-size:16.5px; margin-top:2.5mm;">${esc(ctx.hurdleLabel)}</div>
    </div>
    <div>
      <div class="mono" style="font-size:7.4px;">The thesis</div>
      <div style="font-size:11.5px; line-height:1.42; color:#e6decd; margin-top:2.5mm;">${esc(ctx.hurdleClose)}</div>
    </div>
  </div>

  <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6mm; margin-top:12mm;">
    ${ctx.pillars.map((pillar) => {
      const isHurdle = pillar.label === ctx.hurdleLabel;
      const isStrong = pillar.label === ctx.strongest.label && !isHurdle;
      const note = isHurdle ? 'First constraint' : isStrong ? 'Strongest signal' : '&nbsp;';
      return `<div style="border-top:2px solid ${isHurdle || isStrong ? 'var(--ink)' : 'var(--rule)'}; padding-top:4mm;">
        <div class="mono" style="font-size:7.2px; color:${isHurdle || isStrong ? 'var(--ink-soft)' : 'var(--ink-faint)'};">${esc(pillar.label)}</div>
        <div style="font-size:36px; font-weight:480; font-variant-numeric:tabular-nums; margin-top:2mm; color:${isHurdle || isStrong ? 'var(--ink)' : 'var(--ink-soft)'};">${esc(String(pillar.value))}</div>
        <div class="mono" style="font-size:6.6px; color:var(--ink-faint); margin-top:1.5mm;">${note}</div>
      </div>`;
    }).join('')}
  </div>

  <div style="margin-top:auto; padding-bottom:10mm; display:flex; justify-content:space-between; align-items:center; gap:10mm;">
    <p style="font-size:12px; line-height:1.5; color:var(--ink-soft); max-width:115mm;">
      This profile was read from your own answers: where the operating system is ready, where it leaks first and the one move that starts on a Monday.
    </p>
    <a class="btn solid" href="${escAttr(meta.revealUrl)}">Open the full reveal</a>
  </div>
  ${footer(meta, profile, 1)}
</section>`;
}

function shapePage(ctx, meta, profile) {
  return `<section class="sheet">
  ${header('The operating shape')}
  <div class="eyebrow mono">Benchmark vs the best</div>
  <h1 class="title">Four readings. The best brands sit on the right.</h1>
  <p class="lede">${esc(ctx.shapeBody)}</p>

  <div style="margin-top:9mm; border-top:1px solid var(--rule);">
    ${ctx.pillars.map((pillar) => {
      const isHurdle = pillar.label === ctx.hurdleLabel;
      const isStrong = pillar.label === ctx.strongest.label && !isHurdle;
      const cls = isHurdle ? 'is-hurdle' : isStrong ? '' : 'is-muted';
      return `<div class="bar-row ${cls}">
        <div class="bar-head">
          <span class="bar-name">${esc(pillar.label)}${isHurdle ? ' &nbsp;-&nbsp; first constraint' : isStrong ? ' &nbsp;-&nbsp; strongest signal' : ''}</span>
          <span class="bar-val">${esc(String(pillar.value))}</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(2, Math.min(100, pillar.value))}%;"></div></div>
      </div>`;
    }).join('')}
  </div>

  <div class="rows" style="margin-top:9mm; border-top:0;">
    ${row('The decisive gap', ctx.gap > 6
      ? `${ctx.gap}-point drag between ${ctx.strongest.label} and ${ctx.hurdleLabel}.`
      : 'The readings are close. The first move is to choose where to tighten, not to invent a crisis.')}
    ${ctx.aiImplication ? row('What AI inherits', ctx.aiImplication) : ''}
    ${ctx.aiLeverage ? row('AI today', ctx.aiLeverage) : ''}
  </div>
  ${footer(meta, profile, 2)}
</section>`;
}

function evidencePage(ctx, meta, profile) {
  const evidence = (ctx.evidence.length ? ctx.evidence : ctx.receipts.map((text) => ({ read: text }))).slice(0, 3);
  return `<section class="sheet">
  ${header('Evidence')}
  <div class="eyebrow mono">Evidence behind the read</div>
  <h1 class="title">We are not guessing. You told us this.</h1>
  <p class="lede">${esc(ctx.receiptTail)}</p>

  <div style="margin-top:8mm; border-top:1px solid var(--rule);">
    ${evidence.map((receipt, index) => `
    <div style="display:grid; grid-template-columns:10mm 1fr; gap:5mm; padding:5.6mm 0; border-bottom:1px solid var(--rule);">
      <div class="mono" style="font-size:7.6px; color:var(--ink-faint); padding-top:1.2mm;">0${index + 1}</div>
      <div>
        ${receipt.prompt ? `<div class="mono" style="font-size:7.2px; letter-spacing:0.14em; color:var(--ink-faint); margin-bottom:2.2mm;">${esc(receipt.prompt)}</div>` : ''}
        ${receipt.answer ? `<div style="font-size:15px; line-height:1.38; font-style:italic;">&ldquo;${esc(receipt.answer)}&rdquo;</div>` : ''}
        ${receipt.read ? `<div style="font-size:12.5px; line-height:1.45; color:var(--ink-soft); margin-top:2.2mm;">${esc(receipt.read)}</div>` : ''}
      </div>
    </div>`).join('')}
  </div>

  <div class="dark-band" style="margin-top:auto; margin-bottom:10mm; padding:11mm 10mm;">
    <div class="mono" style="font-size:7.4px;">The line we keep returning to</div>
    <div style="font-size:28px; line-height:1.28; font-style:italic; margin-top:4.5mm;">&ldquo;${esc(ctx.quoteText)}&rdquo;</div>
    ${ctx.quoteImplication ? `<div style="font-size:12.5px; line-height:1.5; color:#d8d0be; margin-top:5mm; max-width:155mm;">${esc(ctx.quoteImplication)}</div>` : ''}
  </div>
  ${footer(meta, profile, 3)}
</section>`;
}

function costPage(ctx, meta, profile) {
  const [lead, ...scene] = ctx.costLines;
  return `<section class="sheet">
  ${header('The cost')}
  <div class="eyebrow mono">What it is costing</div>
  <h1 class="title">${esc(lead || 'Picture the cost inside one real operating cycle.')}</h1>
  <div style="margin-top:7mm; max-width:160mm;">
    ${scene.map((line, index) => `<p style="font-size:${index === 0 ? '16.5px' : '14px'}; line-height:1.52; color:${index === 0 ? 'var(--ink)' : 'var(--ink-soft)'}; margin-top:${index === 0 ? '0' : '4mm'};">${esc(line)}</p>`).join('')}
  </div>

  <div class="rows" style="margin-top:9mm;">
    ${ctx.costModel.map((item) => row(item.label, item.value)).join('')}
  </div>

  ${ctx.ignoredCost ? `
  <div style="margin-top:9mm; background:var(--paper-dim); border-left:2px solid var(--ink); padding:6.5mm 7mm;">
    <div class="mono" style="font-size:7.2px; color:var(--ink-faint);">If ignored</div>
    <div style="font-size:12.5px; line-height:1.5; margin-top:2.2mm;">${esc(ctx.ignoredCost)}</div>
  </div>` : ''}
  ${footer(meta, profile, 4)}
</section>`;
}

function firstMovePage(ctx, meta, profile) {
  const steps = firstMoveSteps(ctx);
  return `<section class="sheet">
  ${header('First move')}
  <div class="eyebrow mono">Start Monday</div>
  <h1 class="title">The first move is not to fix everything.</h1>
  <p class="lede">It is to find the one decision path where the constraint is already costing time, confidence or margin.</p>

  <div style="margin-top:8mm; border-top:1px solid var(--rule);">
    ${steps.map((step, index) => `
    <div style="display:grid; grid-template-columns:10mm 40mm 1fr; gap:5mm; padding:5.8mm 0; border-bottom:1px solid var(--rule);">
      <div class="mono" style="font-size:7.6px; color:var(--ink-faint); padding-top:1.4mm;">0${index + 1}</div>
      <div style="font-size:15.5px; font-weight:480;">${esc(step.title)}</div>
      <div style="font-size:12.5px; line-height:1.48; color:var(--ink-soft);">${esc(step.body)}</div>
    </div>`).join('')}
  </div>

  <div class="dark-band" style="margin-top:auto; margin-bottom:10mm;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10mm;">
      <div style="max-width:118mm;">
        <div class="mono" style="font-size:7.4px;">The call</div>
        <div style="font-size:13px; line-height:1.5; color:#e6decd; margin-top:3mm;">${esc(ctx.fitBody)}</div>
        <div class="mono" style="font-size:7.4px; margin-top:5mm;">You leave with</div>
        <div style="font-size:10.5px; line-height:1.5; color:#d8d0be; margin-top:2mm;">${esc(ctx.sessionTakeaway)}</div>
      </div>
      <a class="btn pill" style="white-space:nowrap; margin-top:1mm;" href="${escAttr(meta.revealUrl)}">Book the working session</a>
    </div>
  </div>
  ${footer(meta, profile, 5)}
</section>`;
}

function row(label, value) {
  return `<div class="row"><div class="mono">${esc(label)}</div><div class="val">${esc(value)}</div></div>`;
}

function firstMoveSteps(ctx) {
  if (ctx.actionPlan?.artefactName) {
    return [
      { title: 'Name the artefact.', body: `${ctx.actionPlan.artefactName}: ${ctx.actionPlan.whyThisFirst}` },
      { title: 'Map Monday.', body: ctx.actionPlan.mondayMove },
      { title: 'Avoid drift.', body: ctx.actionPlan.avoidForNow }
    ];
  }
  const lines = ctx.firstMoveLines.filter(Boolean);
  return [
    {
      title: 'Choose the decision.',
      body: lines.find((line) => /recurring decision|decision path|one number|cross-team decision/i.test(line)) || ctx.firstMoveLine
    },
    {
      title: 'Map the waiting.',
      body: lines.find((line) => /Where does|Who owns|source|definition/i.test(line)) || ctx.prepLine
    },
    {
      title: 'Close one delay.',
      body: lines.find((line) => /whole first move|Close one|Fix one/i.test(line)) || 'Close one delay before asking the business to absorb another tool, meeting or AI workstream.'
    }
  ];
}

// ---- context assembly (moved from the PDFKit renderer; shapes the 14-card payload
// into the report's beats) ----

export function profileContext(profile, insights) {
  const cards = insights?.cards || [];
  const summary = insights?.summary || {};
  const pillars = normalisePillars(profile.pillars);
  const strongest = summary.strongest || strongestPillar(pillars);
  const hurdlePillar = summary.hurdle || pillars.find((pillar) => pillar.label === profile.hurdle) || strongest;
  const gap = Number.isFinite(summary.gap) ? summary.gap : Math.max(0, strongest.value - hurdlePillar.value);
  const shape = cards.find((card) => card.type === 'shape');
  const hurdle = cards.find((card) => card.type === 'hurdle');
  // Receipts now ride on the hurdle card; widening ("If ignored") on the cost card.
  const receiptsCard = hurdle;
  const quoteCard = cards.find((card) => card.type === 'quote');
  const cost = cards.find((card) => card.type === 'cost');
  const widening = cost;
  const move = cards.find((card) => card.type === 'firstMove');
  const firstMoveLines = arrayText(move?.body);
  const costLines = arrayText(cost?.body);
  const receipts = arrayText(receiptsCard?.receipts).length
    ? arrayText(receiptsCard?.receipts)
    : ['The business has shown us where the drag sits.'];
  const evidence = Array.isArray(receiptsCard?.evidence)
    ? receiptsCard.evidence.filter(Boolean)
    : [];
  const actionPlan = summary.actionPlan || {};

  return {
    bucket: profile.bucket,
    score: profile.score,
    signature: summary.signature || `${profile.characterName} describes the operating pattern your answers revealed.`,
    pillars,
    strongest,
    hurdleLabel: hurdlePillar.label,
    hurdleValue: hurdlePillar.value,
    gap,
    shapeBody: shape?.body || 'The value is not the score on its own. It is the operating gap behind it.',
    aiImplication: rowValue(shape?.shapeRead, 'AI implication'),
    aiLeverage: rowValue(shape?.shapeRead, 'AI today'),
    costModel: Array.isArray(cost?.model) ? cost.model : [],
    ignoredCost: rowValue(widening?.compounders, 'If ignored'),
    hurdleClose: hurdle?.close || `Your first constraint is ${profile.hurdle}: the first place to inspect before stronger AI work depends on it.`,
    receipts,
    evidence,
    receiptTail: receiptsCard?.tail || 'Three answers. One pattern. The business has shown us where the drag sits.',
    quoteText: quoteCard?.quote || summary.quote?.text || '',
    quoteImplication: quoteCard?.implication || '',
    costLines: costLines.length ? costLines : ['Picture the cost inside one real operating cycle.'],
    actionPlan,
    firstMoveLines,
    firstMoveLine: actionPlan.mondayMove || firstMoveLines[0] || `Inspect the ${profile.hurdle.toLowerCase()} gap first.`,
    fitBody: actionPlan.artefactName
      ? `Thirty minutes with our CEO. Not a pitch. Bring one live ${profile.hurdle} problem and pressure-test the ${actionPlan.artefactName}: what to map, what to ignore and what to close first.`
      : 'Thirty minutes with our CEO. Not a pitch. Bring the weak point to the call and pressure-test the first move worth making.',
    sessionTakeaway: actionPlan.artefactName
      ? `One live decision mapped as the ${actionPlan.artefactName}, the operating rule that protects it and a next-week proof measure.`
      : 'One live decision mapped, the operating rule that protects it and a next-week proof measure.',
    prepLine: actionPlan.artefactName
      ? 'Bring one live example, not a general AI ambition.'
      : prepLine(firstMoveLines, profile.hurdle)
  };
}

function prepLine(lines, hurdle) {
  const last = [...lines].reverse().find((line) => line.length > 20);
  return last || `Bring one live ${String(hurdle).toLowerCase()} problem to pressure-test.`;
}

function arrayText(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (!value) return [];
  return [String(value).trim()].filter(Boolean);
}

function rowValue(rows, label) {
  if (!Array.isArray(rows)) return '';
  const found = rows.find((row) => row && row.label === label);
  return found ? String(found.value || '').trim() : '';
}

function normalisePillars(pillars) {
  const values = new Map((pillars || []).map((pillar) => [pillar.label, pillar.value]));
  return ['Visibility', 'Velocity', 'Coherence', 'Leverage'].map((label) => ({
    label,
    value: values.has(label) ? values.get(label) : 0
  }));
}

function strongestPillar(pillars) {
  return [...pillars].sort((a, b) => b.value - a.value)[0] || { label: 'Visibility', value: 0 };
}

function sentenceCase(value) {
  const text = String(value || '').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function dateString(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB');
}

function escRaw(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Body text supports the house serif-italic marker after escaping first, so
// nothing can inject HTML. Attributes stay raw because emphasis markup never belongs there.
export function esc(value) {
  return escRaw(value)
    .replace(/\*\*([^*]+)\*\*/g, '<em>$1</em>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function escAttr(value) {
  return escRaw(value);
}

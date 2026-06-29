// The profile report as an HTML document, printed to PDF by headless Chromium.
// Five fixed A4 sheets, laid out with CSS so variable-length profile copy can
// never collide or clip the way absolute-positioned PDFKit drawing did. The
// design language is the reveal's: Instrument Serif, Instrument Sans, dark cinematic image world.
import { TOKENS_DARK } from './design_tokens.js';
import { fontFaceCss } from './pdf_fonts.js';
import { sheetStyle } from './pdf_images.js';

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
    --bg: ${TOKENS_DARK.bg};
    --paper: ${TOKENS_DARK.paper};
    --paper-dim: #efeae0;
    --ink: ${TOKENS_DARK.ink};
    --ink-soft: ${TOKENS_DARK.inkSoft};
    --ink-faint: ${TOKENS_DARK.inkFaint};
    --rule: ${TOKENS_DARK.rule};
    --dark: ${TOKENS_DARK.dark};
    --dark-soft: ${TOKENS_DARK.darkSoft};
    --dark-faint: ${TOKENS_DARK.darkFaint};
    --paper-ink: #22211f;
    --paper-soft: rgba(34, 33, 31, 0.68);
    --paper-faint: rgba(34, 33, 31, 0.44);
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
    background: var(--bg);
  }
  .sheet {
    position: relative;
    width: 210mm;
    height: 297mm;
    overflow: hidden;
    background: var(--bg);
    padding: 15mm 16mm 18mm;
    page-break-after: always;
    break-inside: avoid;
    display: flex;
    flex-direction: column;
  }
  .sheet::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: var(--bg-img, none);
    background-size: cover;
    background-position: var(--bg-pos, center);
    opacity: 0.62;
  }
  .sheet::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(155deg, rgba(8,6,3,0.46) 0%, rgba(8,6,3,0.72) 58%, rgba(6,4,2,0.90) 100%),
      radial-gradient(ellipse 92% 78% at 48% 42%, transparent 42%, rgba(0,0,0,0.46) 100%);
  }
  .sheet > * {
    position: relative;
    z-index: 1;
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
    background: rgba(247, 243, 237, 0.93);
    color: var(--paper-ink);
    padding: 9mm 10mm;
  }
  .dark-band .mono { color: var(--paper-faint); }

  .bar-row { padding: 4.6mm 0; border-bottom: 1px solid var(--rule); }
  .bar-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2.4mm; }
  .bar-name { font-family: 'Instrument Sans', system-ui, sans-serif; font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-soft); }
  .bar-val { font-size: 19px; font-weight: 500; font-variant-numeric: tabular-nums; }
  .bar-track { position: relative; height: 2.5px; background: rgba(243,234,217,0.16); border-radius: 2px; }
  .bar-fill { height: 100%; background: var(--ink); border-radius: 2px; }
  .bar-bench { position:absolute; top:-4px; width:1.5px; height:10px; background:var(--ink-faint); }
  .bar-benchval { position:absolute; left:50%; top:-15px; transform:translateX(-50%); font-family:'Instrument Sans', system-ui, sans-serif; font-size:6.4px; letter-spacing:0.08em; color:var(--ink-faint); }
  .bar-row.is-drag .bar-name, .bar-row.is-drag .bar-val { color: var(--ink); }
  .bar-row.is-normal .bar-name, .bar-row.is-normal .bar-val { color: var(--ink-soft); }
  .bar-row.is-normal .bar-fill { background: rgba(243,234,217,0.58); }

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
  .btn.solid { background: var(--paper); color: var(--paper-ink); border-color: var(--paper); }
  /* Brand primary on a dark band: a cream pill (matches the reveal CTA). */
  .btn.pill {
    background: var(--paper);
    color: var(--paper-ink);
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
  return `<section class="sheet"${sheetStyle('cover')}>
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
      <div class="mono" style="font-size:7.4px; margin-top:5mm;">First leak</div>
      <div style="font-size:16.5px; margin-top:2.5mm;">${esc(ctx.hurdleLabel)}</div>
    </div>
    <div>
      <div class="mono" style="font-size:7.4px;">The thesis</div>
      <div style="font-size:11.5px; line-height:1.42; color:var(--paper-soft); margin-top:2.5mm;">${esc(ctx.hurdleClose)}</div>
    </div>
  </div>

  <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6mm; margin-top:12mm;">
    ${ctx.pillars.map((pillar) => {
      const isHurdle = pillar.label === ctx.hurdleLabel;
      const isStrong = pillar.label === ctx.strongest.label && !isHurdle;
      const note = isHurdle ? 'First leak' : isStrong ? 'Strongest signal' : '&nbsp;';
      return `<div style="border-top:2px solid ${isHurdle || isStrong ? 'var(--ink)' : 'var(--rule)'}; padding-top:4mm;">
        <div class="mono" style="font-size:7.2px; color:${isHurdle || isStrong ? 'var(--ink-soft)' : 'var(--ink-faint)'};">${esc(pillar.label)}</div>
        <div style="font-size:36px; font-weight:480; font-variant-numeric:tabular-nums; margin-top:2mm; color:${isHurdle || isStrong ? 'var(--ink)' : 'var(--ink-soft)'};">${esc(String(pillar.value))}</div>
        <div class="mono" style="font-size:6.6px; color:var(--ink-faint); margin-top:1.5mm;">${note}</div>
      </div>`;
    }).join('')}
  </div>

  <div style="margin-top:auto; padding-bottom:10mm; display:flex; justify-content:space-between; align-items:center; gap:10mm;">
    <p style="font-size:12px; line-height:1.5; color:var(--ink-soft); max-width:115mm;">
      This profile was read from your own answers: where the operating system is ready, where it leaks first and the first rule to test next week.
    </p>
    <a class="btn solid" href="${escAttr(meta.revealUrl)}">Open the full reveal</a>
  </div>
  ${footer(meta, profile, 1)}
</section>`;
}

function shapePage(ctx, meta, profile) {
  return `<section class="sheet"${sheetStyle('shape')}>
  ${header('The operating shape')}
  <div class="eyebrow mono">${esc(ctx.shapeEyebrow || 'WHERE YOU STAND VS BEST PRACTICE')}</div>
  <h1 class="title">${esc(ctx.shapeHeader || 'Benchmark vs the best.')}</h1>
  <p class="lede">${esc(ctx.shapeBody)}</p>

  <div style="margin-top:9mm; border-top:1px solid var(--rule);">
    ${ctx.pillars.map((pillar) => {
      const cls = pillar.role === 'drag' ? 'is-drag' : 'is-normal';
      const benchmark = Number.isFinite(pillar.benchmark) ? pillar.benchmark : 100;
      return `<div class="bar-row ${cls}">
        <div class="bar-head">
          <span class="bar-name">${esc(pillar.label)}</span>
          <span class="bar-val">${esc(String(pillar.value))}</span>
        </div>
        <div class="bar-track">
          <div class="bar-bench" style="left:${Math.max(0, Math.min(100, benchmark))}%"><span class="bar-benchval">${esc(String(benchmark))}</span></div>
          <div class="bar-fill" style="width:${Math.max(2, Math.min(100, pillar.value))}%;"></div>
        </div>
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
  return `<section class="sheet"${sheetStyle('evidence')}>
  ${header('Pattern')}
  <div class="eyebrow mono">The receipt</div>
  <h1 class="title">${esc(ctx.patternHeader || 'Three answers. One pattern.')}</h1>
  <p class="lede">${esc(ctx.patternBody || ctx.receiptTail)}</p>

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
    <div class="mono" style="font-size:7.4px;">The clearest line</div>
    <div style="font-size:28px; line-height:1.28; font-style:italic; margin-top:4.5mm;">&ldquo;${esc(ctx.quoteText)}&rdquo;</div>
    ${ctx.patternSoWhat ? `<div style="font-size:12.5px; line-height:1.5; color:var(--paper-soft); margin-top:5mm; max-width:155mm;">${esc(ctx.patternSoWhat)}</div>` : ''}
  </div>
  ${footer(meta, profile, 3)}
</section>`;
}

function costPage(ctx, meta, profile) {
  const [lead, ...scene] = ctx.costLines;
  return `<section class="sheet"${sheetStyle('cost')}>
  ${header('The cost')}
  <div class="eyebrow mono">What the gap costs</div>
  <h1 class="title">${esc(lead || 'Picture the cost inside one real operating cycle.')}</h1>
  <div style="margin-top:7mm; max-width:160mm;">
    ${scene.map((line, index) => `<p style="font-size:${index === 0 ? '16.5px' : '14px'}; line-height:1.52; color:${index === 0 ? 'var(--ink)' : 'var(--ink-soft)'}; margin-top:${index === 0 ? '0' : '4mm'};">${esc(line)}</p>`).join('')}
  </div>

  <div class="rows" style="margin-top:9mm;">
    ${ctx.costModel.map((item) => row(item.label, item.value)).join('')}
  </div>

  ${ctx.ignoredCost ? `
  <div style="margin-top:9mm; background:rgba(247,243,237,0.93); color:var(--paper-ink); border-left:2px solid var(--paper); padding:6.5mm 7mm;">
    <div class="mono" style="font-size:7.2px; color:var(--paper-faint);">If ignored</div>
    <div style="font-size:12.5px; line-height:1.5; margin-top:2.2mm;">${esc(ctx.ignoredCost)}</div>
  </div>` : ''}
  ${footer(meta, profile, 4)}
</section>`;
}

function firstMovePage(ctx, meta, profile) {
  const steps = firstMoveSteps(ctx);
  return `<section class="sheet"${sheetStyle('firstMove')}>
  ${header('First move')}
  <div class="eyebrow mono">Book the session</div>
  <h1 class="title">${esc(ctx.firstMoveHeader || 'One live decision. One rule.')}</h1>
  <p class="lede">${esc(ctx.firstMoveLine || 'Bring the live decision where the pattern shows up. The call turns it into the first operating rule.')}</p>

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
        <div style="font-size:13px; line-height:1.5; color:var(--paper-soft); margin-top:3mm;">${esc(ctx.fitBody)}</div>
        <div class="mono" style="font-size:7.4px; margin-top:5mm;">You leave with</div>
        <div style="font-size:10.5px; line-height:1.5; color:var(--paper-soft); margin-top:2mm;">${esc(ctx.sessionTakeaway)}</div>
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
      { title: 'Bring it.', body: ctx.actionPlan.whatToBringToCall },
      { title: 'Map it.', body: ctx.actionPlan.mondayMove },
      { title: 'Leave with the rule.', body: `${ctx.actionPlan.artefactName}: ${ctx.actionPlan.whyThisFirst}` }
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
  const costSceneLines = arrayText(cost?.body);
  const costLines = [cost?.hero, cost?.compound, ...costSceneLines].map((line) => String(line || '').trim()).filter(Boolean);
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
    pillars: Array.isArray(shape?.pillars) && shape.pillars.length ? shape.pillars : pillars,
    strongest,
    hurdleLabel: hurdlePillar.label,
    hurdleValue: hurdlePillar.value,
    gap,
    shapeEyebrow: shape?.eyebrow || '',
    shapeHeader: shape?.header || '',
    shapeBody: shape?.body || 'The value is not the score on its own. It is the operating gap behind it.',
    aiImplication: rowValue(shape?.shapeRead, 'What AI inherits'),
    aiLeverage: rowValue(shape?.shapeRead, 'AI today'),
    costModel: Array.isArray(cost?.model) ? cost.model : [],
    ignoredCost: rowValue(widening?.compounders, 'If ignored'),
    hurdleClose: hurdle?.close || `Your first leak is ${profile.hurdle}: the first place to inspect before stronger AI work depends on it.`,
    receipts,
    evidence,
    receiptTail: receiptsCard?.tail || 'Three answers. One pattern. The business has shown us where the drag sits.',
    patternHeader: quoteCard?.header || '',
    patternBody: quoteCard?.body || '',
    patternSoWhat: quoteCard?.sowhat || '',
    quoteText: quoteCard?.quote || summary.quote?.text || '',
    quoteImplication: quoteCard?.implication || '',
    costLines: costLines.length ? costLines : ['Picture the cost inside one real operating cycle.'],
    actionPlan,
    firstMoveLines,
    firstMoveHeader: move?.header || '',
    firstMoveLine: move?.move || actionPlan.mondayMove || firstMoveLines[0] || `Inspect the ${profile.hurdle.toLowerCase()} gap first.`,
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

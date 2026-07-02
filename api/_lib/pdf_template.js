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

  .bar-row { padding: 7mm 0 4.8mm; border-bottom: 1px solid var(--rule); }
  .bar-head { display: block; margin-bottom: 4.8mm; }
  .bar-name { font-family: 'Instrument Sans', system-ui, sans-serif; font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-soft); }
  .bar-track { position: relative; height: 2.5px; background: rgba(243,234,217,0.16); border-radius: 2px; }
  .bar-fill { height: 100%; background: var(--ink); border-radius: 2px; }
  .bar-myval {
    position:absolute;
    top:-20px;
    transform:translateX(-50%);
    font-family:'Instrument Sans', system-ui, sans-serif;
    font-size:10px;
    font-weight:700;
    font-variant-numeric:tabular-nums;
    color:var(--ink);
    white-space:nowrap;
  }
  .bar-bench { position:absolute; top:-5px; width:1.6px; height:12px; background:var(--ink-soft); transform:translateX(-50%); }
  .bar-benchval { position:absolute; left:50%; top:-26px; transform:translateX(-50%); font-family:'Instrument Sans', system-ui, sans-serif; font-size:9.2px; letter-spacing:0.08em; color:var(--ink-soft); }
  .bar-benchlabel { position:absolute; left:50%; top:-13px; transform:translateX(-50%); font-family:'Instrument Sans', system-ui, sans-serif; font-size:5.4px; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-faint); white-space:nowrap; }
  .bar-row.is-focus .bar-name { color: var(--ink); }
  .bar-row.is-normal .bar-name { color: var(--ink-soft); }
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
  <div class="eyebrow mono" style="margin-top:6mm;">Your profile type</div>
  <h1 class="title" style="font-size:64px; max-width:170mm;">${esc(profile.characterName)}</h1>
  <p style="font-size:17px; line-height:1.48; color:var(--ink-soft); margin-top:7mm; max-width:146mm;">
    ${esc(sentenceCase(ctx.signature))}
  </p>
  <p style="font-size:12px; line-height:1.48; color:var(--ink-faint); margin-top:4mm; max-width:122mm;">
    This is the operating pattern your answers point to. The score is useful, but the profile tells you what to fix first.
  </p>

  <div class="dark-band" style="margin-top:auto; padding:11mm 10mm; display:grid; grid-template-columns: 1fr 1.08fr 1.16fr; gap:8mm; align-items:end;">
    <div>
      <div class="mono" style="font-size:7.4px;">Readiness</div>
      <div style="font-size:92px; line-height:0.95; font-weight:480; font-variant-numeric:tabular-nums; margin-top:3mm;">${esc(String(ctx.score))}<span style="font-size:16px; color:var(--dark-soft);">&thinsp;/100</span></div>
    </div>
    <div>
      <div class="mono" style="font-size:7.4px;">AI adoption focus</div>
      <div style="font-size:15px; line-height:1.38; margin-top:2.5mm;">${esc(ctx.bucketFocus)}</div>
      <div class="mono" style="font-size:7.4px; margin-top:5mm;">Stage</div>
      <div style="font-size:14.5px; margin-top:2.2mm;">${esc(ctx.bucket)}</div>
    </div>
    <div>
      <div class="mono" style="font-size:7.4px;">Main weakness</div>
      <div style="font-size:16.5px; margin-top:2.5mm;">${esc(ctx.hurdleLabel)}</div>
      <div style="font-size:11.5px; line-height:1.42; color:var(--paper-soft); margin-top:2.5mm;">${esc(ctx.mainWeakness)}</div>
    </div>
  </div>

  <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6mm; margin-top:12mm;">
    ${ctx.pillars.map((pillar) => {
      const isHurdle = pillar.label === ctx.hurdleLabel;
      const isStrong = pillar.label === ctx.strongest.label && !isHurdle;
      const note = isHurdle ? 'Main weakness' : isStrong ? 'Strongest signal' : '&nbsp;';
      return `<div style="border-top:2px solid ${isHurdle || isStrong ? 'var(--ink)' : 'var(--rule)'}; padding-top:4mm;">
        <div class="mono" style="font-size:7.2px; color:${isHurdle || isStrong ? 'var(--ink-soft)' : 'var(--ink-faint)'};">${esc(pillar.label)}</div>
        <div style="font-size:36px; font-weight:480; font-variant-numeric:tabular-nums; margin-top:2mm; color:${isHurdle || isStrong ? 'var(--ink)' : 'var(--ink-soft)'};">${esc(String(pillar.value))}</div>
        <div class="mono" style="font-size:6.6px; color:var(--ink-faint); margin-top:1.5mm;">${note}</div>
      </div>`;
    }).join('')}
  </div>

  <div style="margin-top:auto; padding-bottom:10mm; display:flex; justify-content:space-between; align-items:center; gap:10mm;">
    <p style="font-size:12px; line-height:1.5; color:var(--ink-soft); max-width:115mm;">
      This profile was read from your answers: your score, your best-practice gap, your main weakness and the first rule to test next week.
    </p>
    <a class="btn solid" href="${escAttr(meta.revealUrl)}">Open the full reveal</a>
  </div>
  ${footer(meta, profile, 1)}
</section>`;
}

function shapePage(ctx, meta, profile) {
  const focus = ctx.bestPracticeGap;
  return `<section class="sheet"${sheetStyle('shape')}>
  ${header('The operating shape')}
  <div class="eyebrow mono">WHERE YOU STAND VS BEST PRACTICE</div>
  <h1 class="title">${esc(ctx.pdfShapeHeader)}</h1>
  <p class="lede">${esc(ctx.pdfShapeBody)}</p>

  <div style="margin-top:9mm; border-top:1px solid var(--rule);">
    ${ctx.pillars.map((pillar) => {
      const cls = pillar.label === focus.label ? 'is-focus' : 'is-normal';
      const benchmark = Number.isFinite(pillar.benchmark) ? pillar.benchmark : 100;
      const scorePct = Math.max(2, Math.min(100, pillar.value));
      const benchPct = Math.max(0, Math.min(100, benchmark));
      return `<div class="bar-row ${cls}">
        <div class="bar-head">
          <span class="bar-name">${esc(pillar.label)}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${Math.max(2, Math.min(100, pillar.value))}%;"></div>
          <span class="bar-myval" style="left:${scorePct}%">${esc(String(pillar.value))}</span>
          <div class="bar-bench" style="left:${benchPct}%"><span class="bar-benchval">${esc(String(benchmark))}</span><span class="bar-benchlabel">Best practice</span></div>
        </div>
      </div>`;
    }).join('')}
  </div>

  <div class="rows" style="margin-top:9mm; border-top:0;">
    ${row('Best-practice gap', bestPracticeGapLine(ctx))}
    ${row('AI risk', ctx.pdfAiRisk)}
  </div>
  ${footer(meta, profile, 2)}
</section>`;
}

function evidencePage(ctx, meta, profile) {
  const evidence = (ctx.evidence.length ? ctx.evidence : ctx.receipts.map((text) => ({ read: text }))).slice(0, 3);
  return `<section class="sheet"${sheetStyle('evidence')}>
  ${header('Pattern')}
  <div class="eyebrow mono">The pattern</div>
  <h1 class="title">${esc(ctx.patternHeader || 'Three answers. One pattern.')}</h1>
  <p class="lede">${esc(ctx.patternBody || ctx.receiptTail)}</p>
  <div class="mono" style="font-size:7.8px; color:var(--ink-faint); margin-top:8mm;">Here is what we learned from your answers</div>

  <div style="margin-top:3.8mm; border-top:1px solid var(--rule);">
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

  <div class="dark-band" style="margin-top:8mm; margin-bottom:10mm; padding:11mm 10mm;">
    <div class="mono" style="font-size:7.4px;">The clearest line</div>
    <div style="font-size:28px; line-height:1.28; font-style:italic; margin-top:4.5mm;">&ldquo;${esc(ctx.quoteText)}&rdquo;</div>
    ${ctx.patternSoWhat ? `<div style="font-size:12.5px; line-height:1.5; color:var(--paper-soft); margin-top:5mm; max-width:155mm;">${esc(ctx.patternSoWhat)}</div>` : ''}
  </div>
  ${footer(meta, profile, 3)}
</section>`;
}

function costPage(ctx, meta, profile) {
  const [lead, ...scene] = pdfCostScene(ctx, profile);
  const costRows = pdfCostRows(ctx, profile);
  const ignored = pdfIgnoredCost(ctx, profile);
  return `<section class="sheet"${sheetStyle('cost')}>
  ${header('The cost')}
  <div class="eyebrow mono">What the gap costs</div>
  <h1 class="title">${esc(lead || 'Picture the cost inside one real operating cycle.')}</h1>
  <div style="margin-top:7mm; max-width:160mm;">
    ${scene.map((line, index) => `<p style="font-size:${index === 0 ? '16.5px' : '14px'}; line-height:1.52; color:${index === 0 ? 'var(--ink)' : 'var(--ink-soft)'}; margin-top:${index === 0 ? '0' : '4mm'};">${esc(line)}</p>`).join('')}
  </div>

  <div class="rows" style="margin-top:9mm;">
    ${costRows.map((item) => row(item.label, item.value)).join('')}
  </div>

  ${ignored ? `
  <div style="margin-top:8mm; background:rgba(247,243,237,0.94); color:var(--paper-ink); border-left:2px solid var(--paper); padding:8.8mm 8.5mm;">
    <div class="mono" style="font-size:7.2px; color:var(--paper-faint);">If ignored</div>
    <div style="font-size:22px; line-height:1.18; margin-top:3mm;">${esc(ignored.title)}</div>
    <div style="font-size:13.4px; line-height:1.5; color:var(--paper-soft); margin-top:3.2mm;">${esc(ignored.body)}</div>
  </div>` : ''}
  ${footer(meta, profile, 4)}
</section>`;
}

function firstMovePage(ctx, meta, profile) {
  const steps = firstMoveSteps(ctx);
  const bookingUrl = ctx.calendarUrl || meta.revealUrl;
  return `<section class="sheet"${sheetStyle('firstMove')}>
  ${header('First move')}
  <div class="eyebrow mono">Book the session</div>
  <h1 class="title">${esc(ctx.pdfFirstMoveHeader)}</h1>
  <p class="lede">${esc(ctx.pdfFirstMoveLine)}</p>

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
        <div style="font-size:13.8px; line-height:1.48; color:var(--paper-soft); margin-top:3mm;">${esc(ctx.fitBody)}</div>
        <div class="mono" style="font-size:7.4px; margin-top:5mm;">You leave with</div>
        <div style="font-size:11.8px; line-height:1.46; color:var(--paper-soft); margin-top:2mm;">${esc(ctx.sessionTakeaway)}</div>
      </div>
      <a class="btn pill" style="white-space:nowrap; margin-top:1mm;" href="${escAttr(bookingUrl)}">Book the working session</a>
    </div>
  </div>
  ${footer(meta, profile, 5)}
</section>`;
}

function row(label, value) {
  return `<div class="row"><div class="mono">${esc(label)}</div><div class="val">${esc(value)}</div></div>`;
}

function firstMoveSteps(ctx) {
  return [
    { title: 'Bring', body: firstMoveBringLine(ctx.hurdleLabel) },
    { title: 'Map', body: 'We mark the signal, the wait, the owner, the handoff and the cost.' },
    { title: 'Leave', body: 'You leave with one rule to test next week and one measure that proves whether it worked.' }
  ];
}

const DEFAULT_BENCHMARK = { Visibility: 88, Velocity: 84, Coherence: 86, Leverage: 82 };

function pdfPillars(rawPillars) {
  return rawPillars.map((pillar) => ({
    ...pillar,
    value: Number.isFinite(Number(pillar.value)) ? Number(pillar.value) : 0,
    benchmark: Number.isFinite(Number(pillar.benchmark)) ? Number(pillar.benchmark) : DEFAULT_BENCHMARK[pillar.label] || 100
  }));
}

function widestBenchmarkGap(pillars) {
  return [...pillars]
    .map((pillar) => ({ ...pillar, gap: Math.max(0, (pillar.benchmark || 0) - (pillar.value || 0)) }))
    .sort((a, b) => b.gap - a.gap)[0] || { label: 'Visibility', value: 0, benchmark: 88, gap: 0 };
}

function bucketFocus(bucket) {
  return {
    Clarity: 'Make one repeated decision clear enough for AI to trust.',
    Traction: 'Move from signal to action before the window closes.',
    Scale: 'Make the operating system consistent before AI carries more decisions.'
  }[bucket] || 'Make one repeated decision cleaner before adding more AI.';
}

function mainWeaknessCopy(hurdle) {
  return {
    Visibility: 'The number exists, but the room still has to trust it.',
    Velocity: 'The signal appears, then the decision waits.',
    Coherence: 'Teams work hard from different pictures.',
    Leverage: 'AI reaches work before the decision path is ready.'
  }[hurdle] || 'One repeated decision path is not ready to carry more AI.';
}

function pdfClean(text) {
  return String(text || '')
    .replace(/\bfirst\s+leak\b/gi, 'main weakness')
    .replace(/\bleaks\s+first\b/gi, 'shows up first')
    .replace(/\boperating\s+leak\b/gi, 'operating weakness');
}

function bestPracticeGapLine(ctx) {
  const focus = ctx.bestPracticeGap;
  if (!focus || focus.gap <= 8) {
    return 'Your readings are close to the marks. The work is choosing which rule should carry more weight next.';
  }
  return `${focus.label} is ${focus.gap} points below best practice. Close that gap before asking AI to carry more decisions.`;
}

function pdfCostScene(ctx, profile) {
  const copy = {
    Visibility: [
      'Trust rebuilt every week gets expensive.',
      'One challenged number is not the cost. The cost is the same number being defended every time the decision returns.',
      'Across a quarter, that can become 12 decisions waiting for trust before they can move.'
    ],
    Velocity: [
      'The wait gets expensive when it repeats.',
      'One late call is not the cost. The cost is the same delay becoming the way decisions move.',
      'Across a quarter, one late decision a week can become 12 delayed calls.'
    ],
    Coherence: [
      'The rebuild gets expensive when it repeats.',
      'One split meeting is not the cost. The cost is rebuilding the picture every time the decision returns.',
      'Across a quarter, that can become 12 decisions waiting for teams to agree what is true.'
    ]
  }[profile.hurdle] || [
    'The gap gets expensive when it repeats.',
    'One delayed decision is not the cost. The cost is the same weakness becoming the way the business moves.',
    'Across a quarter, repeated delay turns into senior attention spent twice.'
  ];

  return [
    ...copy,
    'AI does not remove that by itself. It makes the gap easier to see and faster to repeat.'
  ];
}

function pdfCostRows(ctx, profile) {
  const values = new Map((ctx.costModel || []).map((item) => [item.label, item.value]));
  return [
    { label: 'Where it hides', value: values.get('Where it hides') || hiddenCostFallback(profile.hurdle) },
    { label: 'Why it matters', value: costConsequence(profile, values.get('Business consequence')) },
    { label: 'Your number', value: values.get('Your number') || 'Choose one delayed decision. Price the wait in *gross margin, not revenue*.' },
    { label: 'Track next', value: trackNextLine(profile.hurdle, values.get('Track next')) }
  ];
}

function hiddenCostFallback(hurdle) {
  return {
    Visibility: 'The room questions source, owner or payback before it can act.',
    Velocity: 'The signal appears, then waits for owner, permission or the meeting that moves it.',
    Coherence: 'Teams bring different sources, definitions or owners into the same decision.'
  }[hurdle] || 'The gap hides inside the repeated decision path.';
}

function costConsequence(profile, fallback) {
  const copy = {
    Visibility: 'Senior attention gets used to defend the picture instead of moving the week. That is the cost to remove.',
    Velocity: 'Senior attention gets spent twice: first to see the signal, then again to restart the decision. That is the cost to remove.',
    Coherence: 'Senior attention gets used to rebuild one picture before the real decision can start. That is the cost to remove.'
  }[profile.hurdle];
  return copy || fallback || 'The business pays for the delay without seeing it as a line item.';
}

function trackNextLine(hurdle, fallback) {
  return {
    Visibility: 'Track days from first number to safe action. This shows whether the number earns trust before the meeting.',
    Velocity: 'Track days from first signal to first action. This shows whether the new rule is shortening the wait.',
    Coherence: 'Track how many people, tools and definitions are needed before one answer is usable. This shows whether the picture is getting cleaner.'
  }[hurdle] || fallback || 'Track the delay from first signal to clean decision.';
}

function pdfIgnoredCost(ctx, profile) {
  const stage = {
    Clarity: 'The habit is still visible enough to fix. If it stays open, the business grows around manual fixes and founder judgement.',
    Traction: 'Momentum makes the delay more expensive. If it stays open, the late decision becomes the operating rhythm.',
    Scale: 'The gap is no longer a team inconvenience. If it stays open, governance expands to explain the delay instead of removing it.'
  }[profile.bucket] || 'The weakness is visible in a repeated decision. If it stays open, the workaround becomes normal.';
  const risk = {
    Visibility: 'AI can surface more numbers, but it will not make the room trust them.',
    Velocity: 'AI can spot the delay faster, but it will not close it unless the owner, rule and next action are clear.',
    Coherence: 'AI can move the split faster, but it will not give the business one shared picture.'
  }[profile.hurdle] || pdfClean(ctx.ignoredCost);
  return {
    title: 'The workaround becomes the system.',
    body: `${stage} ${risk}`
  };
}

function firstMoveBringLine(hurdle) {
  return {
    Visibility: 'Bring one number the room still debates. Use the one that slows a real decision.',
    Velocity: 'Bring one decision that landed late. Use the one people still mention.',
    Coherence: 'Bring one decision where two teams used different pictures. Use the one that slowed the room.'
  }[hurdle] || 'Bring one real decision from the last 30 days. Use the one the room still talks about.';
}

function pdfFirstMoveHeader() {
  return 'Bring one real decision. Leave with one rule.';
}

function pdfFirstMoveLine() {
  return 'This is not a pitch. Bring the decision this profile points to. Our CEO maps where it waits, what to ignore and the rule that moves it next.';
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
  const close = cards.find((card) => card.type === 'close');
  const firstMoveLines = arrayText(move?.body);
  const costSceneLines = arrayText(cost?.body);
  const costLines = [cost?.hero, cost?.compound, ...costSceneLines].map((line) => String(line || '').trim()).filter(Boolean);
  const receipts = arrayText(receiptsCard?.receipts).length
    ? arrayText(receiptsCard?.receipts)
    : ['The business has shown us where the leak sits.'];
  const evidence = Array.isArray(receiptsCard?.evidence)
    ? receiptsCard.evidence.filter(Boolean)
    : [];
  const actionPlan = summary.actionPlan || {};
  const shapedPillars = pdfPillars(Array.isArray(shape?.pillars) && shape.pillars.length ? shape.pillars : pillars);
  const bestPracticeGap = widestBenchmarkGap(shapedPillars);

  return {
    bucket: profile.bucket,
    bucketFocus: bucketFocus(profile.bucket),
    score: profile.score,
    signature: summary.signature || `${profile.characterName} describes the operating pattern your answers revealed.`,
    pillars: shapedPillars,
    strongest,
    hurdleLabel: hurdlePillar.label,
    hurdleValue: hurdlePillar.value,
    mainWeakness: mainWeaknessCopy(hurdlePillar.label),
    bestPracticeGap,
    gap,
    shapeEyebrow: shape?.eyebrow || '',
    shapeHeader: shape?.header || '',
    shapeBody: shape?.body || 'The value is not the score on its own. It is the operating gap behind it.',
    pdfShapeHeader: 'Benchmark vs the best. The gap is the work.',
    pdfShapeBody: 'Your score is the light line. The right-hand mark is best practice. The gap shows what must improve before AI carries more decisions.',
    aiImplication: rowValue(shape?.shapeRead, 'AI risk'),
    pdfAiRisk: pdfClean(rowValue(shape?.shapeRead, 'AI risk')) || 'AI inherits this gap unless the repeated decision path is made cleaner.',
    aiLeverage: '',
    costModel: Array.isArray(cost?.model) ? cost.model : [],
    ignoredCost: rowValue(widening?.compounders, 'If ignored'),
    hurdleClose: pdfClean(hurdle?.close || `Your main weakness is ${profile.hurdle}: the first place to inspect before stronger AI work depends on it.`),
    receipts,
    evidence,
    receiptTail: receiptsCard?.tail || 'Three answers. One pattern. The business has shown us where the leak sits.',
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
    pdfFirstMoveHeader: pdfFirstMoveHeader(profile),
    pdfFirstMoveLine: pdfFirstMoveLine(profile),
    fitBody: 'Thirty minutes with our CEO. You bring the decision. We map the wait, decide what to ignore and name the rule that moves it.',
    sessionTakeaway: 'A short decision map, one operating rule and one next measure. Enough to test inside the business next week.',
    calendarUrl: close?.calendarUrl || '',
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

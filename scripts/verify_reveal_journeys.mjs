import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { chromium } from 'playwright';

import { DEMO_SCENARIOS } from '../api/_lib/demo_scenarios.js';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'mobile-tight', width: 390, height: 670 }
];

const RETIRED_COPY = [
  'Not a grade',
  'The next card shows you which way',
  'From your answers',
  'From your own answers',
  'Ghost bar',
  ['Thirty minutes with ', 'Saver', 'io'].join(''),
  'What it costs you now',
  'Your words - the line we keep returning to'
];

function assert(ok, message) {
  if (!ok) throw new Error(message);
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function startServer(port) {
  const child = spawn(process.execPath, ['scripts/dev_server.mjs', String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ALLOW_DEMO_HARNESS: 'true',
      PUBLIC_SITE_URL: `http://127.0.0.1:${port}`,
      JWT_SECRET: process.env.JWT_SECRET || 'local-reveal-journey-secret'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let output = '';
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`dev server did not start: ${output}`)), 10000);
    const onData = (chunk) => {
      output += chunk.toString();
      if (output.includes(`http://localhost:${port}`)) {
        clearTimeout(timer);
        resolve();
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`dev server exited with ${code}: ${output}`));
    });
  });

  await ready;
  return child;
}

async function stopServer(child) {
  if (!child || child.killed) return;
  child.kill('SIGINT');
  await new Promise((resolve) => child.once('exit', resolve));
}

function visibleTextSample(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 140);
}

async function collectActiveCard(page) {
  return page.evaluate(() => {
    const card = document.querySelector('.card.is-active');
    const rect = card?.getBoundingClientRect();
    const overlaps = (a, b) => (
      a.left < b.right - 2 &&
      a.right > b.left + 2 &&
      a.top < b.bottom - 2 &&
      a.bottom > b.top + 2
    );
    const isActuallyVisible = (node) => {
      const closedDetails = node.closest('details:not([open])');
      if (closedDetails && node.tagName !== 'SUMMARY') return false;
      return node.offsetParent !== null && (node.textContent || '').trim().length > 0;
    };
    const textEls = Array.from(card?.querySelectorAll('h1,h2,h3,p,div,button,summary,span') || [])
      .filter(isActuallyVisible)
      .map((node) => {
        const r = node.getBoundingClientRect();
        return {
          tag: node.tagName.toLowerCase(),
          className: String(node.className || ''),
          text: (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
          width: r.width,
          height: r.height
        };
      });
    const advance = card?.querySelector('.card-advance');
    const advanceRect = advance?.getBoundingClientRect();
    const overlapTargets = Array.from(card?.querySelectorAll([
      'h1',
      'h2',
      'h3',
      'p',
      'summary',
      '.bar-row',
      '.brief-row',
      '.cost-impact',
      '.impact-line',
      '.impact-metric',
      '.move-symbol',
      '.move-copy',
      '.profile-read',
      '.pattern-row',
      '.support-row',
      '.num',
      '.num-after',
      '.score-brief'
    ].join(',')) || [])
      .filter((node) => advance && !advance.contains(node) && !node.contains(advance) && isActuallyVisible(node))
      .map((node) => {
        const r = node.getBoundingClientRect();
        return {
          tag: node.tagName.toLowerCase(),
          className: String(node.className || ''),
          text: (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
          width: r.width,
          height: r.height
        };
      });
    const advanceOverlaps = advanceRect
      ? overlapTargets.filter((node) => node.width > 0 && node.height > 0 && overlaps(advanceRect, node))
      : [];
    return {
      type: Array.from(card?.classList || []).find((cls) => cls.startsWith('is-'))?.replace('is-', '') || '',
      text: card?.innerText || '',
      rect: rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height } : null,
      textEls,
      advanceOverlaps,
      activeCount: document.querySelectorAll('.card.is-active').length,
      docWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth
    };
  });
}

function checkActiveCard({ key, viewport, slide, active }) {
  assert(active.activeCount === 1, `${key}/${viewport.name}/slide ${slide}: expected one active card`);
  assert(active.text.trim().length > 0, `${key}/${viewport.name}/slide ${slide}: active card has no text`);
  assert(active.docWidth <= active.viewportWidth + 3, `${key}/${viewport.name}/slide ${slide}: horizontal overflow ${active.docWidth} > ${active.viewportWidth}`);

  const bad = active.textEls.filter((node) => (
    node.width > 0 &&
    node.height > 0 &&
    (node.left < -2 || node.right > active.viewportWidth + 2)
  ));
  assert(bad.length === 0, `${key}/${viewport.name}/slide ${slide}: visible text overflow ${JSON.stringify(bad[0])}`);
  assert(active.advanceOverlaps.length === 0, `${key}/${viewport.name}/slide ${slide}: advance CTA overlaps content ${JSON.stringify(active.advanceOverlaps[0])}`);

  for (const retired of RETIRED_COPY) {
    assert(!active.text.includes(retired), `${key}/${viewport.name}/slide ${slide}: retired copy present: ${retired}`);
  }
}

async function verifyDrawer(page, key, viewport, slide) {
  const summary = page.locator('.card.is-active details.more-drawer summary').first();
  if (!(await summary.count())) return { drawer: false };
  const before = await page.locator('.card.is-active details.more-drawer').first().evaluate((node) => node.open);
  assert(before === false, `${key}/${viewport.name}/slide ${slide}: drawer should default closed`);
  await summary.click();
  const after = await page.locator('.card.is-active details.more-drawer').first().evaluate((node) => node.open);
  assert(after === true, `${key}/${viewport.name}/slide ${slide}: drawer did not open`);
  const active = await collectActiveCard(page);
  checkActiveCard({ key, viewport, slide: `${slide}-drawer`, active });
  await summary.click();
  return { drawer: true };
}

async function verifyJourney(browser, baseUrl, key, viewport) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });

  await page.goto(`${baseUrl}/reveal/?demo=${encodeURIComponent(key)}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('.card').length === 8, { timeout: 30000 });

  const summary = {
    key,
    viewport: viewport.name,
    slides: [],
    popupUrl: ''
  };

  for (let slide = 1; slide <= 8; slide += 1) {
    await page.waitForSelector('.card.is-active', { timeout: 10000 });
    const active = await collectActiveCard(page);
    checkActiveCard({ key, viewport, slide, active });

    if (slide === 1) {
      assert(active.text.includes('A+A · AI READINESS'), `${key}/${viewport.name}: cover eyebrow missing`);
      assert(active.text.includes('the score, the leak and the first rule'), `${key}/${viewport.name}: cover diagnostic promise missing`);
    }
    if (slide === 3) {
      assert(active.text.includes('Benchmark vs the best.'), `${key}/${viewport.name}: benchmark headline missing`);
      assert(active.text.toLowerCase().includes('right-hand mark'), `${key}/${viewport.name}: benchmark note missing`);
      const dragCount = await page.locator('.card.is-active .bar-row.drag').count();
      const normalCount = await page.locator('.card.is-active .bar-row.normal').count();
      assert(dragCount + normalCount === 4, `${key}/${viewport.name}: expected four benchmark rows`);
    }
    if (slide === 6) {
      assert(active.text.includes('THE BILL'), `${key}/${viewport.name}: cost bill missing`);
    }
    if (slide === 7) {
      assert(active.text.includes('You leave with one rule'), `${key}/${viewport.name}: first move rule missing`);
    }
    if (slide === 8) {
      assert(active.text.includes('Thirty minutes with our CEO'), `${key}/${viewport.name}: close offer missing`);
      assert(!active.text.includes('six new clients'), `${key}/${viewport.name}: retired close qualifier is still visible`);
      assert(active.text.includes('Book the working session'), `${key}/${viewport.name}: booking CTA missing`);
    }

    const drawer = await verifyDrawer(page, key, viewport, slide);
    summary.slides.push({ slide, type: active.type, drawer: drawer.drawer, sample: visibleTextSample(active.text) });

    if (slide < 8) {
      await page.locator('.card.is-active .card-advance').click({ timeout: 10000 });
    }
  }

  const popupPromise = page.waitForEvent('popup', { timeout: 7000 });
  await page.locator('.card.is-active .cta').click({ timeout: 10000 });
  const popup = await popupPromise;
  summary.popupUrl = popup.url();
  assert(summary.popupUrl.includes('calendly.com/atelier-and-avenue-saverio-bianchi'), `${key}/${viewport.name}: unexpected booking URL ${summary.popupUrl}`);
  await popup.close();

  assert(errors.length === 0, `${key}/${viewport.name}: browser errors ${errors.join(' | ')}`);
  await context.close();
  return summary;
}

async function main() {
  const port = await freePort();
  const server = await startServer(port);
  const baseUrl = `http://127.0.0.1:${port}`;
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    personas: Object.keys(DEMO_SCENARIOS),
    viewports: VIEWPORTS,
    journeys: []
  };

  const browser = await chromium.launch({ headless: true });
  try {
    for (const key of Object.keys(DEMO_SCENARIOS)) {
      for (const viewport of VIEWPORTS) {
        report.journeys.push(await verifyJourney(browser, baseUrl, key, viewport));
      }
    }
  } finally {
    await browser.close();
    await stopServer(server);
  }

  await mkdir(join(process.cwd(), 'output'), { recursive: true });
  const outPath = join(process.cwd(), 'output', 'reveal-journey-report.json');
  await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(outPath);
  console.log(`journeys=${report.journeys.length} personas=${report.personas.length} viewports=${VIEWPORTS.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

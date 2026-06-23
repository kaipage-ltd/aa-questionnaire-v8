// Rendering regression for the profile report. Chromium-backed, so it only runs
// where a local Chrome exists (CI without a browser skips). Two guarantees per
// demo profile: exactly 5 pages (a 6th page means a sheet overflowed), and no
// content clipped inside a sheet (scrollHeight must not exceed clientHeight).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { deriveProfile, deriveRevealInsights, sanitiseAnswers } from '../_lib/profile.js';
import { DEMO_SCENARIOS } from '../_lib/demo_scenarios.js';
import { renderReportHtml } from '../_lib/pdf_template.js';
import { launchBrowser, localChromePath } from '../_lib/chromium.js';

const skip = !localChromePath() && 'no local Chrome available';

test('every demo profile renders a 5-page report with no clipped sheets', { skip }, async () => {
  const { PDFDocument } = await import('pdf-lib');
  const browser = await launchBrowser();
  try {
    for (const [key, raw] of Object.entries(DEMO_SCENARIOS)) {
      const answers = sanitiseAnswers(raw);
      const profile = deriveProfile(answers);
      const insights = deriveRevealInsights(answers, profile, { name: 'James', brandName: 'Aubrey & Finch' });
      const html = renderReportHtml({
        name: 'James',
        email: `demo+${key}@example.com`,
        profile,
        submittedAt: '2026-06-10T08:00:00.000Z',
        revealUrl: 'https://example.com/reveal/?token=demo',
        insights
      });

      const page = await browser.newPage();
      try {
        await page.setContent(html, { waitUntil: 'load' });
        await page.evaluateHandle('document.fonts.ready');

        const clipped = await page.evaluate(() => Array.from(document.querySelectorAll('.sheet'))
          .map((sheet, index) => ({ index: index + 1, scroll: sheet.scrollHeight, client: sheet.clientHeight }))
          .filter((info) => info.scroll > info.client + 1));
        assert.deepEqual(clipped, [], `${key}: content overflows inside sheet(s) ${JSON.stringify(clipped)}`);

        const pdf = await page.pdf({ format: 'a4', printBackground: true, preferCSSPageSize: true });
        const document = await PDFDocument.load(pdf);
        assert.equal(document.getPageCount(), 5, `${key}: expected exactly 5 pages`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test('untrusted strings are escaped into the report HTML', () => {
  const raw = DEMO_SCENARIOS['t-ve'];
  const answers = sanitiseAnswers(raw);
  const profile = deriveProfile(answers);
  const insights = deriveRevealInsights(answers, profile, { name: '<script>alert(1)</script>', brandName: 'Aubrey & Finch' });
  const html = renderReportHtml({
    name: '<script>alert(1)</script>',
    email: 'demo@example.com',
    profile,
    submittedAt: '2026-06-10T08:00:00.000Z',
    revealUrl: 'https://example.com/reveal/?token="><script>x</script>',
    insights
  });
  assert.equal(html.includes('<script>alert(1)</script>'), false, 'name must be escaped');
  assert.equal(html.includes('"><script>x</script>'), false, 'reveal url must be escaped');
});

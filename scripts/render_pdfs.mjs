// Render the profile PDF for all nine demo personas to scripts/output/ so the
// report can be designed locally without a deploy. Pass --html to also dump the
// intermediate HTML next to each PDF for browser-devtools iteration.
// Usage: npm run pdf:samples   (or: node scripts/render_pdfs.mjs --html)
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { deriveProfile, deriveRevealInsights, sanitiseAnswers } from '../api/_lib/profile.js';
import { DEMO_SCENARIOS } from '../api/_lib/demo_scenarios.js';
import { renderReportHtml } from '../api/_lib/pdf_template.js';
import { renderProfilePdf, filename } from '../api/v8/pdf.js';

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'output');
await mkdir(outDir, { recursive: true });
const dumpHtml = process.argv.includes('--html');

for (const [key, raw] of Object.entries(DEMO_SCENARIOS)) {
  const answers = sanitiseAnswers(raw);
  const profile = deriveProfile(answers);
  const insights = deriveRevealInsights(answers, profile, { name: 'James', brandName: 'Aubrey & Finch' });
  const input = {
    name: 'James',
    email: `demo+${key}@example.com`,
    profile,
    submittedAt: new Date().toISOString(),
    revealUrl: 'https://example.com/reveal/?token=demo',
    insights
  };
  if (dumpHtml) {
    await writeFile(join(outDir, `${key}.html`), renderReportHtml(input));
  }
  const pdf = await renderProfilePdf(input);
  const file = join(outDir, `${key}-${filename(profile.characterName)}.pdf`);
  await writeFile(file, pdf);
  console.log(`${key}  ${profile.characterName}  score ${profile.score}  ->  ${file}  (${(pdf.length / 1024).toFixed(0)} KB)`);
}

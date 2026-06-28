import { chromium } from 'playwright';

const baseUrl = (process.env.SMOKE_BASE_URL || process.argv[2] || 'https://aa-questionnaire-v8.vercel.app').replace(/\/+$/, '');
const expectEmailSent = process.env.EXPECT_EMAIL_SENT === 'true';
const headless = process.env.SMOKE_HEADED !== '1';
const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch (err) {
    return { error: 'invalid_json_response' };
  }
}

async function main() {
  const browser = await chromium.launch({ headless });
  const page = await browser.newPage();
  page.setDefaultTimeout(120000);

  try {
    await page.goto(`${baseUrl}/?demo=s-ve`, { waitUntil: 'domcontentloaded' });
    await page.locator('#gateName').fill(`AA Production Smoke ${stamp}`);
    await page.locator('#gateEmail').fill(`aa-production-smoke-${stamp}@example.com`);
    await page.locator('#gatePrivacy').check();

    const submitPromise = page.waitForResponse((response) => {
      return response.url().includes('/api/v8/submit')
        && response.request().method() === 'POST';
    }, { timeout: 120000 });

    await page.locator('.confirm-btn[type="submit"]').click();

    let submitRes;
    try {
      submitRes = await submitPromise;
    } catch (err) {
      const verificationText = await page.locator('[data-field="botCheck"] .error-text').textContent().catch(() => '');
      if (verificationText.trim()) {
        throw new Error(`verification_failed=${verificationText.trim()}`);
      }
      if (headless) {
        throw new Error('turnstile_interaction_required; rerun with SMOKE_HEADED=1 npm run smoke:production');
      }
      throw err;
    }

    const submitBody = await readJsonResponse(submitRes);
    assert(submitRes.status() === 200, `submit_status=${submitRes.status()} error=${submitBody.error || 'unknown'}`);
    assert(submitBody.ok === true, 'submit did not return ok=true');
    assert(Boolean(submitBody.revealUrl), 'missing revealUrl');
    assert(Boolean(submitBody.pdfUrl), 'missing pdfUrl');
    assert(submitBody.emailResult?.provider === 'brevo', 'email provider was not brevo');
    assert(submitBody.emailResult?.contactSynced === true, 'Brevo contact was not synced');
    assert(submitBody.emailSent === expectEmailSent, `emailSent=${submitBody.emailSent}, expected ${expectEmailSent}`);
    assert(Boolean(submitBody.actionPlan?.artefactName), 'missing action-plan artefact');
    assert(submitBody.privacy?.version === '2026-06-25', `privacy_version=${submitBody.privacy?.version}`);

    const pdfRes = await page.request.get(submitBody.pdfUrl);
    const pdfBytes = new Uint8Array(await pdfRes.body());
    const header = new TextDecoder().decode(pdfBytes.slice(0, 5));
    const pdfText = new TextDecoder('latin1').decode(pdfBytes);
    const pageMatch = pdfText.match(/\/Count (\d+)\b/);

    assert(pdfRes.status() === 200, `pdf_status=${pdfRes.status()}`);
    assert(header === '%PDF-', `pdf_header=${header}`);
    assert(pageMatch?.[1] === '5', `pdf_page_count=${pageMatch?.[1] || 'unknown'}`);

    console.log(`base=${baseUrl}`);
    console.log(`submit_status=${submitRes.status()}`);
    console.log(`emailSent=${submitBody.emailSent}`);
    console.log(`contactSynced=${submitBody.emailResult.contactSynced}`);
    console.log(`profile=${submitBody.profile.characterName} / ${submitBody.profile.score}`);
    console.log(`actionPlan=${submitBody.actionPlan.artefactName}`);
    console.log(`privacyVersion=${submitBody.privacy.version}`);
    console.log(`pdf_status=${pdfRes.status()}`);
    console.log(`pdf_header=${header}`);
    console.log(`pdf_bytes=${pdfBytes.length}`);
    console.log(`pdf_page_count=${pageMatch[1]}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(`smoke_failed=${err.message}`);
  process.exit(1);
});

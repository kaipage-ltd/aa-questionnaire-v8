import { absoluteSiteUrl, jsonError } from '../_lib/http.js';
import { isRevealTokenShape, verifyRevealPayload } from '../_lib/jwt.js';
import { deriveRevealInsights } from '../_lib/profile.js';
import { renderReportHtml } from '../_lib/pdf_template.js';
import { launchBrowser } from '../_lib/chromium.js';
import { rateLimit } from '../_lib/rateLimit.js';

export async function GET(req) {
  const limit = rateLimit(req, { keyPrefix: 'v8_pdf', limit: 8 });
  if (!limit.allowed) {
    return jsonError(429, 'rate_limited', undefined, {
      headers: { 'retry-after': String(limit.retryAfter) }
    });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) return jsonError(400, 'missing_token');
  if (!isRevealTokenShape(token)) return jsonError(401, 'invalid_token');

  let payload;
  try {
    payload = await verifyRevealPayload(token);
  } catch (err) {
    console.warn('v8_pdf_token_rejected', err.message);
    return jsonError(401, 'invalid_token');
  }

  let revealUrl;
  try {
    revealUrl = `${absoluteSiteUrl(req)}/reveal/?token=${encodeURIComponent(token)}`;
  } catch (err) {
    console.error('v8_pdf_site_url_failed', err);
    return jsonError(500, 'site_url_unconfigured');
  }
  const insights = deriveRevealInsights(payload.answers || {}, payload.profile, {
    name: payload.name,
    brandName: payload.brandName || ''
  });

  let pdf;
  try {
    pdf = await renderProfilePdf({
      name: payload.name,
      email: payload.email,
      profile: payload.profile,
      submittedAt: payload.submittedAt,
      revealUrl,
      insights
    });
  } catch (err) {
    console.error('v8_pdf_render_failed', err);
    return jsonError(500, 'pdf_render_failed');
  }

  return new Response(pdf, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${filename(payload.profile.characterName)}.pdf"`,
      'cache-control': 'private, no-store, max-age=0, must-revalidate',
      'x-content-type-options': 'nosniff'
    }
  });
}

// HTML template -> headless Chromium -> A4 PDF. The template owns the layout
// (fixed 297mm sheets, overflow hidden), so page count is deterministic and
// variable-length copy can reflow instead of clipping.
export async function renderProfilePdf(input) {
  const html = renderReportHtml(input);
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluateHandle('document.fonts.ready');
    const pdf = await page.pdf({
      format: 'a4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export function filename(value) {
  return String(value || 'aa-ai-readiness-profile')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'aa-ai-readiness-profile';
}

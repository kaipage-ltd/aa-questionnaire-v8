import { absoluteSiteUrl, json, jsonError, readJson } from '../_lib/http.js';
import { signRevealPayload } from '../_lib/jwt.js';
import { deriveActionPlan, deriveProfile, sanitiseAnswers } from '../_lib/profile.js';
import { sendRevealEmail } from '../_lib/email.js';
import { rateLimit } from '../_lib/rateLimit.js';
import { verifyTurnstile } from '../_lib/turnstile.js';

const PRIVACY_NOTICE_VERSION = '2026-06-25';
const PRIVACY_NOTICE_URL = '/privacy/';

function validName(value) {
  return typeof value === 'string' && value.length >= 2 && value.length <= 120;
}

function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPrivacy(value) {
  return Boolean(value)
    && value.accepted === true
    && value.version === PRIVACY_NOTICE_VERSION
    && (value.noticeUrl === undefined || value.noticeUrl === PRIVACY_NOTICE_URL);
}

export async function POST(req) {
  const limit = rateLimit(req, { keyPrefix: 'v8_submit' });
  if (!limit.allowed) {
    return jsonError(429, 'rate_limited', undefined, {
      headers: { 'retry-after': String(limit.retryAfter) }
    });
  }

  let body;
  try {
    body = await readJson(req);
  } catch (err) {
    return jsonError(err.status || 400, 'invalid_body');
  }

  const name = normaliseText(body.name, 120);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const company = normaliseText(body.company, 80);

  if (!validName(name)) return jsonError(400, 'invalid_name');
  if (!validEmail(email)) return jsonError(400, 'invalid_email');
  if (!validPrivacy(body.privacy)) return jsonError(400, 'privacy_required');

  const botCheck = await verifyTurnstile(req, body.botCheck);
  if (!botCheck.ok) return jsonError(botCheck.status, botCheck.error);

  const brandName = deriveBrandName(company, email);
  const answers = sanitiseAnswers(body.answers || {});
  const profile = deriveProfile(answers);
  const actionPlan = deriveActionPlan(profile);
  const submittedAt = new Date().toISOString();
  const privacy = {
    accepted: true,
    version: PRIVACY_NOTICE_VERSION,
    noticeUrl: PRIVACY_NOTICE_URL,
    acceptedAt: submittedAt
  };

  let token;
  try {
    token = await signRevealPayload({
      typ: 'v8:reveal',
      name,
      email,
      company,
      brandName,
      answers,
      profile,
      privacy,
      submittedAt
    });
  } catch (err) {
    console.error('v8_submit_token_failed', err);
    return jsonError(500, 'token_sign_failed');
  }

  let baseUrl;
  try {
    baseUrl = absoluteSiteUrl(req);
  } catch (err) {
    console.error('v8_submit_site_url_failed', err);
    return jsonError(500, 'site_url_unconfigured');
  }
  const revealUrl = `${baseUrl}/reveal/?token=${encodeURIComponent(token)}`;
  const pdfUrl = `${baseUrl}/api/v8/pdf?token=${encodeURIComponent(token)}`;

  // Demo personas (demo+<key>@…) must never reach the real contact list or send mail in
  // production. They still get a working token so internal walkthroughs render.
  const blockDemoDelivery = /^demo\+/i.test(email) && process.env.VERCEL_ENV === 'production';

  // The PDF is no longer rendered or attached at submit time. Chromium rendering
  // would add seconds to the moment the respondent is waiting on; the email links
  // the tokenized /api/v8/pdf URL instead, and the report renders on first click.
  let emailResult;
  if (blockDemoDelivery) {
    emailResult = { sent: false, provider: 'brevo', contactSynced: false, skipped: 'demo_in_production' };
  } else {
    try {
      emailResult = await sendRevealEmail({ to: email, name, revealUrl, pdfUrl, profile, actionPlan, submittedAt });
    } catch (err) {
      console.error('v8_submit_email_failed', err);
      emailResult = { sent: false, provider: 'brevo', error: 'email_delivery_failed' };
    }
  }

  return json({
    ok: true,
    emailSent: Boolean(emailResult.sent),
    emailResult: publicEmailResult(emailResult),
    revealUrl,
    pdfUrl,
    profile,
    actionPlan,
    privacy,
    submittedAt
  });
}

// Personalisation source of truth, decided once at submit and stored in the token so the
// reveal, the PDF and the email all say the same brand. An explicit company wins; otherwise
// we derive a display name from the work-email domain, and fall back to '' (which the reveal
// renders as "your business") for consumer mailboxes.
const CONSUMER_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'hotmail.co.uk', 'live.com',
  'live.co.uk', 'msn.com', 'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'icloud.com', 'me.com',
  'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'pm.me', 'gmx.com', 'gmx.co.uk',
  'mail.com', 'zoho.com', 'fastmail.com', 'yandex.com', 'qq.com', '163.com'
]);

function deriveBrandName(company, email) {
  if (company && company.length >= 2) return company;
  const domain = String(email || '').split('@')[1]?.toLowerCase() || '';
  if (!domain || CONSUMER_EMAIL_DOMAINS.has(domain)) return '';
  const label = domain.split('.')[0] || '';
  // Long labels are usually concatenated multi-word names ("atelierandavenue")
  // that read as typos when title-cased into a sentence; fall back to the
  // reveal's "your business" rendering instead.
  if (label.length < 2 || label.length > 12) return '';
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function normaliseText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function publicEmailResult(result = {}) {
  const out = {
    sent: Boolean(result.sent),
    provider: result.provider || 'brevo'
  };
  if ('contactSynced' in result) out.contactSynced = Boolean(result.contactSynced);
  if (result.skipped) out.skipped = publicSkippedReason(result.skipped);
  if (result.error) out.error = 'email_delivery_failed';
  return out;
}

function publicSkippedReason(reason) {
  if (reason === 'demo_in_production') return reason;
  return 'email_not_configured';
}

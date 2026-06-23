export const TURNSTILE_ACTION = 'v8-submit';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TOKEN_MAX_LENGTH = 2048;
const VERIFY_TIMEOUT_MS = 5000;

export function turnstileConfig() {
  const siteKey = clean(process.env.TURNSTILE_SITE_KEY);
  const secretKey = clean(process.env.TURNSTILE_SECRET_KEY);
  const allowedHostnames = parseList(process.env.TURNSTILE_ALLOWED_HOSTNAMES);
  const required = turnstileRequired(siteKey, secretKey);

  return {
    enabled: required || Boolean(siteKey),
    configured: Boolean(siteKey && secretKey && allowedHostnames.length),
    siteKey: siteKey || null,
    secretKey: secretKey || null,
    allowedHostnames,
    action: TURNSTILE_ACTION
  };
}

export function publicTurnstileConfig() {
  const config = turnstileConfig();
  return {
    enabled: config.enabled,
    configured: config.configured,
    siteKey: config.siteKey,
    action: config.action
  };
}

export async function verifyTurnstile(req, botCheck) {
  const config = turnstileConfig();
  if (!config.enabled) return { ok: true, skipped: 'turnstile_not_enabled' };
  if (!config.configured) return { ok: false, status: 503, error: 'bot_check_unconfigured' };

  const token = clean(botCheck?.token || botCheck?.response);
  if (!botCheck || botCheck.provider !== 'turnstile' || !token) {
    return { ok: false, status: 400, error: 'bot_check_required' };
  }
  if (token.length > TOKEN_MAX_LENGTH) {
    return { ok: false, status: 403, error: 'bot_check_failed' };
  }

  let outcome;
  try {
    outcome = await callSiteverify(config.secretKey, {
      response: token,
      remoteip: clientIp(req)
    });
  } catch (err) {
    console.error('v8_turnstile_unavailable', err);
    return { ok: false, status: 503, error: 'bot_check_unavailable' };
  }

  if (outcome.success !== true) {
    return { ok: false, status: 403, error: 'bot_check_failed' };
  }
  if (outcome.action !== TURNSTILE_ACTION) {
    return { ok: false, status: 403, error: 'bot_check_failed' };
  }
  if (!config.allowedHostnames.includes(clean(outcome.hostname).toLowerCase())) {
    return { ok: false, status: 403, error: 'bot_check_failed' };
  }

  return {
    ok: true,
    hostname: outcome.hostname,
    action: outcome.action,
    challengeTs: outcome.challenge_ts || null
  };
}

async function callSiteverify(secret, { response, remoteip }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        secret,
        response,
        remoteip,
        idempotency_key: crypto.randomUUID()
      }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`Turnstile Siteverify failed: ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function turnstileRequired(siteKey, secretKey) {
  return process.env.TURNSTILE_REQUIRED === 'true'
    || process.env.VERCEL_ENV === 'production'
    || Boolean(siteKey || secretKey);
}

function clientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for') || '';
  return forwarded.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || undefined;
}

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function clean(value) {
  return String(value || '').trim();
}

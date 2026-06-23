export function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...(init.headers || {})
    }
  });
}

export function jsonError(status, error, detail, init = {}) {
  const body = detail === undefined ? { error } : { error, detail };
  return json(body, { ...init, status });
}

export async function readJson(req) {
  const ct = req.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error('Expected application/json request body');
  }
  const maxBytes = 32 * 1024;
  const text = await req.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    const error = new Error('Request body too large');
    error.status = 413;
    throw error;
  }
  return JSON.parse(text);
}

export function absoluteSiteUrl(req) {
  const envUrl = process.env.PUBLIC_SITE_URL;
  if (envUrl) return cleanPublicOrigin(envUrl);
  if (process.env.VERCEL_ENV === 'production') {
    throw new Error('PUBLIC_SITE_URL is required in production');
  }
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  return cleanPublicOrigin(`${proto}://${host}`);
}

function cleanPublicOrigin(value) {
  let url;
  try {
    url = new URL(String(value || '').trim());
  } catch (err) {
    throw new Error('PUBLIC_SITE_URL must be a valid URL');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('PUBLIC_SITE_URL must use http or https');
  }
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('PUBLIC_SITE_URL must be an origin only');
  }
  return url.origin;
}

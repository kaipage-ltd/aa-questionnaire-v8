const buckets = new Map();

export function rateLimit(req, {
  limit = 12,
  windowMs = 10 * 60 * 1000,
  keyPrefix = 'global'
} = {}) {
  const now = Date.now();
  const key = `${keyPrefix}:${clientKey(req)}`;
  const existing = buckets.get(key);
  const bucket = existing && existing.resetAt > now
    ? existing
    : { count: 0, resetAt: now + windowMs };

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    };
  }

  prune(now);
  return { allowed: true, remaining: limit - bucket.count };
}

function clientKey(req) {
  const forwarded = req.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
  return ip;
}

function prune(now) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

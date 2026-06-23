import { json, jsonError } from '../_lib/http.js';
import { isRevealTokenShape, verifyRevealPayload } from '../_lib/jwt.js';
import { deriveRevealInsights } from '../_lib/profile.js';
import { rateLimit } from '../_lib/rateLimit.js';

export async function GET(req) {
  const limit = rateLimit(req, { keyPrefix: 'v8_reveal', limit: 60 });
  if (!limit.allowed) {
    return jsonError(429, 'rate_limited', undefined, {
      headers: { 'retry-after': String(limit.retryAfter) }
    });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) return jsonError(400, 'missing_token');
  if (!isRevealTokenShape(token)) return jsonError(401, 'invalid_token');

  try {
    const payload = await verifyRevealPayload(token);
    const insights = deriveRevealInsights(payload.answers || {}, payload.profile, {
      name: payload.name,
      brandName: payload.brandName || '',
      calendarUrl: process.env.PUBLIC_CALENDAR_URL || ''
    });
    return json({
      ok: true,
      reveal: {
        name: payload.name,
        email: payload.email,
        profileKey: payload.profile.key,
        score: payload.profile.score,
        hurdle: payload.profile.hurdle,
        bucket: payload.profile.bucket,
        characterName: payload.profile.characterName,
        pillars: payload.profile.pillars,
        actionPlan: insights.summary.actionPlan,
        cards: insights.cards,
        summary: insights.summary,
        privacy: payload.privacy || null,
        submittedAt: payload.submittedAt
      }
    });
  } catch (err) {
    console.warn('v8_reveal_token_rejected', err.message);
    return jsonError(401, 'invalid_token');
  }
}

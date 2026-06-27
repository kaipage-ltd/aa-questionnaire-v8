import { json, jsonError } from '../_lib/http.js';
import { isRevealTokenShape, verifyRevealPayload } from '../_lib/jwt.js';
import { deriveProfile, deriveRevealInsights, sanitiseAnswers } from '../_lib/profile.js';
import { DEMO_SCENARIOS } from '../_lib/demo_scenarios.js';
import { rateLimit } from '../_lib/rateLimit.js';

export async function GET(req) {
  const limit = rateLimit(req, { keyPrefix: 'v8_reveal', limit: 60 });
  if (!limit.allowed) {
    return jsonError(429, 'rate_limited', undefined, {
      headers: { 'retry-after': String(limit.retryAfter) }
    });
  }

  const url = new URL(req.url);

  // Read-only demo path for review (gated to the known canned personas). Returns
  // the same shape as a real reveal but skips the email gate, Turnstile, the
  // token and all side effects (no Brevo, no email). It is fixed demo content.
  const demo = url.searchParams.get('demo');
  if (demo) {
    const scenario = DEMO_SCENARIOS[demo];
    if (!scenario) return jsonError(404, 'unknown_demo');
    const answers = sanitiseAnswers(scenario);
    const profile = deriveProfile(answers);
    const insights = deriveRevealInsights(answers, profile, {
      name: 'James',
      brandName: 'Aubrey & Finch',
      calendarUrl: process.env.PUBLIC_CALENDAR_URL || ''
    });
    return json({
      ok: true,
      reveal: {
        name: 'James',
        email: '',
        profileKey: profile.key,
        score: profile.score,
        hurdle: profile.hurdle,
        bucket: profile.bucket,
        characterName: profile.characterName,
        pillars: profile.pillars,
        actionPlan: insights.summary.actionPlan,
        cards: insights.cards,
        summary: insights.summary,
        privacy: null,
        submittedAt: null,
        demo: true
      }
    });
  }

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

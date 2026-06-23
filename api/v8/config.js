import { json } from '../_lib/http.js';
import { publicTurnstileConfig } from '../_lib/turnstile.js';

export function GET() {
  const turnstile = publicTurnstileConfig();
  if (turnstile.enabled && !turnstile.configured) {
    return json({
      ok: false,
      error: 'bot_check_unconfigured',
      turnstile: {
        enabled: true,
        configured: false,
        siteKey: turnstile.siteKey,
        action: turnstile.action
      }
    }, { status: 503 });
  }

  return json({
    ok: true,
    turnstile: {
      enabled: turnstile.enabled,
      configured: turnstile.configured,
      siteKey: turnstile.siteKey,
      action: turnstile.action
    }
  });
}

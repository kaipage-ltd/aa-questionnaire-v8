import { json } from '../_lib/http.js';
import { publicDemoHarnessConfig } from '../_lib/demoHarness.js';
import { publicTurnstileConfig } from '../_lib/turnstile.js';

export function GET() {
  const turnstile = publicTurnstileConfig();
  const demoHarness = publicDemoHarnessConfig();
  if (turnstile.enabled && !turnstile.configured) {
    return json({
      ok: false,
      error: 'bot_check_unconfigured',
      demoHarness,
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
    demoHarness,
    turnstile: {
      enabled: turnstile.enabled,
      configured: turnstile.configured,
      siteKey: turnstile.siteKey,
      action: turnstile.action
    }
  });
}

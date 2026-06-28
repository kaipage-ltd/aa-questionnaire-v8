import assert from 'node:assert/strict';
import { test } from 'node:test';

import { POST as submit } from './submit.js';
import { GET as reveal } from './reveal.js';
import { GET as pdf } from './pdf.js';
import { GET as config } from './config.js';
import { deriveProfile, deriveRevealInsights, sanitiseAnswers } from '../_lib/profile.js';
import { localChromePath } from '../_lib/chromium.js';
import { EXPIRY_SECONDS } from '../_lib/jwt.js';

const answers = {
  Q1: 1,
  CC: [0, 1, 2],
  Q2: 0,
  Q3: 1,
  Q4: 1,
  Q5: 0,
  Q6: 1,
  Q7: 2,
  Q8: 2,
  Q9: 1,
  Q10: 1,
  Q11: 1,
  Q12: 1,
  Q13: 2,
  Q14: [3, 5],
  Q15: 1,
  Q16: 1,
  Q17: 0,
  Q18: 1,
  SP: [0, 3]
};

const privacy = {
  accepted: true,
  version: '2026-06-25',
  noticeUrl: '/privacy/'
};

let ipCounter = 10;

function nextIp() {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}

function postJson(url, body, headers = {}) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': nextIp(), ...headers },
    body: JSON.stringify(body)
  });
}

function clearBrevoEnv() {
  delete process.env.BREVO_API_KEY;
  delete process.env.BREVO_LIST_ID;
  delete process.env.BREVO_TEMPLATE_ID;
  delete process.env.BREVO_SENDER_EMAIL;
  delete process.env.BREVO_SENDER_NAME;
  delete process.env.BREVO_REPLY_TO_EMAIL;
  clearTurnstileEnv();
}

function clearTurnstileEnv() {
  delete process.env.TURNSTILE_SITE_KEY;
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.TURNSTILE_ALLOWED_HOSTNAMES;
  delete process.env.TURNSTILE_REQUIRED;
  delete process.env.VERCEL_ENV;
}

function enableTurnstile() {
  process.env.TURNSTILE_SITE_KEY = 'test-site-key';
  process.env.TURNSTILE_SECRET_KEY = 'test-secret-key';
  process.env.TURNSTILE_ALLOWED_HOSTNAMES = 'v8.example.test';
  process.env.TURNSTILE_REQUIRED = 'true';
}

test('submit issues a reveal token and printable profile URL', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();

  const response = await submit(postJson('https://v8.example.test/api/v8/submit', {
    name: 'Kai Page',
    email: 'Kai.Page@Example.com',
    answers,
    privacy
  }));
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.emailSent, false);
  assert.equal(body.emailResult.provider, 'brevo');
  assert.equal(body.emailResult.skipped, 'email_not_configured');
  assert.match(body.revealUrl, /^https:\/\/v8\.example\.test\/reveal\/\?token=/);
  assert.match(body.pdfUrl, /^https:\/\/v8\.example\.test\/api\/v8\/pdf\?token=/);
  const token = new URL(body.revealUrl).searchParams.get('token');
  assert.match(token, /^v8s1\./);
  assert.equal(token.split('.').length, 3);
  assert.equal(body.profile.key, 's-ve');
  assert.equal(body.profile.characterName, 'The Lagging Tanker');
  assert.equal(body.actionPlan.artefactName, 'Decision Path Timing Map');
  assert.match(body.actionPlan.mondayMove, /recurring decision/i);
  assert.equal(body.privacy.accepted, true);
  assert.equal(body.privacy.version, '2026-06-25');
  assert.equal(body.privacy.noticeUrl, '/privacy/');
  assert.equal(body.privacy.acceptedAt, body.submittedAt);
});

test('submit requires privacy acknowledgement', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();

  const response = await submit(postJson('https://v8.example.test/api/v8/submit', {
    name: 'Kai Page',
    email: 'kai@example.com',
    answers
  }));
  assert.equal(response.status, 400);

  const body = await response.json();
  assert.deepEqual(body, { error: 'privacy_required' });
});

test('config exposes public Turnstile settings only when configured', async () => {
  clearTurnstileEnv();

  let response = config(new Request('https://v8.example.test/api/v8/config'));
  let body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.turnstile, {
    enabled: false,
    configured: false,
    siteKey: null,
    action: 'v8-submit'
  });

  enableTurnstile();
  response = config(new Request('https://v8.example.test/api/v8/config'));
  body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.turnstile, {
    enabled: true,
    configured: true,
    siteKey: 'test-site-key',
    action: 'v8-submit'
  });

  clearTurnstileEnv();
});

test('submit accepts a valid Turnstile token when bot protection is enabled', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();
  enableTurnstile();

  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.equal(init.method, 'POST');
    const payload = JSON.parse(init.body);
    assert.equal(payload.secret, 'test-secret-key');
    assert.equal(payload.response, 'token-ok');
    assert.match(payload.remoteip, /^203\.0\.113\./);
    return Response.json({
      success: true,
      hostname: 'v8.example.test',
      action: 'v8-submit',
      challenge_ts: '2026-06-04T12:00:00Z'
    });
  };

  try {
    const response = await submit(postJson('https://v8.example.test/api/v8/submit', {
      name: 'Kai Page',
      email: 'kai@example.com',
      answers,
      privacy,
      botCheck: { provider: 'turnstile', token: 'token-ok' }
    }));
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.ok, true);
    assert.match(body.revealUrl, /^https:\/\/v8\.example\.test\/reveal\/\?token=/);
  } finally {
    globalThis.fetch = realFetch;
    clearTurnstileEnv();
  }
});

test('submit requires a Turnstile token when bot protection is enabled', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();
  enableTurnstile();

  try {
    const response = await submit(postJson('https://v8.example.test/api/v8/submit', {
      name: 'Kai Page',
      email: 'kai@example.com',
      answers,
      privacy
    }));
    assert.equal(response.status, 400);

    const body = await response.json();
    assert.deepEqual(body, { error: 'bot_check_required' });
  } finally {
    clearTurnstileEnv();
  }
});

test('submit requires Turnstile automatically in production', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();
  process.env.VERCEL_ENV = 'production';

  try {
    const response = await submit(postJson('https://v8.example.test/api/v8/submit', {
      name: 'Kai Page',
      email: 'kai@example.com',
      answers,
      privacy
    }));
    assert.equal(response.status, 503);

    const body = await response.json();
    assert.deepEqual(body, { error: 'bot_check_unconfigured' });
  } finally {
    clearTurnstileEnv();
  }
});

test('submit rejects invalid Turnstile tokens without exposing provider details', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();
  enableTurnstile();

  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    success: false,
    'error-codes': ['invalid-input-response']
  });

  try {
    const response = await submit(postJson('https://v8.example.test/api/v8/submit', {
      name: 'Kai Page',
      email: 'kai@example.com',
      answers,
      privacy,
      botCheck: { provider: 'turnstile', token: 'bad-token' }
    }));
    assert.equal(response.status, 403);

    const body = await response.json();
    assert.deepEqual(body, { error: 'bot_check_failed' });
  } finally {
    globalThis.fetch = realFetch;
    clearTurnstileEnv();
  }
});

test('submit rejects Turnstile action and hostname mismatches', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();
  enableTurnstile();

  const realFetch = globalThis.fetch;
  const outcomes = [
    { success: true, hostname: 'v8.example.test', action: 'other-action' },
    { success: true, hostname: 'attacker.example', action: 'v8-submit' }
  ];
  globalThis.fetch = async () => Response.json(outcomes.shift());

  try {
    for (const token of ['wrong-action', 'wrong-host']) {
      const response = await submit(postJson('https://v8.example.test/api/v8/submit', {
        name: 'Kai Page',
        email: `${token}@example.com`,
        answers,
        privacy,
        botCheck: { provider: 'turnstile', token }
      }));
      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), { error: 'bot_check_failed' });
    }
  } finally {
    globalThis.fetch = realFetch;
    clearTurnstileEnv();
  }
});

test('submit returns a generic unavailable error when Turnstile cannot be reached', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();
  enableTurnstile();

  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('network detail');
  };

  try {
    const response = await submit(postJson('https://v8.example.test/api/v8/submit', {
      name: 'Kai Page',
      email: 'kai@example.com',
      answers,
      privacy,
      botCheck: { provider: 'turnstile', token: 'token-ok' }
    }));
    assert.equal(response.status, 503);

    const body = await response.json();
    assert.deepEqual(body, { error: 'bot_check_unavailable' });
  } finally {
    globalThis.fetch = realFetch;
    clearTurnstileEnv();
  }
});

test('submit fails closed when Turnstile is required but not configured', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();
  process.env.TURNSTILE_REQUIRED = 'true';

  try {
    const response = await submit(postJson('https://v8.example.test/api/v8/submit', {
      name: 'Kai Page',
      email: 'kai@example.com',
      answers,
      privacy,
      botCheck: { provider: 'turnstile', token: 'token-ok' }
    }));
    assert.equal(response.status, 503);

    const body = await response.json();
    assert.deepEqual(body, { error: 'bot_check_unconfigured' });
  } finally {
    clearTurnstileEnv();
  }
});

test('submit requires a configured public site URL in production', async () => {
  process.env.JWT_SECRET = 'test-secret';
  clearBrevoEnv();
  enableTurnstile();
  process.env.VERCEL_ENV = 'production';
  delete process.env.PUBLIC_SITE_URL;

  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    success: true,
    hostname: 'v8.example.test',
    action: 'v8-submit'
  });

  try {
    const response = await submit(postJson('https://v8.example.test/api/v8/submit', {
      name: 'Kai Page',
      email: 'kai@example.com',
      answers,
      privacy,
      botCheck: { provider: 'turnstile', token: 'token-ok' }
    }));
    assert.equal(response.status, 500);

    const body = await response.json();
    assert.deepEqual(body, { error: 'site_url_unconfigured' });
  } finally {
    globalThis.fetch = realFetch;
    clearTurnstileEnv();
  }
});

test('submit rejects non-origin public site URLs', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test/path?x=1';
  clearBrevoEnv();

  try {
    const response = await submit(postJson('https://v8.example.test/api/v8/submit', {
      name: 'Kai Page',
      email: 'kai@example.com',
      answers,
      privacy
    }));
    assert.equal(response.status, 500);

    const body = await response.json();
    assert.deepEqual(body, { error: 'site_url_unconfigured' });
  } finally {
    delete process.env.PUBLIC_SITE_URL;
  }
});

test('submit does not expose provider error details to the browser', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  process.env.BREVO_API_KEY = 'brevo_test_key';
  process.env.BREVO_LIST_ID = '42';
  process.env.BREVO_TEMPLATE_ID = '7';
  process.env.BREVO_SENDER_EMAIL = 'profile@send.atelierandavenue.com';

  const realFetch = globalThis.fetch;
  const realConsoleError = console.error;
  const logged = [];
  globalThis.fetch = async () => new Response('brevo-secret-detail', { status: 500 });
  console.error = (...args) => logged.push(args.map((arg) => String(arg)).join(' '));
  try {
    const response = await submit(postJson('https://v8.example.test/api/v8/submit', {
      name: 'Kai Page',
      email: 'kai@example.com',
      answers,
      privacy
    }));
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.emailSent, false);
    assert.deepEqual(body.emailResult, {
      sent: false,
      provider: 'brevo',
      error: 'email_delivery_failed'
    });
    assert.equal(JSON.stringify(body).includes('brevo-secret-detail'), false);
    assert.equal(logged.some((line) => line.includes('brevo-secret-detail')), false);
  } finally {
    globalThis.fetch = realFetch;
    console.error = realConsoleError;
    clearBrevoEnv();
  }
});

test('submit syncs a Brevo contact and sends the transactional template when configured', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  process.env.BREVO_API_KEY = 'brevo_test_key';
  process.env.BREVO_LIST_ID = '42';
  process.env.BREVO_TEMPLATE_ID = '7';
  process.env.BREVO_SENDER_EMAIL = 'profile@send.atelierandavenue.com';
  process.env.BREVO_SENDER_NAME = 'Atelier & Avenue';
  process.env.BREVO_REPLY_TO_EMAIL = 'hello@atelierandavenue.com';

  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({
      url: String(url),
      method: init.method,
      headers: init.headers,
      body: JSON.parse(init.body)
    });
    if (String(url).endsWith('/contacts')) {
      return Response.json({ id: 123 }, { status: 201 });
    }
    if (String(url).endsWith('/smtp/email')) {
      return Response.json({ messageId: '<message-id@example.test>' }, { status: 201 });
    }
    return new Response('unexpected-url', { status: 404 });
  };

  try {
    const response = await submit(postJson('https://v8.example.test/api/v8/submit', {
      name: 'Kai Page',
      email: 'Kai.Page@Example.com',
      answers,
      privacy
    }));
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.emailSent, true);
    assert.deepEqual(body.emailResult, {
      sent: true,
      provider: 'brevo',
      contactSynced: true
    });

    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, 'https://api.brevo.com/v3/contacts');
    assert.equal(calls[0].headers['api-key'], 'brevo_test_key');
    assert.deepEqual(calls[0].body.listIds, [42]);
    assert.equal(calls[0].body.updateEnabled, true);
    assert.equal(calls[0].body.email, 'kai.page@example.com');
    assert.equal(calls[0].body.attributes.AA_REVEAL_URL, body.revealUrl);
    assert.equal(calls[0].body.attributes.AA_PDF_URL, body.pdfUrl);
    assert.equal(calls[0].body.attributes.AA_PROFILE_NAME, 'The Lagging Tanker');
    assert.equal(calls[0].body.attributes.AA_PROFILE_SCORE, String(body.profile.score));
    assert.equal(calls[0].body.attributes.FIRSTNAME, 'Kai');

    assert.equal(calls[1].url, 'https://api.brevo.com/v3/smtp/email');
    assert.deepEqual(calls[1].body.sender, {
      email: 'profile@send.atelierandavenue.com',
      name: 'Atelier & Avenue'
    });
    assert.deepEqual(calls[1].body.replyTo, {
      email: 'hello@atelierandavenue.com',
      name: 'Atelier & Avenue'
    });
    assert.deepEqual(calls[1].body.to, [{ email: 'kai.page@example.com', name: 'Kai Page' }]);
    assert.equal(calls[1].body.templateId, 7);
    assert.equal(calls[1].body.attachment, undefined, 'PDF must not be attached; the email links the tokenized PDF URL');
    assert.equal(calls[1].body.params.revealUrl, body.revealUrl);
    assert.equal(calls[1].body.params.pdfUrl, body.pdfUrl);
    assert.equal(calls[1].body.params.profileName, 'The Lagging Tanker');
    assert.equal(calls[1].body.params.actionPlanArtefactName, 'Decision Path Timing Map');
    assert.match(calls[1].body.params.actionPlanMondayMove, /recurring decision/i);
  } finally {
    globalThis.fetch = realFetch;
    clearBrevoEnv();
  }
});

test('submit normalises user-controlled identity strings before sealing the token', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();

  const submitted = await submit(postJson('https://v8.example.test/api/v8/submit', {
    name: '  Kai\u0000\nPage  ',
    email: '  Kai.Page@Example.com  ',
    company: '  Aubrey\u0007   Finch  ',
    answers,
    privacy
  }));
  assert.equal(submitted.status, 200);
  const submittedBody = await submitted.json();

  const response = await reveal(new Request(submittedBody.revealUrl));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.reveal.name, 'Kai Page');
  assert.equal(body.reveal.email, 'kai.page@example.com');
  assert.equal(body.reveal.summary.brandName, 'Aubrey Finch');
});

test('reveal route resolves a submitted token', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();

  const submitted = await submit(postJson('https://v8.example.test/api/v8/submit', {
    name: 'Kai Page',
    email: 'kai@example.com',
    answers,
    privacy
  }));
  const submittedBody = await submitted.json();

  const response = await reveal(new Request(submittedBody.revealUrl));
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.reveal.email, 'kai@example.com');
  assert.equal(body.reveal.profileKey, 's-ve');
  assert.equal(body.reveal.characterName, 'The Lagging Tanker');
  assert.equal(body.reveal.actionPlan.artefactName, 'Decision Path Timing Map');
  assert.equal(body.reveal.pillars.length, 4);
  assert.equal(Array.isArray(body.reveal.cards), true);
  assert.equal(body.reveal.cards.length, 8);
  assert.equal(body.reveal.cards[0].type, 'turn');
  const quotePeak = body.reveal.cards.find((card) => card.type === 'quote');
  assert.equal(quotePeak.peak, 1);
  assert.ok(body.reveal.cards.find((card) => card.type === 'hurdle').receipts.some((receipt) => receipt.includes('opportunity stays open')));
  assert.equal(body.reveal.cards.find((card) => card.type === 'quote').quote, 'Analysis takes longer than the opportunity window allows.');
  assert.match(body.reveal.cards.find((card) => card.type === 'shape').body, /Velocity|gap|delay/);
  assert.equal(body.reveal.summary.persona, 'The Lagging Tanker');
  assert.equal(body.reveal.summary.actionPlan.artefactName, body.reveal.actionPlan.artefactName);
  assert.equal(body.reveal.privacy.version, '2026-06-25');
  assert.equal(body.reveal.privacy.noticeUrl, '/privacy/');
  assert.equal('answers' in body.reveal, false);
});

test('reveal demo path returns cards without a token or submit (no Turnstile/email)', async () => {
  const response = await reveal(new Request('https://v8.example.test/api/v8/reveal?demo=t-ve'));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.reveal.demo, true);
  assert.equal(body.reveal.characterName, 'The Late Caller');
  assert.equal(body.reveal.email, '');
  assert.equal(body.reveal.cards.length, 8);
  assert.equal(body.reveal.cards[0].type, 'turn');
  assert.equal('answers' in body.reveal, false);

  const unknown = await reveal(new Request('https://v8.example.test/api/v8/reveal?demo=not-a-key'));
  assert.equal(unknown.status, 404);
});

test('single-channel respondents can still surface a material Coherence hurdle', () => {
  const cleaned = sanitiseAnswers({
    Q1: 1,
    CC: [0],
    Q2: 0,
    Q3: 0,
    Q4: 0,
    Q5: 0,
    Q6: 0,
    Q7: 0,
    Q8: 0,
    Q9: 0,
    Q10: 3,
    Q11: 3,
    Q12: 3,
    Q13: 3,
    Q14: [6],
    Q15: 0,
    Q16: 0,
    Q17: 0,
    Q18: 0,
    SP: [0]
  });
  const profile = deriveProfile(cleaned);

  assert.equal(profile.key, 's-co');
  assert.equal(profile.hurdle, 'Coherence');
  assert.equal(profile.pillars.find((pillar) => pillar.label === 'Coherence').value, 0);
});

test('exclusive multi-select answers are sanitised conservatively', () => {
  const cleaned = sanitiseAnswers({
    CC: [0],
    Q14: [0, 7],
    SP: [0, 11]
  });

  assert.deepEqual(cleaned.Q14, [0]);
  assert.deepEqual(cleaned.SP, [0]);
});

test('all-strong reveals keep calibrated shape copy and the plain constraint beat', () => {
  const cleaned = sanitiseAnswers({
    Q1: 1,
    CC: [0],
    Q2: 0,
    Q3: 0,
    Q4: 0,
    Q5: 0,
    Q6: 0,
    Q7: 0,
    Q8: 0,
    Q9: 0,
    Q10: 0,
    Q11: 0,
    Q12: 0,
    Q13: 0,
    Q14: [7],
    Q15: 0,
    Q16: 0,
    Q17: 0,
    Q18: 0,
    SP: [11]
  });
  const profile = deriveProfile(cleaned);
  const insights = deriveRevealInsights(cleaned, profile, { name: 'Kai' });
  const shape = insights.cards.find((card) => card.type === 'shape');
  const hurdle = insights.cards.find((card) => card.type === 'hurdle');
  const quote = insights.cards.find((card) => card.type === 'quote');

  assert.equal(profile.score, 100);
  assert.match(shape.body, /choose the first rule/i);
  assert.doesNotMatch(shape.body, /thin|collapse/i);
  assert.equal(hurdle.lede, "You have the numbers. You can't *trust* them.");
  assert.equal(hurdle.close, 'First leak: Visibility');
  assert.match(hurdle.tail, /profile is strong/i);
  assert.match(quote.implication, /selected that as a strength/i);
});

test('balanced mid-strength reveals keep calibrated shape copy and the plain constraint beat', () => {
  const cleaned = sanitiseAnswers({
    Q1: 1,
    CC: [0, 1],
    Q2: 1,
    Q3: 1,
    Q4: 1,
    Q5: 1,
    Q6: 1,
    Q7: 1,
    Q8: 1,
    Q9: 1,
    Q10: 1,
    Q11: 1,
    Q12: 1,
    Q13: 1,
    Q14: [3],
    Q15: 1,
    Q16: 1,
    Q17: 1,
    Q18: 1,
    SP: [11]
  });
  const profile = deriveProfile(cleaned);
  const insights = deriveRevealInsights(cleaned, profile, { name: 'Kai' });
  const shape = insights.cards.find((card) => card.type === 'shape');
  const hurdle = insights.cards.find((card) => card.type === 'hurdle');

  assert.equal(profile.score, 66);
  assert.match(shape.body, /sharpening job/i);
  assert.doesNotMatch(shape.body, /thin|collapse/i);
  assert.equal(hurdle.lede, "You have the numbers. You can't *trust* them.");
  assert.equal(hurdle.close, 'First leak: Visibility');
  assert.match(hurdle.tail, /first move is a small rule/i);
});

test('reveal route returns a generic error for invalid tokens', async () => {
  process.env.JWT_SECRET = 'test-secret';

  const response = await reveal(new Request('https://v8.example.test/api/v8/reveal?token=bad'));
  assert.equal(response.status, 401);

  const body = await response.json();
  assert.deepEqual(body, { error: 'invalid_token' });
});

test('expired reveal tokens do not expose verification details', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();

  const realNow = Date.now;
  let submitted;
  try {
    Date.now = () => 1_700_000_000_000;
    submitted = await submit(postJson('https://v8.example.test/api/v8/submit', {
      name: 'Kai Page',
      email: 'kai@example.com',
      answers,
      privacy
    }));
  } finally {
    Date.now = realNow;
  }

  const submittedBody = await submitted.json();
  const response = await reveal(new Request(submittedBody.revealUrl));
  assert.equal(response.status, 401);

  const body = await response.json();
  assert.deepEqual(body, { error: 'invalid_token' });
});

test('reveal tokens expire after the 14-day privacy window', async () => {
  assert.equal(EXPIRY_SECONDS, 14 * 24 * 60 * 60);
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();

  const realNow = Date.now;
  let submittedBody;
  try {
    Date.now = () => 1_800_000_000_000;
    const submitted = await submit(postJson('https://v8.example.test/api/v8/submit', {
      name: 'Kai Page',
      email: 'kai@example.com',
      answers,
      privacy
    }));
    submittedBody = await submitted.json();

    Date.now = () => 1_800_000_000_000 + (14 * 24 * 60 * 60 * 1000) - 1000;
    let response = await reveal(new Request(submittedBody.revealUrl));
    assert.equal(response.status, 200);

    Date.now = () => 1_800_000_000_000 + (14 * 24 * 60 * 60 * 1000) + 1000;
    response = await reveal(new Request(submittedBody.revealUrl));
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'invalid_token' });
  } finally {
    Date.now = realNow;
  }
});

test('reveal and PDF reject oversized tokens before verification work', async () => {
  process.env.JWT_SECRET = 'test-secret';
  const tooLarge = `v8s1.${'a'.repeat(9000)}.x`;

  let response = await reveal(new Request(`https://v8.example.test/api/v8/reveal?token=${tooLarge}`));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'invalid_token' });

  response = await pdf(new Request(`https://v8.example.test/api/v8/pdf?token=${tooLarge}`));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'invalid_token' });
});

test('reveal and PDF apply best-effort per-client rate limits', async () => {
  const revealIp = nextIp();
  let response;
  for (let i = 0; i < 61; i += 1) {
    response = await reveal(new Request('https://v8.example.test/api/v8/reveal', {
      headers: { 'x-forwarded-for': revealIp }
    }));
  }
  assert.equal(response.status, 429);
  assert.equal(response.headers.has('retry-after'), true);
  assert.deepEqual(await response.json(), { error: 'rate_limited' });

  const pdfIp = nextIp();
  for (let i = 0; i < 9; i += 1) {
    response = await pdf(new Request('https://v8.example.test/api/v8/pdf', {
      headers: { 'x-forwarded-for': pdfIp }
    }));
  }
  assert.equal(response.status, 429);
  assert.equal(response.headers.has('retry-after'), true);
  assert.deepEqual(await response.json(), { error: 'rate_limited' });
});

test('submit rejects oversized JSON bodies', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();

  const response = await submit(new Request('https://v8.example.test/api/v8/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': nextIp() },
    body: JSON.stringify({
      name: 'Kai Page',
      email: 'kai@example.com',
      answers,
      privacy,
      padding: 'x'.repeat(40 * 1024)
    })
  }));

  assert.equal(response.status, 413);
  const body = await response.json();
  assert.deepEqual(body, { error: 'invalid_body' });
});

test('submit applies a best-effort per-client rate limit', async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();
  const ip = nextIp();

  let response;
  for (let i = 0; i < 13; i += 1) {
    response = await submit(postJson('https://v8.example.test/api/v8/submit', {
      name: 'Kai Page',
      email: `kai.${i}@example.com`,
      answers,
      privacy
    }, { 'x-forwarded-for': ip }));
  }

  assert.equal(response.status, 429);
  assert.equal(response.headers.has('retry-after'), true);
  const body = await response.json();
  assert.deepEqual(body, { error: 'rate_limited' });
});

// Chromium-backed: only runs where a local Chrome exists (see chromium.js); CI
// boxes without a browser skip it. Deeper per-profile rendering assertions live
// in pdf_render.test.js.
test('pdf route returns a binary PDF for a submitted token', { skip: !localChromePath() && 'no local Chrome available' }, async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PUBLIC_SITE_URL = 'https://v8.example.test';
  clearBrevoEnv();

  const submitted = await submit(postJson('https://v8.example.test/api/v8/submit', {
    name: 'Kai Page',
    email: 'kai@example.com',
    answers,
    privacy
  }));
  const submittedBody = await submitted.json();

  const response = await pdf(new Request(submittedBody.pdfUrl));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/pdf/);
  assert.match(response.headers.get('content-disposition'), /ai-readiness-profile\.pdf/);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');

  const bytes = new Uint8Array(await response.arrayBuffer());
  const header = new TextDecoder().decode(bytes.slice(0, 5));
  assert.equal(header, '%PDF-');
  const { PDFDocument } = await import('pdf-lib');
  const document = await PDFDocument.load(bytes);
  assert.equal(document.getPageCount(), 5);
  assert.ok(bytes.length > 1000);
});

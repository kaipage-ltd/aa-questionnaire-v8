const BREVO_API_BASE = 'https://api.brevo.com/v3';
const BREVO_TIMEOUT_MS = 8000;

export async function sendRevealEmail({ to, name, revealUrl, pdfUrl, profile, actionPlan = {}, submittedAt }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { sent: false, provider: 'brevo', skipped: 'BREVO_API_KEY not configured' };
  }

  const listId = optionalPositiveInt(process.env.BREVO_LIST_ID, 'BREVO_LIST_ID');
  const templateId = optionalPositiveInt(process.env.BREVO_TEMPLATE_ID, 'BREVO_TEMPLATE_ID');
  const senderEmail = clean(process.env.BREVO_SENDER_EMAIL);
  const senderName = clean(process.env.BREVO_SENDER_NAME) || 'Atelier & Avenue';
  const replyToEmail = clean(process.env.BREVO_REPLY_TO_EMAIL);
  const first = firstName(name);
  const submitted = submittedAt || new Date().toISOString();

  const attributes = {
    AA_REVEAL_URL: revealUrl,
    AA_PDF_URL: pdfUrl,
    AA_PROFILE_NAME: profile.characterName,
    AA_PROFILE_KEY: profile.key,
    AA_PROFILE_SCORE: String(profile.score),
    AA_PROFILE_HURDLE: profile.hurdle,
    AA_SUBMITTED_AT: submitted
  };

  if (first) attributes.FIRSTNAME = first;

  const contact = await upsertContact(apiKey, {
    email: to,
    attributes,
    listId
  });

  if (!templateId || !senderEmail) {
    return {
      sent: false,
      provider: 'brevo',
      contactSynced: true,
      contactId: contact.id || null,
      listId: listId || null,
      skipped: 'BREVO_TEMPLATE_ID or BREVO_SENDER_EMAIL not configured'
    };
  }

  const message = await sendTransactionalEmail(apiKey, {
    templateId,
    sender: { email: senderEmail, name: senderName },
    to: [{ email: to, name: clean(name) || undefined }],
    replyTo: replyToEmail ? { email: replyToEmail, name: senderName } : undefined,
    params: {
      name: clean(name),
      firstName: first,
      revealUrl,
      pdfUrl,
      profileName: profile.characterName,
      profileKey: profile.key,
      profileScore: String(profile.score),
      profileHurdle: profile.hurdle,
      actionPlanHeadline: clean(actionPlan.headline),
      actionPlanArtefactName: clean(actionPlan.artefactName),
      actionPlanMondayMove: clean(actionPlan.mondayMove),
      submittedAt: submitted
    }
  });

  return {
    sent: true,
    provider: 'brevo',
    mode: 'transactional_template',
    templateId,
    contactSynced: true,
    contactId: contact.id || null,
    listId: listId || null,
    messageId: message.messageId || null
  };
}

function upsertContact(apiKey, { email, attributes, listId }) {
  return brevoRequest(apiKey, '/contacts', {
    method: 'POST',
    body: {
      email,
      attributes,
      listIds: listId ? [listId] : undefined,
      updateEnabled: true
    }
  });
}

function sendTransactionalEmail(apiKey, { templateId, sender, to, replyTo, params }) {
  return brevoRequest(apiKey, '/smtp/email', {
    method: 'POST',
    body: {
      sender,
      to,
      replyTo,
      templateId,
      params
    }
  });
}

async function brevoRequest(apiKey, path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BREVO_TIMEOUT_MS);
  let res;

  try {
    res = await fetch(`${BREVO_API_BASE}${path}`, {
      method: options.method || 'GET',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: options.body ? JSON.stringify(removeUndefined(options.body)) : undefined,
      signal: controller.signal
    });
  } catch (err) {
    throw brevoFailure(err?.name === 'AbortError' ? 'timeout' : 'network_error');
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw brevoFailure(`status_${res.status}`, res.status);
  }

  if (res.status === 204) return {};
  return res.json().catch(() => ({}));
}

function brevoFailure(reason, status) {
  const err = new Error(status ? `Brevo API failed: ${status}` : `Brevo API failed: ${reason}`);
  err.provider = 'brevo';
  err.reason = reason;
  if (status) err.status = status;
  return err;
}

function optionalPositiveInt(value, name) {
  const trimmed = clean(value);
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`${name} must be a positive integer`);
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function firstName(name) {
  return clean(name).split(/\s+/)[0] || null;
}

function clean(value) {
  return String(value || '').trim();
}

function removeUndefined(value) {
  if (Array.isArray(value)) return value.map(removeUndefined);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, removeUndefined(item)])
  );
}

export const EXPIRY_SECONDS = 14 * 24 * 60 * 60;
export const MAX_REVEAL_TOKEN_LENGTH = 8192;
const TOKEN_VERSION = 'v8s1';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function requiredSecret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('Missing required environment variable: JWT_SECRET');
  return encoder.encode(value);
}

function base64url(bytes) {
  const input = typeof bytes === 'string' ? encoder.encode(bytes) : new Uint8Array(bytes);
  const bin = String.fromCharCode(...input);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, (char) => char.charCodeAt(0));
}

async function encryptionKey() {
  const digest = await crypto.subtle.digest('SHA-256', requiredSecret());
  return crypto.subtle.importKey(
    'raw',
    digest,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function signRevealPayload(payload) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + EXPIRY_SECONDS };
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(TOKEN_VERSION) },
    await encryptionKey(),
    encoder.encode(JSON.stringify(claims))
  );
  return `${TOKEN_VERSION}.${base64url(iv)}.${base64url(ciphertext)}`;
}

export async function verifyRevealPayload(token) {
  if (!isRevealTokenShape(token)) throw new Error('Malformed token');
  const parts = String(token).split('.');
  const [, ivPart, ciphertextPart] = parts;
  let payload;
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decodeBase64url(ivPart), additionalData: encoder.encode(TOKEN_VERSION) },
      await encryptionKey(),
      decodeBase64url(ciphertextPart)
    );
    payload = JSON.parse(decoder.decode(plaintext));
  } catch (err) {
    throw new Error('Invalid token');
  }
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token expired');
  }
  if (payload.typ !== 'v8:reveal') {
    throw new Error('Wrong token type: expected v8:reveal');
  }
  return payload;
}

export function isRevealTokenShape(token) {
  const value = String(token || '');
  if (!value || value.length > MAX_REVEAL_TOKEN_LENGTH) return false;
  const parts = value.split('.');
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return false;
  return parts.slice(1).every((part) => /^[A-Za-z0-9_-]+$/.test(part));
}

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const vercelIgnore = readFileSync(join(root, '.vercelignore'), 'utf8');

test('internal working artifacts are excluded from Vercel deployments', () => {
  for (const pattern of [
    '/security-audit-*.html',
    '/SECURITY_AUDIT_*.md',
    '/DNS_*.html',
    '/BREVO_*.html',
    '/REVEAL_*.md',
    '/HANDOFF_*.md',
    '/AGENT_FEEDBACK_LEDGER.md',
    '/reveal_copy_studio.html',
    '/combinations_review.html',
    '/.claude/',
    '/.agents/',
    '/output/'
  ]) {
    assert.ok(vercelIgnore.includes(pattern), `${pattern} must stay out of production deploys`);
  }
});

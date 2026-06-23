import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const vercelConfig = JSON.parse(readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'vercel.json'),
  'utf8'
));

test('Vercel serves the expected security headers', () => {
  const allHeaders = vercelConfig.headers
    .flatMap((entry) => entry.headers)
    .reduce((map, header) => map.set(header.key.toLowerCase(), header.value), new Map());

  assert.match(allHeaders.get('content-security-policy'), /default-src 'self'/);
  assert.equal(allHeaders.get('referrer-policy'), 'no-referrer');
  assert.equal(allHeaders.get('x-content-type-options'), 'nosniff');
  assert.equal(allHeaders.get('x-frame-options'), 'DENY');
  assert.equal(allHeaders.get('strict-transport-security'), 'max-age=31536000; includeSubDomains');
  assert.equal(allHeaders.get('cross-origin-opener-policy'), 'same-origin');
  assert.equal(allHeaders.get('cross-origin-resource-policy'), 'same-origin');
  assert.equal(allHeaders.get('origin-agent-cluster'), '?1');
  assert.equal(allHeaders.get('x-permitted-cross-domain-policies'), 'none');
});

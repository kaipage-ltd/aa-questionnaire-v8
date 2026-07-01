import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const appHtml = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'index.html'),
  'utf8'
);

test('sent-profile inbox CTA never falls back to the respondent company homepage', () => {
  assert.match(appHtml, /return \{ label: 'Open mail app', url: 'mailto:' \}/);
  assert.doesNotMatch(appHtml, /url: `https:\/\/\$\{domain\}`/);
  assert.match(appHtml, /inbox\.url\.startsWith\('mailto:'\)[\s\S]*?removeAttribute\('target'\)/);
  assert.match(appHtml, /inbox\.url\.startsWith\('mailto:'\)[\s\S]*?removeAttribute\('rel'\)/);
});

test('questionnaire demo URLs are ignored unless the review harness is enabled', () => {
  assert.match(appHtml, /window\.__AA_DEMO_HARNESS_ALLOWED__ = false/);
  assert.match(appHtml, /function resolveDemoHarnessAllowed/);
  assert.match(appHtml, /body\.demoHarness\?\.enabled/);
  assert.match(appHtml, /if \(!window\.__AA_DEMO_HARNESS_ALLOWED__\) return null;[\s\S]*?const key = pageParams\.get\('demo'\)/);
  assert.doesNotMatch(appHtml, /window\.__AA_DEMO_HARNESS_ALLOWED__ = \['localhost', '127\.0\.0\.1', '::1'\]\.includes/);
});

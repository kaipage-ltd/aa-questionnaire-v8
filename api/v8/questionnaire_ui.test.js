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

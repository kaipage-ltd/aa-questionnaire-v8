import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const studioPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'reveal_copy_studio.html');
const hasStudio = existsSync(studioPath);
const studioHtml = hasStudio ? readFileSync(studioPath, 'utf8') : '';

test('reveal copy studio is wired to the real demo reveal payload', {
  skip: hasStudio ? false : 'reveal_copy_studio.html is a local-only ignored artifact'
}, () => {
  assert.match(studioHtml, /Reveal Copy Studio/);
  assert.match(studioHtml, /\/api\/v8\/reveal\?demo=/);
  assert.match(studioHtml, /textarea/);
  assert.match(studioHtml, /Export critique/);
  assert.match(studioHtml, /Average required/);
  assert.match(studioHtml, /8\.5/);
  assert.match(studioHtml, /Lowest dimension/);
  assert.match(studioHtml, /7\.0/);
  for (const key of ['c-vi', 'c-ve', 'c-co', 't-vi', 't-ve', 't-co', 's-vi', 's-ve', 's-co']) {
    assert.match(studioHtml, new RegExp(`'${key}'`), `${key} must be available in the copy studio`);
  }
});

test('reveal copy studio exposes the full aa-content-score dimensions', {
  skip: hasStudio ? false : 'reveal_copy_studio.html is a local-only ignored artifact'
}, () => {
  for (const dimension of ['clarity', 'hierarchy', 'compression', 'tension', 'conversion', 'voice', 'wst', 'truth']) {
    assert.match(studioHtml, new RegExp(`'${dimension}'`), `${dimension} score must be editable`);
  }
  assert.doesNotMatch(studioHtml, /<strong>/, 'studio must not teach bold emphasis');
  assert.doesNotMatch(studioHtml, /—/, 'studio must not introduce em dashes');
});

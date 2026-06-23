// Drift guard: the PDF palette in design_tokens.js mirrors the reveal's :root
// custom properties by hand (the plain-HTML reveal cannot import a JS module
// into its <style> block). If someone retunes the reveal palette, this fails
// until design_tokens.js is updated to match.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TOKENS } from '../_lib/design_tokens.js';

test('PDF design tokens match the reveal palette', () => {
  const revealHtml = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'reveal', 'index.html'),
    'utf8'
  );
  const rootBlock = revealHtml.match(/:root\s*\{([\s\S]*?)\}/)?.[1] || '';
  for (const [name, hex] of Object.entries(TOKENS)) {
    assert.equal(rootBlock.includes(hex), true, `token ${name} (${hex}) missing from reveal :root`);
  }
});

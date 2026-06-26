// The on-screen reveal now lives in the dark cinematic world (light type on the
// continuous atmosphere). The PDF is a printed leave-behind, so it stays on the
// light brand palette. The two surfaces intentionally diverge, so this guards
// the PDF palette (api/_lib/design_tokens.js) directly rather than mirroring the
// reveal's :root.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TOKENS } from '../_lib/design_tokens.js';

test('PDF keeps the light brand palette (a printed report stays on paper)', () => {
  const expected = {
    paper: '#f7f3ed',     // cream surface
    paperDim: '#efeae0',
    ink: '#22211f',       // ink text
    inkSoft: '#4d4c4a',
    inkFaint: '#918f8c',
    rule: '#dcd5c7',
    dark: '#1c1b18',      // warm near-black band
    darkSoft: '#bdbab5',
    darkFaint: '#8a8782'
  };
  for (const [name, hex] of Object.entries(expected)) {
    assert.equal(TOKENS[name], hex, `PDF token ${name} drifted from the light brand palette`);
  }
});

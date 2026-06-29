// Per Kai's 2026-06-28 feedback, the PDF now mirrors the dark cinematic reveal
// instead of staying on a separate light printed-report palette. Keep this guard
// so future edits do not silently drift the report back to cream.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TOKENS_DARK } from '../_lib/design_tokens.js';

test('PDF keeps the dark cinematic reveal palette', () => {
  const expected = {
    bg: '#0b0805',
    paper: '#f7f3ed',
    ink: '#f3ead9',
    inkSoft: 'rgba(243,234,217,0.74)',
    inkFaint: 'rgba(243,234,217,0.42)',
    rule: 'rgba(243,234,217,0.18)',
    dark: '#1c1b18',
    darkSoft: '#bdbab5',
    darkFaint: '#8a8782'
  };
  for (const [name, hex] of Object.entries(expected)) {
    assert.equal(TOKENS_DARK[name], hex, `PDF token ${name} drifted from the dark reveal palette`);
  }
});

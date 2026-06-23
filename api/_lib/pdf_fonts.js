// Brand fonts embedded as base64 data URIs so the PDF renders identically in a
// lambda with no network and no system fonts. Files live in pdf_assets/fonts/
// (same faces the reveal self-hosts) alongside their OFL licences.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'pdf_assets', 'fonts');

function b64(file) {
  return readFileSync(join(FONT_DIR, file)).toString('base64');
}

let cached;
export function fontFaceCss() {
  cached ??= `
  @font-face {
    font-family: 'Newsreader';
    font-style: normal;
    font-weight: 200 800;
    src: url(data:font/ttf;base64,${b64('Newsreader[opsz,wght].ttf')}) format('truetype-variations');
  }
  @font-face {
    font-family: 'Newsreader';
    font-style: italic;
    font-weight: 200 800;
    src: url(data:font/ttf;base64,${b64('Newsreader-Italic[opsz,wght].ttf')}) format('truetype-variations');
  }
  @font-face {
    font-family: 'Geist Mono';
    font-style: normal;
    font-weight: 100 900;
    src: url(data:font/ttf;base64,${b64('GeistMono-Variable.ttf')}) format('truetype-variations');
  }`;
  return cached;
}

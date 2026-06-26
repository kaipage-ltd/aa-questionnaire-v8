// Brand fonts embedded as base64 data URIs so the PDF renders identically in a
// lambda with no network and no system fonts. Files live in pdf_assets/fonts/
// (the same Instrument faces the reveal and questionnaire self-host).
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
    font-family: 'Instrument Serif';
    font-style: normal;
    font-weight: 400;
    src: url(data:font/ttf;base64,${b64('InstrumentSerif-Regular.ttf')}) format('truetype');
  }
  @font-face {
    font-family: 'Instrument Serif';
    font-style: italic;
    font-weight: 400;
    src: url(data:font/ttf;base64,${b64('InstrumentSerif-Italic.ttf')}) format('truetype');
  }
  @font-face {
    font-family: 'Instrument Sans';
    font-style: normal;
    font-weight: 400 600;
    src: url(data:font/ttf;base64,${b64('InstrumentSans-Variable.ttf')}) format('truetype-variations');
  }`;
  return cached;
}

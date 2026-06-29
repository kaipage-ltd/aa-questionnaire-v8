import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const IMG_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', 'img');

export const PDF_BACKGROUNDS = {
  cover: { name: 'hero-archway', position: 'center 36%' },
  shape: { name: 'colonnade', position: 'center 50%' },
  evidence: { name: 'marble-sphere', position: 'center 45%' },
  cost: { name: 'quiet-after-storm', position: 'center 48%' },
  firstMove: { name: 'sunny-sea', position: 'center 48%' }
};

const cache = new Map();

export function pdfImage(name) {
  if (!cache.has(name)) {
    const data = readFileSync(join(IMG_DIR, `${name}.jpg`)).toString('base64');
    cache.set(name, `data:image/jpeg;base64,${data}`);
  }
  return cache.get(name);
}

export function sheetStyle(key) {
  const spec = PDF_BACKGROUNDS[key];
  if (!spec) return '';
  return ` style="--bg-img:url('${pdfImage(spec.name)}');--bg-pos:${spec.position};"`;
}

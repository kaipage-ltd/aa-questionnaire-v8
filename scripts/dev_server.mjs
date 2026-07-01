// Local dev server: serves the static app plus the /api/v8/* handlers so the
// questionnaire, reveal and PDF can be exercised without a Vercel deploy.
// Usage: node scripts/dev_server.mjs [port]   (default 4870)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.JWT_SECRET ||= 'local-dev-secret-not-for-production';
process.env.ALLOW_DEMO_HARNESS ||= 'true';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const port = Number(process.argv[2]) || 4870;
process.env.PUBLIC_SITE_URL ||= `http://localhost:${port}`;

const routes = {
  'POST /api/v8/submit': async () => (await import('../api/v8/submit.js')).POST,
  'GET /api/v8/reveal': async () => (await import('../api/v8/reveal.js')).GET,
  'GET /api/v8/pdf': async () => (await import('../api/v8/pdf.js')).GET,
  'GET /api/v8/config': async () => (await import('../api/v8/config.js')).GET
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf'
};

async function serveStatic(res, urlPath) {
  let path = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, '');
  if (path.includes('..')) { res.writeHead(403); res.end(); return; }
  const candidates = [path, join(path, 'index.html'), `${path}.html`].filter(Boolean);
  if (path === '') candidates.unshift('index.html');
  for (const candidate of candidates) {
    try {
      const data = await readFile(join(root, candidate));
      res.writeHead(200, { 'content-type': MIME[extname(candidate)] || 'application/octet-stream' });
      res.end(data);
      return;
    } catch { /* try next candidate */ }
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('Not found');
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  const key = `${req.method} ${url.pathname}`;
  const loadHandler = routes[key];

  if (loadHandler) {
    try {
      const handler = await loadHandler();
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') headers.set(name, value);
      }
      // Unique client key per request so the in-memory rate limiter never trips local walkthroughs.
      headers.set('x-forwarded-for', `127.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`);
      const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : req;
      const request = new Request(url, { method: req.method, headers, body, duplex: 'half' });
      const response = await handler(request);
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      const buffer = Buffer.from(await response.arrayBuffer());
      res.end(buffer);
    } catch (err) {
      console.error(`handler ${key} failed`, err);
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'local_handler_failed', detail: String(err?.message || err) }));
    }
    return;
  }

  await serveStatic(res, url.pathname);
});

server.listen(port, () => {
  console.log(`dev server on http://localhost:${port}`);
  console.log(`reveal demo:  http://localhost:${port}/reveal/?demoNav=1`);
});

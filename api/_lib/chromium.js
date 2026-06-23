// Headless Chromium launcher. On Vercel/Lambda the @sparticuz/chromium binary is
// lazy-imported so local tests and the submit bundle never touch it. Locally we
// use an installed Chrome (override with PUPPETEER_EXECUTABLE_PATH).
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const LOCAL_CHROME_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser'
].filter(Boolean);

export function localChromePath() {
  return LOCAL_CHROME_PATHS.find((path) => existsSync(path)) || null;
}

export async function launchBrowser() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: 'shell'
    });
  }
  const executablePath = localChromePath();
  if (!executablePath) {
    throw new Error('No local Chrome found. Set PUPPETEER_EXECUTABLE_PATH to a Chrome/Chromium binary.');
  }
  return puppeteer.launch({ executablePath, headless: true });
}

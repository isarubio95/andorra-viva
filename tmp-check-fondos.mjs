import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => {
  if (m.type() === 'error') errors.push('CONSOLE: ' + m.text());
});

await page.goto('http://localhost:4005/admin/fondos', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

const info = await page.evaluate(() => ({
  url: location.href,
  rootLen: document.getElementById('root')?.innerHTML.length ?? 0,
  text: document.body.innerText.slice(0, 400),
}));

console.log(JSON.stringify({ info, errors: errors.slice(0, 12) }, null, 2));
console.log('ENVKEYS', Object.keys(env).join(','));
await page.screenshot({ path: 'tmp-fondos.png', fullPage: false });
await browser.close();

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PAGE_URL = 'http://localhost:5173/';
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../design-export');

async function exportTheme(browser, theme) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript((t) => {
    localStorage.setItem('theme', t);
  }, theme);
  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });

  // let entrance animations / lazy images settle
  await page.waitForTimeout(1500);
  await page.evaluate(async () => {
    // scroll through the page once to trigger any in-view / lazy-load animations
    const step = window.innerHeight;
    const max = document.body.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 200));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);

  const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);

  await page.emulateMedia({ media: 'screen' });
  const outPath = path.join(OUT_DIR, `home-${theme}.pdf`);
  await page.pdf({
    path: outPath,
    width: '1440px',
    height: `${fullHeight}px`,
    printBackground: true,
    pageRanges: '1',
    margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
  });

  await page.close();
  console.log(`Saved ${outPath}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  await exportTheme(browser, 'light');
  await exportTheme(browser, 'dark');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

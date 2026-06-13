import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
});
const page = await context.newPage();

await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 30000 });
await page.screenshot({ path: '/tmp/alpaspinas_mobile_hero.png', fullPage: false });

await page.evaluate(() => document.getElementById('about')?.scrollIntoView());
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/alpaspinas_mobile_about.png', fullPage: false });

await browser.close();
console.log('done');

import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to admin signups
  await page.goto('http://localhost:5173/admin');
  await page.waitForSelector('input[type="password"]');
  
  // Auth
  await page.fill('input[type="password"]', 'alpas2025');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  // Click Sign-ups
  await page.click('button:has-text("Sign-ups")');
  await page.waitForTimeout(3000);
  
  // Get all text content
  const text = await page.textContent('body');
  const lines = text.split('\n').filter(l => l.trim() && l.length < 100 && !l.includes('localhost'));
  
  console.log('Page content:');
  lines.slice(0, 30).forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed && trimmed.length > 0) {
      console.log(i + ':', trimmed);
    }
  });
  
  // Check for approve buttons
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text.includes('Approve')) {
      console.log('\n✓ Found Approve button');
      break;
    }
  }
  
  await browser.close();
})().catch(err => console.error(err.message));

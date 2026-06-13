import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to admin
  await page.goto('http://localhost:5173/admin');
  await page.waitForSelector('input[type="password"]', { timeout: 5000 });
  
  // Auth
  await page.fill('input[type="password"]', 'alpas2025');
  await page.click('button[type="submit"]');
  await page.waitForSelector('h1', { timeout: 5000 });
  
  // Click Sign-ups tab
  const signupsBtn = await page.locator('button:has-text("Sign-ups")').first();
  await signupsBtn.click();
  await page.waitForTimeout(2000);
  
  // Get page content
  const content = await page.content();
  
  // Check what's on the signups page
  const heading = await page.textContent('h1');
  const sections = await page.$$eval('[style*="font-display"]', els => els.map(el => el.textContent));
  
  console.log('Page heading:', heading);
  console.log('Sections:', sections.slice(0, 5));
  
  // Check for loading, pending, or confirmed text
  const bodyText = await page.textContent('body');
  if (bodyText?.includes('Fetching')) {
    console.log('Page is fetching...');
  } else if (bodyText?.includes('pending')) {
    console.log('Found pending signups');
  } else if (bodyText?.includes('No pending')) {
    console.log('No pending signups');
  }
  
  // Take screenshot
  await page.screenshot({ path: 'signups-page.png' });
  console.log('Screenshot saved to signups-page.png');
  
  await browser.close();
})();

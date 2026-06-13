import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to admin
  await page.goto('http://localhost:5173/admin');
  await page.waitForSelector('input[type="password"]');
  
  // Auth
  await page.fill('input[type="password"]', 'alpas2025');
  await page.click('button[type="submit"]');
  await page.waitForSelector('h1');
  
  // Click Sign-ups tab
  await page.locator('button:has-text("Sign-ups")').first().click();
  
  // Wait for data to load (not fetching anymore)
  await page.waitForFunction(() => {
    const text = document.body.innerText;
    return !text.includes('Fetching');
  }, { timeout: 10000 });
  
  await page.waitForTimeout(500);
  
  // Get page content
  const bodyText = await page.textContent('body');
  
  if (bodyText?.includes('No pending')) {
    console.log('✓ Result: No pending sign-ups found');
  } else if (bodyText?.includes('pending')) {
    console.log('✓ Found pending signups section');
    // Extract some details
    const lines = bodyText.split('\n').filter(l => l.trim());
    lines.slice(0, 30).forEach(line => {
      if (line.length > 0 && line.length < 100) {
        console.log('  ' + line.trim());
      }
    });
  } else {
    console.log('Unknown state');
    console.log(bodyText?.substring(0, 500));
  }
  
  await browser.close();
})().catch(err => console.error(err.message));

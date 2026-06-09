import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to admin
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
  
  // Enter PIN (default: alpas2025)
  const pinInput = await page.$('input[type="password"]');
  if (pinInput) {
    await pinInput.fill('alpas2025');
    await page.click('button:has-text("Unlock")');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
  }
  
  // Take screenshot
  await page.screenshot({ path: 'admin-page.png' });
  console.log('Admin page loaded');
  
  // Check for pending signups
  const pending = await page.textContent('text=Pending');
  console.log('Pending section:', pending);
  
  // Look for approve buttons
  const approveBtn = await page.$('button:has-text("Approve")');
  if (approveBtn) {
    console.log('Found approve button');
    // Click it and capture error
    page.on('dialog', dialog => {
      console.log('Dialog:', dialog.message());
      dialog.dismiss();
    });
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
    // Click approve and wait for response
    await approveBtn.click();
    await page.waitForTimeout(2000);
  }
  
  await browser.close();
})().catch(console.error);

import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Navigate to admin signups
  await page.goto('http://localhost:5173/admin');
  await page.waitForSelector('input[type="password"]');
  
  // Auth
  await page.fill('input[type="password"]', 'alpas2025');
  await page.click('button[type="submit"]');
  await page.waitForSelector('h1');
  
  // Click Sign-ups tab
  await page.locator('button:has-text("Sign-ups")').first().click();
  
  // Wait for page to fully load
  await page.waitForFunction(() => {
    return !document.body.innerText.includes('Fetching') && 
           document.body.innerText.includes('Pending');
  }, { timeout: 10000 });
  
  await page.waitForTimeout(500);
  
  // Look for the approve button
  const approveBtn = await page.locator('button:has-text("✓ Approve")').first();
  
  if (await approveBtn.isVisible()) {
    console.log('✓ Found approve button for Test Approver');
    console.log('Clicking approve...');
    
    // Listen for fetch responses
    page.on('response', response => {
      if (response.url().includes('script.google.com')) {
        console.log(`Fetch to Google Apps Script: ${response.status()}`);
      }
    });
    
    // Click approve
    await approveBtn.click();
    
    // Wait for response and toast
    await page.waitForTimeout(3000);
    
    // Check for error toast
    const toastText = await page.locator('[role="alert"]').first().textContent({ timeout: 5000 }).catch(() => null);
    if (toastText) {
      console.log('✓ Toast message:', toastText);
    }
    
    // Get the button text to see if it changed
    const newText = await approveBtn.textContent({ timeout: 2000 }).catch(() => 'Unknown');
    console.log('✓ Button after click:', newText);
    
  } else {
    console.log('✗ Approve button not found');
  }
  
  console.log('\nConsole logs:', logs.slice(0, 5));
  
  await browser.close();
})();

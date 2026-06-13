import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  try {
    // Navigate to admin
    console.log('Navigating to admin...');
    await page.goto('http://localhost:5173/admin');
    
    // Wait for the PIN input
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    console.log('✓ PIN input found');
    
    // Fill PIN and submit
    await page.fill('input[type="password"]', 'alpas2025');
    await page.click('button[type="submit"]');
    
    // Wait for admin page to load
    await page.waitForSelector('h1', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    const heading = await page.textContent('h1');
    console.log('✓ Admin page loaded, heading:', heading?.trim());
    
    // Try to find and click an approve button
    const buttons = await page.locator('button:has-text("Approve")').all();
    console.log('✓ Found', buttons.length, 'approve button(s)');
    
    if (buttons.length > 0) {
      console.log('Clicking first approve button...');
      await buttons[0].click();
      await page.waitForTimeout(2000);
      
      // Check for error toast
      const toasts = await page.locator('[role="alert"]').all();
      for (const toast of toasts) {
        const text = await toast.textContent();
        console.log('Toast:', text);
      }
    } else {
      console.log('⚠ No approve buttons found - likely no pending signups in the sheet');
    }
    
    console.log('\nConsole errors:', errors.length > 0 ? errors : 'None');
    
  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    await browser.close();
  }
})();

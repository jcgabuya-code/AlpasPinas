import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to admin
  await page.goto('http://localhost:5173/admin');
  
  // Auth
  await page.fill('input[type="password"]', 'alpas2025');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  // Check for Home button
  const homeBtn = await page.locator('button:has-text("Home")').first();
  if (await homeBtn.isVisible()) {
    console.log('✓ Home button found in admin panel');
  } else {
    console.log('✗ Home button not found');
  }
  
  // Find and click Sign out button
  const signOutBtn = await page.locator('button:has-text("Sign out")').first();
  if (await signOutBtn.isVisible()) {
    console.log('✓ Sign out button found');
    await signOutBtn.click();
    await page.waitForTimeout(2000);
    
    // Check if we're redirected to home
    const url = page.url();
    if (url.includes('localhost:5173/') && !url.includes('/admin')) {
      console.log('✓ Redirected to home page after logout');
    } else {
      console.log('URL after logout:', url);
    }
  }
  
  await browser.close();
})();

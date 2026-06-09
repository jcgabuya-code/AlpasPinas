import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type().toUpperCase(), msg.text());
  });
  
  page.on('response', response => {
    if (response.url().includes('exec')) {
      console.log('EXEC Response:', response.status());
      response.text().then(text => {
        console.log('EXEC Body:', text.substring(0, 500));
      });
    }
  });
  
  // Navigate to home first
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  // Navigate to admin
  console.log('Navigating to admin...');
  await page.goto('http://localhost:5173/admin');
  
  // Wait for the PIN input
  await page.waitForSelector('input[type="password"]', { timeout: 5000 });
  console.log('PIN input found');
  
  // Fill PIN
  await page.fill('input[type="password"]', 'alpas2025');
  
  // Click Sign in button
  await page.click('button[type="submit"]');
  console.log('Clicked Sign in');
  
  // Wait for navigation
  await page.waitForTimeout(2000);
  
  // Check if we're in the admin panel
  const heading = await page.textContent('h1');
  console.log('Current heading:', heading);
  
  // Look for approve button
  const approveBtn = await page.$('button:has-text("Approve")');
  if (approveBtn) {
    console.log('Found approve button, clicking it');
    await approveBtn.click();
    await page.waitForTimeout(3000);
    
    // Check for toast message
    const toast = await page.textContent('[role="alert"]');
    console.log('Toast message:', toast);
  } else {
    console.log('No approve button found');
    const pageText = await page.textContent('body');
    console.log('Page text preview:', pageText?.substring(0, 1000));
  }
  
  await browser.close();
})().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});

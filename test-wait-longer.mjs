import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate and auth
  await page.goto('http://localhost:5173/admin');
  await page.fill('input[type="password"]', 'alpas2025');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  // Click Sign-ups
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    if ((await btn.textContent()).includes('Sign-ups')) {
      await btn.click();
      break;
    }
  }
  
  // Wait up to 10 seconds for the "Fetching" text to disappear
  await page.waitForFunction(() => {
    return !document.body.innerText.includes('Fetching');
  }, { timeout: 10000 }).catch(() => {
    console.log('⚠ Timeout waiting for data to load');
  });
  
  await page.waitForTimeout(1000);
  
  // Now look for approve buttons
  const allButtons = await page.$$('button');
  let found = false;
  
  for (const btn of allButtons) {
    const text = await btn.textContent();
    if (text.includes('✓ Approve')) {
      found = true;
      console.log('✓ Found Approve button');
      console.log('Clicking it...');
      
      await btn.click();
      await page.waitForTimeout(2500);
      
      // Check page content for result
      const html = await page.content();
      if (html.includes('confirmed!')) {
        console.log('✓ Success toast');
      }
      if (html.includes('No waiting signup')) {
        console.log('✗ Error: No waiting signup matched');
      }
      if (html.includes('redeploy')) {
        console.log('✗ Error: Needs redeploy');
      }
      break;
    }
  }
  
  if (!found) {
    const html = await page.content();
    if (html.includes('No pending')) {
      console.log('✓ No pending signups (data loaded successfully)');
    } else {
      console.log('✗ Page still loading or no approve buttons visible');
    }
  }
  
  await browser.close();
})();

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
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent()).includes('Sign-ups')) {
      await btn.click();
      break;
    }
  }
  
  // Wait for loading
  await page.waitForFunction(() => !document.body.innerText.includes('Fetching'), { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
  
  // Get page content to find the person's name
  const html = await page.content();
  
  // Click first approve button we find
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text.trim() === '✓ Approve') {
      console.log('Found Approve button, clicking...');
      await btn.click();
      await page.waitForTimeout(2500);
      
      // Check result
      const updatedHtml = await page.content();
      
      if (updatedHtml.includes('confirmed!')) {
        console.log('✓ SUCCESS: Booking was approved!');
      } else if (updatedHtml.includes('No waiting signup matched')) {
        console.log('✗ ERROR: No waiting signup matched for');
        // Extract more details
        const match = updatedHtml.match(/No waiting signup matched for "([^"]+)"/);
        if (match) {
          console.log('  Name: ' + match[1]);
        }
      } else if (updatedHtml.includes('redeploy')) {
        console.log('✗ ERROR: Apps Script needs to be redeployed');
      } else {
        console.log('? Unknown result');
      }
      break;
    }
  }
  
  await browser.close();
})();

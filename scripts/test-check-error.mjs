import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const fetchCalls = [];
  page.on('response', response => {
    if (response.url().includes('script.google.com')) {
      fetchCalls.push({
        method: response.request().method(),
        status: response.status(),
        url: response.url().substring(0, 100)
      });
    }
  });
  
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
  
  // Wait for loading to finish
  await page.waitForFunction(() => !document.body.innerText.includes('Fetching'), { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
  
  // Click approve
  for (const btn of await page.$$('button')) {
    const text = await btn.textContent();
    if (text.includes('✓ Approve')) {
      console.log('Clicking Approve button...');
      await btn.click();
      await page.waitForTimeout(3000);
      break;
    }
  }
  
  // Get content
  const html = await page.content();
  
  // Look for error messages in the HTML
  if (html.includes('No waiting signup matched')) {
    console.log('ERROR: No waiting signup matched for');
  }
  if (html.includes('redeploy')) {
    console.log('ERROR: Apps Script needs redeploy');
  }
  if (html.includes('confirmed!')) {
    console.log('SUCCESS: Booking approved');
  }
  if (html.includes('Failed')) {
    console.log('ERROR: General failure');
  }
  
  console.log('\nNetwork calls to Google Apps Script:');
  fetchCalls.forEach(call => {
    console.log(`  ${call.method} ${call.url} → ${call.status}`);
  });
  
  await browser.close();
})();

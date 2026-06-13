import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate and auth
  await page.goto('http://localhost:5173/admin');
  await page.fill('input[type="password"]', 'alpas2025');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  // Click Sign-ups using button that contains "Sign-ups"
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text.includes('Sign-ups')) {
      await btn.click();
      break;
    }
  }
  
  await page.waitForTimeout(2000);
  
  // Find all buttons with "Approve" in text
  const allButtons = await page.$$('button');
  console.log('Total buttons on page:', allButtons.length);
  
  let approveCount = 0;
  for (const btn of allButtons) {
    const text = await btn.textContent();
    if (text.includes('Approve')) {
      approveCount++;
      console.log('✓ Found Approve button:', text.trim());
    }
  }
  
  if (approveCount === 0) {
    console.log('⚠ No Approve buttons found');
    
    // Check if there's an error or loading state
    const bodyHTML = await page.content();
    if (bodyHTML.includes('Fetching')) {
      console.log('  → Page is fetching data');
    }
    if (bodyHTML.includes('No pending')) {
      console.log('  → No pending signups message visible');
    }
  } else {
    console.log('\nFound ' + approveCount + ' approve button(s), clicking first one...');
    
    // Click the first approve button
    for (const btn of allButtons) {
      const text = await btn.textContent();
      if (text.includes('✓ Approve')) {
        await btn.click();
        console.log('Clicked approve button');
        
        await page.waitForTimeout(2000);
        
        // Check for toast
        const html = await page.content();
        if (html.includes('confirmed')) {
          console.log('✓ Success! Booking was approved');
        } else if (html.includes('No waiting signup matched')) {
          console.log('✗ Error: No waiting signup matched');
        } else if (html.includes('error')) {
          console.log('✗ Some error occurred');
        }
        break;
      }
    }
  }
  
  await browser.close();
})();

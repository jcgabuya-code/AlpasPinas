import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Check what events are in the system by navigating to training page
  await page.goto('http://localhost:5173/training');
  await page.waitForTimeout(2000);
  
  // Get all event titles
  const content = await page.content();
  const events = [];
  
  // Look for event headings
  const headingMatches = content.match(/<h[2-4][^>]*>([^<]+)<\/h[2-4]>/g);
  if (headingMatches) {
    headingMatches.forEach(h => {
      const title = h.replace(/<[^>]+>/g, '');
      if (title && !title.includes('localhost')) {
        console.log('✓ Event:', title);
      }
    });
  }
  
  // Also check training.json to be sure
  const response = await page.evaluate(() => fetch('/src/data/training.json').then(r => r.json()));
  
  console.log('\nTraining events in training.json:');
  // Actually, we can't fetch from src/data directly. Let me just note what's there
  console.log('(Check the training.json file manually)');
  
  await browser.close();
})();

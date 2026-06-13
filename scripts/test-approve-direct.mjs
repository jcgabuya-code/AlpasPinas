const ENDPOINT = 'https://script.google.com/macros/s/AKfycbyt8a69V3KClcarpGLQqRXQq9SJKQmEtgrzwJGg0U_2nWcIWxrI1FXzqAokFqXH3CCr/exec';

async function testApprove() {
  const payload = {
    action: 'approve',
    eventId: 'jun-2026-weekend',
    name: 'JC Gabuya'
  };
  
  console.log('Sending:', JSON.stringify(payload));
  
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  
  const html = await res.text();
  console.log('\nResponse status:', res.status);
  
  // Try to extract JSON
  const jsonMatch = html.match(/(\{[\s\S]*?\})/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      console.log('Response JSON:', data);
      
      if (data.ok && data.approved === 0) {
        console.log('\n⚠ Issue: Apps Script returned approved: 0');
        console.log('This means no matching booking was found.\n');
        
        // Debug: let's check what's in the sheet again
        console.log('Let me check the sheet data...');
      }
    } catch (e) {
      console.log('Could not parse response');
      console.log(html.substring(0, 300));
    }
  } else {
    console.log('Could not find JSON in response');
    console.log(html.substring(0, 300));
  }
}

testApprove();

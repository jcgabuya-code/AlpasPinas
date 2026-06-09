const ENDPOINT = 'https://script.google.com/macros/s/AKfycbyt8a69V3KClcarpGLQqRXQq9SJKQmEtgrzwJGg0U_2nWcIWxrI1FXzqAokFqXH3CCr/exec';

async function checkStatus() {
  const res = await fetch(ENDPOINT, { method: 'GET' });
  const html = await res.text();
  
  // Try to find JSON in the response
  const jsonMatch = html.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      if (data.bookings) {
        console.log('Bookings in sheet:');
        data.bookings.forEach(b => {
          console.log(`  ${b.name} | Event: ${b.eventId} | Status: ${b.status}`);
        });
      }
    } catch (e) {
      console.log('Could not parse response');
    }
  }
}

checkStatus();

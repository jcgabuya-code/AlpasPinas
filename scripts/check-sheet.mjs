const ENDPOINT = 'https://script.google.com/macros/s/AKfycbyt8a69V3KClcarpGLQqRXQq9SJKQmEtgrzwJGg0U_2nWcIWxrI1FXzqAokFqXH3CCr/exec';

async function getBookings() {
  try {
    const res = await fetch(ENDPOINT, { method: 'GET' });
    const html = await res.text();
    
    // Try to extract JSON if present
    const jsonMatch = html.match(/<pre[^>]*>(\{.*\})<\/pre>/s) || 
                      html.match(/(\{.*\})/s);
    
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        console.log('✓ Got bookings');
        if (data.bookings) {
          console.log(`  Total: ${data.bookings.length} bookings\n`);
          data.bookings.forEach((b, i) => {
            console.log(`${i + 1}. ${b.name}`);
            console.log(`   Event: ${b.eventId}`);
            console.log(`   Status: ${b.status}`);
            console.log();
          });
        }
      } catch (e) {
        console.log('Could not parse JSON response');
        console.log(html.substring(0, 500));
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

getBookings();

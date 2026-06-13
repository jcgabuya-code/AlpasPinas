const ENDPOINT = 'https://script.google.com/macros/s/AKfycbyt8a69V3KClcarpGLQqRXQq9SJKQmEtgrzwJGg0U_2nWcIWxrI1FXzqAokFqXH3CCr/exec';

async function addTestBooking() {
  const payload = {
    action: 'add',
    booking: {
      eventId: 'may-2026-weekend',
      eventTitle: 'May 30-31 Training Weekend',
      name: 'Test Approver',
      gender: 'Male',
      side: 'Left',
      weight: 75,
      needPFD: 'No',
      needPaddle: 'No',
      attending: 'both'
    }
  };
  
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (data.ok) {
      console.log('✓ Booking added:', data.booking.name);
    } else {
      console.log('✗ Error:', data.error);
    }
  } catch (err) {
    console.error('Request error:', err.message);
  }
}

addTestBooking();

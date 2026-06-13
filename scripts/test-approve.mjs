// Test the approve endpoint directly
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbyt8a69V3KClcarpGLQqRXQq9SJKQmEtgrzwJGg0U_2nWcIWxrI1FXzqAokFqXH3CCr/exec';

async function testApprove() {
  try {
    const payload = {
      action: 'approve',
      eventId: 'training-001',
      name: 'Test User'
    };
    
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testApprove();

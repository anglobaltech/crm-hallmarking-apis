async function test() {
  try {
    const loginRes = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Got token');
    
    const payload = {
      customer_name: 'Demo',
      customer_id: '123455666',
      customer_mobile: '9999999999',
      articles: [{
        type: 'Ring',
        metal: 'Gold',
        purity: '916 (22K)',
        gross_weight: 0.006,
        quantity: 1,
        priority: 'Normal',
        remarks: 'Demo'
      }]
    };
    
    const res = await fetch('http://localhost:8000/api/workflow/orders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Data:', data);
  } catch(e) { 
    console.error('Error:', e);
  }
}
test();

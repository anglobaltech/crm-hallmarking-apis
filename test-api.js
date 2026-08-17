async function test() {
  try {
    const loginRes = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Login Status:', loginRes.status);
    
    const payload = {
      job_date: "2026-07-17",
      jeweller_name: "Test User",
      article_type: "Service Article",
      material: "Gold"
    };
    
    const res = await fetch('http://localhost:8000/api/services/laser', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('API Status:', res.status);
    console.log('API Data:', data);
  } catch(e) { 
    console.error('Error:', e);
  }
}
test();

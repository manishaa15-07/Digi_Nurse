// test_api.js - ESM script to test signup, login, dashboard
const BASE = 'http://localhost:5000';

async function signup() {
  const res = await fetch(`${BASE}/api/patient/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test Patient',
      dob: '1990-01-01',
      gender: 'male',
      contact: '+911234567890',
      email: 'testpatient@example.com',
      password: 'Password123!',
      consentToShare: true
    })
  });
  return res.json().then(data => ({ status: res.status, data }));
}

async function login() {
  const res = await fetch(`${BASE}/api/patient/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testpatient@example.com', password: 'Password123!' })
  });
  return res.json().then(data => ({ status: res.status, data }));
}

async function dashboard(token) {
  const res = await fetch(`${BASE}/api/patient/dashboard`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  try { const data = await res.json(); return { status: res.status, data }; } catch(e) { return { status: res.status, data: null } }
}

(async ()=>{
  try {
    console.log('1) Checking base route...');
    try {
      const r = await fetch(BASE);
      console.log('Base route status', r.status);
    } catch(e) { console.error('Base route error', e.message); }

    console.log('\n2) Sign up test user...');
    const s = await signup();
    console.log('Signup =>', s.status, s.data);

    console.log('\n3) Login test user...');
    const l = await login();
    console.log('Login =>', l.status, l.data);

    if (l.data && l.data.token) {
      console.log('\n4) Fetching dashboard with token...');
      const d = await dashboard(l.data.token);
      console.log('Dashboard =>', d.status, d.data);
    } else {
      console.warn('No token from login; skipping dashboard test');
    }
  } catch (err) {
    console.error('Test script error', err);
  }
})();

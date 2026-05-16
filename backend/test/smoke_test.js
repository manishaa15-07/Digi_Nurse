import axios from 'axios';

const API = process.env.API || 'http://localhost:5000';

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

(async () => {
  try {
    const ts = Date.now();
    console.log('Smoke test starting...');

    // 1) Patient signup
    const patientEmail = `test_patient_${ts}@example.com`;
    const patientRes = await axios.post(`${API}/api/patient/signup`, {
      fullName: 'Smoke Test Patient',
      email: patientEmail,
      password: 'password123'
    });
    console.log('Patient signup:', patientRes.status);
    const patientToken = patientRes.data.token;
    const patientId = patientRes.data.patientId || patientRes.data._id;

    // 2) Caretaker signup
    const caretEmail = `test_caretaker_${ts}@example.com`;
    const caretRes = await axios.post(`${API}/api/caretaker/signup`, {
      fullName: 'Smoke Test Caretaker',
      email: caretEmail,
      password: 'password123'
    });
    console.log('Caretaker signup:', caretRes.status);
    const caretakerToken = caretRes.data.token;
    const caretakerId = caretRes.data.caretakerId || caretRes.data._id;

    // 3) Patient requests caretaker
    const reqRes = await axios.post(`${API}/api/patient/request-caretaker`, { caretakerId }, { headers: { Authorization: `Bearer ${patientToken}` } });
    console.log('Patient requested caretaker:', reqRes.status);

    // small delay
    await sleep(500);

    // 4) Caretaker checks pending
    const pending = await axios.get(`${API}/api/caretaker/pending-patients`, { headers: { Authorization: `Bearer ${caretakerToken}` } });
    console.log('Caretaker pending count:', Array.isArray(pending.data) ? pending.data.length : JSON.stringify(pending.data));

    // 5) Caretaker approves patient
    const approve = await axios.post(`${API}/api/caretaker/approve-patient`, { patientId }, { headers: { Authorization: `Bearer ${caretakerToken}` } });
    console.log('Caretaker approved patient:', approve.status);

    // 6) Patient fetches caretakers
    const carets = await axios.get(`${API}/api/patient/caretakers`, { headers: { Authorization: `Bearer ${patientToken}` } });
    console.log('Patient caretakers returned:', Array.isArray(carets.data) ? carets.data.length : JSON.stringify(carets.data));

    // 7) Basic assertions
    if (!patientToken || !caretakerToken) {
      console.error('Tokens missing');
      process.exit(2);
    }

    if (!Array.isArray(carets.data) || carets.data.length === 0) {
      console.error('Caretaker linking failed or caretakers list empty');
      process.exit(3);
    }

    console.log('Smoke test completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Smoke test error (full):', err && err.stack ? err.stack : err);
    if (err && err.response) {
      try {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      } catch (e) {
        console.error('Failed to print response body', e);
      }
    }
    process.exit(1);
  }
})();

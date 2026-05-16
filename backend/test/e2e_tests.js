import axios from 'axios';

const API = 'http://localhost:5000';

const rand = () => Math.floor(Math.random() * 100000);

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function run() {
  try {
    console.log('\n=== E2E API Test Starting ===\n');

    // Register patient
    const patientEmail = `patient_test_${rand()}@example.com`;
    const patientPw = 'password123';
    const patientSignup = await axios.post(`${API}/api/patient/signup`, {
      fullName: 'Test Patient',
      dob: '1990-01-01',
      contact: '9999999999',
      email: patientEmail,
      password: patientPw
    });
    console.log('Patient signup response:', patientSignup.data);
    const patientToken = patientSignup.data.token;
    const patientID = patientSignup.data.patientID;

    // Register doctor
    const doctorEmail = `doctor_test_${rand()}@example.com`;
    const doctorPw = 'password123';
    const doctorSignup = await axios.post(`${API}/api/doctor/signup`, {
      fullName: 'Test Doctor',
      email: doctorEmail,
      password: doctorPw
    });
    console.log('Doctor signup response:', doctorSignup.data);
    const doctorToken = doctorSignup.data.token;
    const doctorId = doctorSignup.data.doctorId;

    // Register caretaker
    const caretakerEmail = `caretaker_test_${rand()}@example.com`;
    const caretakerPw = 'password123';
    const caretakerSignup = await axios.post(`${API}/api/caretaker/signup`, {
      fullName: 'Test Caretaker',
      email: caretakerEmail,
      password: caretakerPw
    });
    console.log('Caretaker signup response:', caretakerSignup.data);
    const caretakerToken = caretakerSignup.data.token;
    const caretakerId = caretakerSignup.data.caretakerId;

    // Patient requests doctor
    const reqDoctor = await axios.post(`${API}/api/patient/request-doctor`, { doctorId }, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log('Patient -> request doctor:', reqDoctor.data);

    // Doctor checks pending
    const doctorPending = await axios.get(`${API}/api/doctor/pending-patients`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log('Doctor pending requests:', doctorPending.data);

    // Doctor approves patient
    const approveResp = await axios.post(`${API}/api/doctor/approve-patient`, { patientId: patientID }, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log('Doctor approve response:', approveResp.data);

    // Patient fetch linked doctors
    const patientDoctors = await axios.get(`${API}/api/patient/doctors`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log('Patient linked doctors after approve:', patientDoctors.data);

    // Patient requests doctor again (will be rejected path)
    const reqDoctor2 = await axios.post(`${API}/api/patient/request-doctor`, { doctorId }, {
      headers: { Authorization: `Bearer ${patientToken}` }
    }).catch(e => e.response ? e.response.data : { error: e.message });
    console.log('Patient -> second request doctor (expected error or already linked):', reqDoctor2);

    // For reject scenario, create a second doctor
    const doctor2Email = `doctor2_test_${rand()}@example.com`;
    const doctor2Signup = await axios.post(`${API}/api/doctor/signup`, {
      fullName: 'Test Doctor 2',
      email: doctor2Email,
      password: doctorPw
    });
    const doctor2Token = doctor2Signup.data.token;
    const doctor2Id = doctor2Signup.data.doctorId;

    // Patient requests doctor2
    const reqDoctor3 = await axios.post(`${API}/api/patient/request-doctor`, { doctorId: doctor2Id }, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log('Patient -> request doctor2:', reqDoctor3.data);

    // Doctor2 rejects
    const rejectResp = await axios.post(`${API}/api/doctor/reject-patient`, { patientId: patientID }, {
      headers: { Authorization: `Bearer ${doctor2Token}` }
    });
    console.log('Doctor2 reject response:', rejectResp.data);

    // Now test caretaker flows
    // Patient requests caretaker
    const reqCaret = await axios.post(`${API}/api/patient/request-caretaker`, { caretakerId }, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log('Patient -> request caretaker:', reqCaret.data);

    // Caretaker checks pending
    const caretakerPending = await axios.get(`${API}/api/caretaker/pending-patients`, {
      headers: { Authorization: `Bearer ${caretakerToken}` }
    });
    console.log('Caretaker pending requests:', caretakerPending.data);

    // Caretaker approves patient
    const caretakerApprove = await axios.post(`${API}/api/caretaker/approve-patient`, { patientId: reqCaret.data.patientId || patientID }, {
      headers: { Authorization: `Bearer ${caretakerToken}` }
    }).catch(e => e.response ? e.response.data : { error: e.message });
    console.log('Caretaker approve response:', caretakerApprove);

    // For reject: create second caretaker
    const caretaker2Email = `caretaker2_test_${rand()}@example.com`;
    const caretaker2Signup = await axios.post(`${API}/api/caretaker/signup`, {
      fullName: 'Test Caretaker 2',
      email: caretaker2Email,
      password: caretakerPw
    });
    const caretaker2Token = caretaker2Signup.data.token;
    const caretaker2Id = caretaker2Signup.data.caretakerId;

    // Patient requests caretaker2
    const reqCaret2 = await axios.post(`${API}/api/patient/request-caretaker`, { caretakerId: caretaker2Id }, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log('Patient -> request caretaker2:', reqCaret2.data);

    // Caretaker2 rejects
    const caretakerReject = await axios.post(`${API}/api/caretaker/reject-patient`, { patientId: patientID }, {
      headers: { Authorization: `Bearer ${caretaker2Token}` }
    });
    console.log('Caretaker2 reject response:', caretakerReject.data);

    console.log('\n=== E2E API Test Completed ===\n');
  } catch (err) {
    console.error('\nE2E Test Error:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

run();

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API = `http://localhost:${process.env.PORT || 5000}`;

const now = Date.now();

async function run() {
  try {
    console.log('\n=== START E2E TEST ===\n');

    // 1) Register patient1
    const patient1Res = await axios.post(`${API}/api/patient/signup`, {
      fullName: `Test Patient A ${now}`,
      dob: '1990-01-01',
      contact: '9000000001',
      email: `testpatientA${now}@example.com`,
      password: 'password123'
    });
    console.log('patient1 signup:', patient1Res.data);
    const patient1ID = patient1Res.data.patientID;
    const patient1Token = patient1Res.data.token;

    // 2) Register doctor
    const doctorRes = await axios.post(`${API}/api/doctor/signup`, {
      fullName: `Test Doctor ${now}`,
      specialization: 'General Medicine',
      hospitalName: 'Test Hospital',
      contact: '8888881111',
      email: `testdoctor${now}@example.com`,
      password: 'password123'
    });
    console.log('doctor signup:', doctorRes.data);

    // 3) Doctor login
    const loginDoc = await axios.post(`${API}/api/doctor/login`, {
      email: doctorRes.data.email,
      password: 'password123'
    });
    const doctorToken = loginDoc.data.token;
    console.log('doctor login:', { doctorId: loginDoc.data.doctorId });

    // 4) Patient requests doctor
    const reqDoc = await axios.post(`${API}/api/patient/request-doctor`, { doctorId: loginDoc.data.doctorId }, { headers: { Authorization: `Bearer ${patient1Token}` } });
    console.log('patient->request-doctor response:', reqDoc.data);

    // 5) Doctor checks pending patients
    const pending = await axios.get(`${API}/api/doctor/pending-patients`, { headers: { Authorization: `Bearer ${doctorToken}` } });
    console.log('doctor pending patients:', pending.data);

    // 6) Doctor approves patient
    const approve = await axios.post(`${API}/api/doctor/approve-patient`, { patientId: patient1ID }, { headers: { Authorization: `Bearer ${doctorToken}` } });
    console.log('doctor approve response:', approve.data);

    // 7) Patient fetch linked doctors
    const myDocs = await axios.get(`${API}/api/patient/doctors`, { headers: { Authorization: `Bearer ${patient1Token}` } });
    console.log('patient linked doctors:', myDocs.data);

    // 8) Create patient2 and have them request doctor, then doctor rejects
    const patient2Res = await axios.post(`${API}/api/patient/signup`, {
      fullName: `Test Patient B ${now}`,
      dob: '1992-02-02',
      contact: '9000000002',
      email: `testpatientB${now}@example.com`,
      password: 'password123'
    });
    const patient2ID = patient2Res.data.patientID;
    const patient2Token = patient2Res.data.token;
    console.log('patient2 signup:', patient2Res.data);

    // patient2 requests same doctor
    const req2 = await axios.post(`${API}/api/patient/request-doctor`, { doctorId: loginDoc.data.doctorId }, { headers: { Authorization: `Bearer ${patient2Token}` } });
    console.log('patient2 request doctor:', req2.data);

    // doctor rejects patient2
    const reject2 = await axios.post(`${API}/api/doctor/reject-patient`, { patientId: patient2ID }, { headers: { Authorization: `Bearer ${doctorToken}` } });
    console.log('doctor rejected patient2:', reject2.data);

    // 9) Register caretaker
    const caretakerRes = await axios.post(`${API}/api/caretaker/signup`, {
      fullName: `Test Caretaker ${now}`,
      professionalRole: 'Nurse',
      organization: 'CareOrg',
      contact: '7777777777',
      email: `testcaretaker${now}@example.com`,
      password: 'password123'
    });
    console.log('caretaker signup:', caretakerRes.data);

    // caretaker login
    const loginCaret = await axios.post(`${API}/api/caretaker/login`, { email: caretakerRes.data.email, password: 'password123' });
    const caretakerToken = loginCaret.data.token;
    console.log('caretaker login:', { caretakerId: loginCaret.data.caretakerId });

    // 10) Patient1 requests caretaker
    const reqCare = await axios.post(`${API}/api/patient/request-caretaker`, { caretakerId: loginCaret.data.caretakerId }, { headers: { Authorization: `Bearer ${patient1Token}` } });
    console.log('patient1 request caretaker:', reqCare.data);

    // 11) Caretaker checks pending
    const pendingCare = await axios.get(`${API}/api/caretaker/pending-patients`, { headers: { Authorization: `Bearer ${caretakerToken}` } });
    console.log('caretaker pending patients:', pendingCare.data);

    // 12) Caretaker approves patient1
    const careApprove = await axios.post(`${API}/api/caretaker/approve-patient`, { patientId: patient1ID }, { headers: { Authorization: `Bearer ${caretakerToken}` } });
    console.log('caretaker approved patient1:', careApprove.data);

    // 13) Patient1 fetch caretakers
    const myCarets = await axios.get(`${API}/api/patient/caretakers`, { headers: { Authorization: `Bearer ${patient1Token}` } });
    console.log('patient caretakers:', myCarets.data);

    // 14) Patient3 signs up and requests caretaker, then caretaker rejects
    const patient3Res = await axios.post(`${API}/api/patient/signup`, {
      fullName: `Test Patient C ${now}`,
      dob: '1993-03-03',
      contact: '9000000003',
      email: `testpatientC${now}@example.com`,
      password: 'password123'
    });
    const patient3ID = patient3Res.data.patientID;
    const patient3Token = patient3Res.data.token;
    console.log('patient3 signup:', patient3Res.data);

    const req3 = await axios.post(`${API}/api/patient/request-caretaker`, { caretakerId: loginCaret.data.caretakerId }, { headers: { Authorization: `Bearer ${patient3Token}` } });
    console.log('patient3 request caretaker:', req3.data);

    const rejectCare = await axios.post(`${API}/api/caretaker/reject-patient`, { patientId: patient3ID }, { headers: { Authorization: `Bearer ${caretakerToken}` } });
    console.log('caretaker rejected patient3:', rejectCare.data);

    console.log('\n=== E2E TEST COMPLETE ===\n');
  } catch (err) {
    console.error('\nE2E TEST ERROR:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

run();

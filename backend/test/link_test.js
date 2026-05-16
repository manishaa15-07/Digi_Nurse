import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API = `http://localhost:${process.env.PORT || 5000}`;

async function run() {
  try {
    // 1) register patient
    const patientRes = await axios.post(`${API}/api/patient/signup`, {
      fullName: 'Test Patient',
      dob: '1990-01-01',
      contact: '9999999999',
      email: `testpatient${Date.now()}@example.com`,
      password: 'password123'
    });
    console.log('Patient signup:', patientRes.data);
    const patientID = patientRes.data.patientID;

    // 2) register doctor
    const doctorRes = await axios.post(`${API}/api/doctor/signup`, {
      fullName: 'Test Doctor',
      specialization: 'General Medicine',
      hospitalName: 'Test Hospital',
      contact: '8888888888',
      email: `testdoctor${Date.now()}@example.com`,
      password: 'password123'
    });
    console.log('Doctor signup:', doctorRes.data);

    // 3) login doctor to get token
    const loginRes = await axios.post(`${API}/api/doctor/login`, {
      email: doctorRes.data.email,
      password: 'password123'
    });
    const token = loginRes.data.token;
    console.log('Doctor login token:', token);

    // 4) link patient by public patientID
    const linkRes = await axios.post(`${API}/api/doctor/link-patient`, {
      patientId: patientID
    }, { headers: { Authorization: `Bearer ${token}` } });

    console.log('Link response:', linkRes.data);

    // 5) unlink patient by public patientID
    const unlinkRes = await axios.post(`${API}/api/doctor/unlink-patient`, {
      patientId: patientID
    }, { headers: { Authorization: `Bearer ${token}` } });

    console.log('Unlink response:', unlinkRes.data);

  } catch (err) {
    if (err.response) {
      console.error('Error status', err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

run();

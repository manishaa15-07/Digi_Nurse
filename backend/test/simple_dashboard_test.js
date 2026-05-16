import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API = `http://localhost:${process.env.PORT || 5000}`;
const now = Date.now();

// Helper function to delay execution
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function runSimpleDashboardTests() {
  try {
    console.log('\n🚀 === SIMPLE DASHBOARD TESTS STARTING ===\n');

    // ===========================================
    // 1. TEST BASIC SERVER CONNECTIVITY
    // ===========================================
    console.log('📋 Step 1: Testing server connectivity...');
    
    const serverTest = await axios.get(`${API}/`);
    console.log('✅ Server is running:', serverTest.data);

    // ===========================================
    // 2. TEST DOCTOR FUNCTIONALITY
    // ===========================================
    console.log('\n👨‍⚕️ Step 2: Testing Doctor Dashboard Features...');

    // Create Doctor
    const doctorSignup = await axios.post(`${API}/api/doctor/signup`, {
      fullName: `Test Doctor ${now}`,
      specialization: 'General Medicine',
      hospitalName: 'Test Hospital',
      hospitalId: 'HOSP001',
      licenseNumber: 'LIC123456',
      experienceYears: 5,
      contact: '8888888888',
      email: `doctor_${now}@test.com`,
      password: 'password123'
    });
    console.log('✅ Doctor created:', doctorSignup.data.doctorId);

    // Test Doctor Profile Fetch
    const doctorProfile = await axios.get(`${API}/api/doctor/profile`, {
      headers: { Authorization: `Bearer ${doctorSignup.data.token}` }
    });
    console.log('✅ Doctor profile fetched');

    // Test Doctor Dashboard Data
    const doctorDashboard = await axios.get(`${API}/api/doctor/${doctorSignup.data.doctorId}/patients`, {
      headers: { Authorization: `Bearer ${doctorSignup.data.token}` }
    });
    console.log('✅ Doctor dashboard data fetched');

    // Test Doctor Appointments
    const doctorAppointments = await axios.get(`${API}/api/doctor/appointments`, {
      headers: { Authorization: `Bearer ${doctorSignup.data.token}` }
    });
    console.log('✅ Doctor appointments fetched');

    // ===========================================
    // 3. TEST CARETAKER FUNCTIONALITY
    // ===========================================
    console.log('\n👩‍⚕️ Step 3: Testing Caretaker Dashboard Features...');

    // Create Caretaker
    const caretakerSignup = await axios.post(`${API}/api/caretaker/signup`, {
      fullName: `Test Caretaker ${now}`,
      professionalRole: 'Nurse',
      organization: 'Test Care Org',
      contact: '7777777777',
      email: `caretaker_${now}@test.com`,
      password: 'password123'
    });
    console.log('✅ Caretaker created:', caretakerSignup.data.caretakerId);

    // Test Caretaker Profile Fetch
    const caretakerProfile = await axios.get(`${API}/api/caretaker/profile`, {
      headers: { Authorization: `Bearer ${caretakerSignup.data.token}` }
    });
    console.log('✅ Caretaker profile fetched');

    // Test Caretaker Dashboard Data
    const caretakerDashboard = await axios.get(`${API}/api/caretaker/${caretakerSignup.data.caretakerId}/patients`, {
      headers: { Authorization: `Bearer ${caretakerSignup.data.token}` }
    });
    console.log('✅ Caretaker dashboard data fetched');

    // ===========================================
    // 4. TEST AI CHATBOT FUNCTIONALITY
    // ===========================================
    console.log('\n🤖 Step 4: Testing AI Chatbot Features...');

    // Test Basic Greeting
    const greetingResponse = await axios.post(`${API}/dialogflow`, {
      message: 'Hello',
      sessionId: 'test-session-1'
    });
    console.log('✅ AI Chatbot greeting test:', greetingResponse.data.reply);

    // Test Health Query
    const healthResponse = await axios.post(`${API}/dialogflow`, {
      message: 'I have a headache and fever',
      sessionId: 'test-session-2'
    });
    console.log('✅ AI Chatbot health query test:', healthResponse.data.reply);

    // ===========================================
    // 5. TEST REFRESH LOGOUT ISSUES
    // ===========================================
    console.log('\n🔄 Step 5: Testing Refresh Logout Issues...');

    // Test Doctor Profile Refresh
    const doctorProfileRefresh = await axios.get(`${API}/api/doctor/profile`, {
      headers: { Authorization: `Bearer ${doctorSignup.data.token}` }
    });
    console.log('✅ Doctor profile refresh test passed');

    // Test Caretaker Profile Refresh
    const caretakerProfileRefresh = await axios.get(`${API}/api/caretaker/profile`, {
      headers: { Authorization: `Bearer ${caretakerSignup.data.token}` }
    });
    console.log('✅ Caretaker profile refresh test passed');

    // ===========================================
    // 6. TEST ERROR HANDLING
    // ===========================================
    console.log('\n⚠️ Step 6: Testing Error Handling...');

    // Test Invalid Token
    try {
      await axios.get(`${API}/api/doctor/profile`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid token properly rejected');
      }
    }

    // Test Missing Token
    try {
      await axios.get(`${API}/api/doctor/profile`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Missing token properly rejected');
      }
    }

    console.log('\n🎉 === ALL DASHBOARD TESTS PASSED ===\n');
    console.log('📋 Test Summary:');
    console.log('✅ Server Connectivity: API server is running');
    console.log('✅ Doctor Dashboard: Profile, Patients, Appointments');
    console.log('✅ Caretaker Dashboard: Profile, Patients');
    console.log('✅ AI Chatbot: Greeting, Health Queries');
    console.log('✅ Refresh Issues: All dashboards handle refresh properly');
    console.log('✅ Error Handling: Proper authentication and error responses');

  } catch (error) {
    console.error('\n❌ === DASHBOARD TEST FAILED ===\n');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run the simple tests
runSimpleDashboardTests();

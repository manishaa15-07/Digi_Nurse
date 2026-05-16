// Debug script for patient-caretaker linking
// Run this in browser console to test the linking functionality

console.log('🔍 Debugging Patient-Caretaker Linking...');

// Check current storage
const checkStorage = () => {
    console.log('📦 Current localStorage data:');
    console.log('Pending Requests:', localStorage.getItem('digiNurse_pendingRequests'));
    console.log('Linked Caregivers:', localStorage.getItem('digiNurse_linkedCaregivers'));
};

// Clear all linking data
const clearLinkingData = () => {
    localStorage.removeItem('digiNurse_pendingRequests');
    localStorage.removeItem('digiNurse_linkedCaregivers');
    console.log('🗑️ All linking data cleared');
};

// Simulate patient request
const simulatePatientRequest = () => {
    const pendingRequests = JSON.parse(localStorage.getItem('digiNurse_pendingRequests') || '[]');
    const newRequest = {
        id: `req_${Date.now()}`,
        patientName: 'Test Patient',
        patientId: 'PT12345',
        caretakerId: 'CT84060',
        timestamp: Date.now()
    };
    pendingRequests.push(newRequest);
    localStorage.setItem('digiNurse_pendingRequests', JSON.stringify(pendingRequests));
    console.log('📝 Simulated patient request created:', newRequest);
};

// Check pending requests for caretaker
const checkCaretakerRequests = (caretakerId = 'CT84060') => {
    const pendingRequests = JSON.parse(localStorage.getItem('digiNurse_pendingRequests') || '[]');
    const caretakerRequests = pendingRequests.filter(req => req.caretakerId === caretakerId);
    console.log(`👨‍⚕️ Pending requests for caretaker ${caretakerId}:`, caretakerRequests);
    return caretakerRequests;
};

// Check linked patients for caretaker
const checkCaretakerPatients = (caretakerId = 'CT84060') => {
    const linkedPatients = JSON.parse(localStorage.getItem('digiNurse_linkedPatients') || '{}');
    const caretakerPatients = linkedPatients[caretakerId] || [];
    console.log(`👥 Linked patients for caretaker ${caretakerId}:`, caretakerPatients);
    return caretakerPatients;
};

// Simulate complete flow
const simulateCompleteFlow = () => {
    console.log('🔄 Simulating complete patient-caretaker linking flow...');

    // 1. Clear all data
    clearLinkingData();

    // 2. Patient requests caregiver
    simulatePatientRequest();

    // 3. Check caretaker requests
    setTimeout(() => {
        checkCaretakerRequests();
    }, 1000);

    console.log('✅ Complete flow simulation started!');
};

// Run initial check
checkStorage();

console.log('📋 Available commands:');
console.log('- checkStorage() - View current data');
console.log('- clearLinkingData() - Clear all data');
console.log('- simulatePatientRequest() - Create test request');
console.log('- checkCaretakerRequests("CT84060") - Check caretaker requests');
console.log('- checkCaretakerPatients("CT84060") - Check linked patients');
console.log('- simulateCompleteFlow() - Run complete flow simulation');

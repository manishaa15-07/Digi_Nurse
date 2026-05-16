// Test script to clear all tokens and verify profile selection page
console.log('🧪 Testing token clearing...');

// Clear all possible storage
if (typeof window !== 'undefined' && window.localStorage) {
    // Clear specific tokens
    localStorage.removeItem('patientToken');
    localStorage.removeItem('patientID');
    localStorage.removeItem('caretakerToken');
    localStorage.removeItem('caretakerID');

    // Clear all localStorage
    localStorage.clear();

    console.log('✅ All tokens cleared!');
    console.log('🔄 Please refresh the page to see the profile selection page.');
    console.log('📱 Expected: "Select a Profile" page with Patient and Caretaker buttons');
} else {
    console.log('❌ This script must be run in a browser environment');
}

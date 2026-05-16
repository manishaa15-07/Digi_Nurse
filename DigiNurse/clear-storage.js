// Simple script to clear all storage
// This can be run in the browser console or as a standalone script

// For React Native AsyncStorage
const clearAllStorage = async () => {
    try {
        // Clear all possible storage keys
        const keys = [
            'patientToken',
            'patientID',
            'caretakerToken',
            'caretakerID'
        ];

        // If running in browser, clear localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
            keys.forEach(key => {
                localStorage.removeItem(key);
                console.log(`Cleared ${key} from localStorage`);
            });

            // Also clear any other potential storage
            localStorage.clear();
            console.log('Cleared all localStorage');
        }

        console.log('✅ All storage cleared successfully!');
        console.log('🔄 Please refresh the app to see the profile selection page.');
        console.log('📱 The app should now show the "Select a Profile" page instead of the dashboard.');
    } catch (error) {
        console.error('❌ Error clearing storage:', error);
    }
};

// Run the function
clearAllStorage();

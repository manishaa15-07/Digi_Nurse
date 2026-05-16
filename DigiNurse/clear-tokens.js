// Script to clear all stored tokens
const { AsyncStorage } = require('@react-native-async-storage/async-storage');

async function clearAllTokens() {
    try {
        await AsyncStorage.removeItem('patientToken');
        await AsyncStorage.removeItem('patientID');
        await AsyncStorage.removeItem('caretakerToken');
        await AsyncStorage.removeItem('caretakerID');
        console.log('All tokens cleared successfully!');
    } catch (error) {
        console.error('Error clearing tokens:', error);
    }
}

clearAllTokens();

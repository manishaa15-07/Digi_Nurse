// Persistent store to simulate patient-caretaker linking
// Uses localStorage for persistence across sessions

interface PendingRequest {
    id: string;
    patientName: string;
    patientId: string;
    caretakerId: string;
    timestamp: number;
}

interface LinkedCaregiver {
    id: string;
    name: string;
    role: string;
    affiliation: string;
    type: string;
}

interface LinkedPatient {
    id: string;
    name: string;
    patientId: string;
    conditions: string[];
    allergies: string[];
}

// Storage keys
const PENDING_REQUESTS_KEY = 'digiNurse_pendingRequests';
const LINKED_CAREGIVERS_KEY = 'digiNurse_linkedCaregivers';
const LINKED_PATIENTS_KEY = 'digiNurse_linkedPatients';

// Helper functions for localStorage
const getFromStorage = (key: string, defaultValue: any) => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        }
        return defaultValue;
    } catch (error) {
        console.error('Error reading from storage:', error);
        return defaultValue;
    }
};

const saveToStorage = (key: string, data: any) => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(key, JSON.stringify(data));
        }
    } catch (error) {
        console.error('Error saving to storage:', error);
    }
};

export const linkingStore = {
    // Patient side - request to link with caretaker
    requestCaretaker: (patientId: string, patientName: string, caretakerId: string) => {
        const pendingRequests = getFromStorage(PENDING_REQUESTS_KEY, []);

        const request: PendingRequest = {
            id: `req_${Date.now()}`,
            patientName,
            patientId,
            caretakerId,
            timestamp: Date.now()
        };

        pendingRequests.push(request);
        saveToStorage(PENDING_REQUESTS_KEY, pendingRequests);
        console.log('📝 Patient request created:', request);
        return request;
    },

    // Caretaker side - get pending requests
    getPendingRequests: (caretakerId: string) => {
        const pendingRequests = getFromStorage(PENDING_REQUESTS_KEY, []);
        return pendingRequests.filter((req: PendingRequest) => req.caretakerId === caretakerId);
    },

    // Caretaker side - accept patient request
    acceptRequest: (requestId: string) => {
        const pendingRequests = getFromStorage(PENDING_REQUESTS_KEY, []);
        const linkedCaregivers = getFromStorage(LINKED_CAREGIVERS_KEY, {});
        const linkedPatients = getFromStorage(LINKED_PATIENTS_KEY, {});

        const requestIndex = pendingRequests.findIndex((req: PendingRequest) => req.id === requestId);
        if (requestIndex === -1) return false;

        const request = pendingRequests[requestIndex];
        pendingRequests.splice(requestIndex, 1);
        saveToStorage(PENDING_REQUESTS_KEY, pendingRequests);

        // Add to linked caregivers (patient side)
        if (!linkedCaregivers[request.patientId]) {
            linkedCaregivers[request.patientId] = [];
        }

        const caregiver: LinkedCaregiver = {
            id: request.caretakerId,
            name: `Dr. Caretaker ${request.caretakerId}`,
            role: 'Healthcare Professional',
            affiliation: 'Medical Center',
            type: 'professional'
        };

        linkedCaregivers[request.patientId].push(caregiver);
        saveToStorage(LINKED_CAREGIVERS_KEY, linkedCaregivers);

        // Add to linked patients (caretaker side)
        if (!linkedPatients[request.caretakerId]) {
            linkedPatients[request.caretakerId] = [];
        }

        const patient: LinkedPatient = {
            id: request.patientId,
            name: request.patientName,
            patientId: request.patientId,
            conditions: ['Anxiety', 'Asthma'], // Sample data - would come from patient model
            allergies: ['Pollen', 'Nuts'] // Sample data - would come from patient model
        };

        linkedPatients[request.caretakerId].push(patient);
        saveToStorage(LINKED_PATIENTS_KEY, linkedPatients);
        console.log('✅ Request accepted:', request);
        return true;
    },

    // Patient side - get linked caregivers
    getLinkedCaregivers: (patientId: string) => {
        const linkedCaregivers = getFromStorage(LINKED_CAREGIVERS_KEY, {});
        return linkedCaregivers[patientId] || [];
    },

    // Caretaker side - get linked patients
    getLinkedPatients: (caretakerId: string) => {
        const linkedPatients = getFromStorage(LINKED_PATIENTS_KEY, {});
        return linkedPatients[caretakerId] || [];
    },

    // Caretaker side - unlink patient
    unlinkPatient: (caretakerId: string, patientId: string) => {
        const linkedPatients = getFromStorage(LINKED_PATIENTS_KEY, {});
        if (linkedPatients[caretakerId]) {
            linkedPatients[caretakerId] = linkedPatients[caretakerId].filter((p: LinkedPatient) => p.patientId !== patientId);
            saveToStorage(LINKED_PATIENTS_KEY, linkedPatients);
            console.log('🗑️ Patient unlinked:', patientId);
            return true;
        }
        return false;
    },

    // Caretaker side - link with patient directly
    linkPatient: (caretakerId: string, patientId: string) => {
        const pendingRequests = getFromStorage(PENDING_REQUESTS_KEY, []);

        const request: PendingRequest = {
            id: `req_${Date.now()}`,
            patientName: `Patient ${patientId}`,
            patientId,
            caretakerId,
            timestamp: Date.now()
        };

        pendingRequests.push(request);
        saveToStorage(PENDING_REQUESTS_KEY, pendingRequests);
        console.log('📝 Caretaker link request created:', request);
        return request;
    },

    // Clear all data (for testing)
    clearAll: () => {
        saveToStorage(PENDING_REQUESTS_KEY, []);
        saveToStorage(LINKED_CAREGIVERS_KEY, {});
        saveToStorage(LINKED_PATIENTS_KEY, {});
        console.log('🗑️ All linking data cleared');
    }
};

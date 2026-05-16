import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { storage } from '../../config/storage';
import "../../global.css";

interface FindPatientResponse {
    _id: string;
    fullName: string;
    patientID: string;
    email?: string;
    contact?: string;
}

interface PendingRequest {
    _id: string;
    fullName: string;
    patientID: string;
    email: string;
    contact: string;
}

interface PendingPatientsResponse {
    requests: PendingRequest[];
}

interface LinkPatientResponse {
    success: boolean;
    message: string;
}

export default function LinkScreen() {
    const [patientId, setPatientId] = useState('');
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPendingRequests();
    }, []);

    const loadPendingRequests = async () => {
        try {
            const token = await storage.getItem('caretakerToken');
            if (!token) {
                Alert.alert('Authentication Required', 'Please login as a caretaker first to view pending requests.');
                return;
            }

            const response = await axios.get<PendingPatientsResponse>(
                `${API_BASE_URL}/api/caretaker/pending-patients`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setPendingRequests(response.data.requests);
        } catch (error: any) {
            console.error('Error fetching pending requests:', error);
            Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to load requests');
        }
    };

    const handleLinkPatient = async () => {
        if (!patientId.trim()) {
            Alert.alert('Error', 'Please enter a Patient ID');
            return;
        }

        try {
            setLoading(true);
            const token = await storage.getItem('caretakerToken');
            if (!token) return;

            const findResponse = await axios.get<FindPatientResponse>(
                `${API_BASE_URL}/api/caretaker/patient/${patientId.trim()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const response = await axios.post<LinkPatientResponse>(
                `${API_BASE_URL}/api/caretaker/add-patient`,
                { patientId: findResponse.data._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert('Success', response.data.message);
            setPatientId('');
            setTimeout(loadPendingRequests, 1000);
        } catch (error: any) {
            console.error('Error linking patient:', error);
            Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to link patient');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (request: PendingRequest) => {
        try {
            const token = await storage.getItem('caretakerToken');
            if (!token) return;

            await axios.post(
                `${API_BASE_URL}/api/caretaker/approve-patient`,
                { patientId: request._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert('Success', `Request from ${request.fullName} accepted!`);
            setTimeout(loadPendingRequests, 500);
        } catch (error: any) {
            console.error('Error accepting request:', error);
            Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to accept request');
        }
    };

    return (
        <ScrollView className="flex-1 bg-white">
            {/* Header */}
            <View className="px-6 pt-12 pb-6">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-3xl font-bold text-blue-900">Link New Patients</Text>
                    <TouchableOpacity
                        className="bg-blue-100 rounded-lg px-3 py-2"
                        onPress={loadPendingRequests}
                    >
                        <Text className="text-blue-600 text-sm font-medium">Refresh</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Pending Requests Section */}
            <View className="px-6 mb-8">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-xl font-bold text-gray-800">Pending Requests</Text>
                    <Text className="text-sm text-gray-500">Count: {pendingRequests.length}</Text>
                </View>

                {pendingRequests.length === 0 ? (
                    <View className="bg-gray-100 rounded-xl p-8 items-center">
                        <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                        <Text className="text-lg text-gray-500 mt-4">No pending requests</Text>
                        <Text className="text-sm text-gray-400 text-center mt-2">
                            Patients will appear here when they request to link with you
                        </Text>
                    </View>
                ) : (
                    pendingRequests.map((request) => (
                        <View key={request._id} className="bg-gray-100 rounded-xl p-4 mb-3 border border-gray-200">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                                        <Ionicons name="person" size={24} color="#3B82F6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-lg font-bold text-gray-800">
                                            {request.fullName} ({request.patientID})
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    className="bg-blue-600 rounded-lg px-4 py-2"
                                    onPress={() => handleAcceptRequest(request)}
                                >
                                    <Text className="text-white text-sm font-medium">Accept</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* Add a New Patient Section */}
            <View className="px-6 pb-8">
                <Text className="text-xl font-bold text-gray-800 mb-4">Add a New Patient</Text>

                <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 bg-white mb-3"
                    placeholder="Enter Patient ID"
                    placeholderTextColor="#9CA3AF"
                    value={patientId}
                    onChangeText={setPatientId}
                />

                <Text className="text-sm text-gray-600 mb-6">
                    Ask your patient or their family members for unique Diginurse ID
                </Text>

                <TouchableOpacity
                    className="bg-blue-600 rounded-lg py-4 shadow-sm"
                    onPress={handleLinkPatient}
                    disabled={loading}
                >
                    <Text className="text-white text-center font-semibold text-lg">
                        {loading ? 'Linking...' : 'Link Patient'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

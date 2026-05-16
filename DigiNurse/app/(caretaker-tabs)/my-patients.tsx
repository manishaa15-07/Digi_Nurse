import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { storage } from '../../config/storage';
import "../../global.css";
interface CaretakerProfile {
    _id: string;
    caretakerId: string;
    fullName: string;
    email: string;
    contact: string;
    professionalRole: string;
    organization: string;
    specializations: string[];
    experienceYears: number;
    linkedPatients: Patient[];
    pendingPatientRequests: Patient[];
}
interface PatientsResponse {
    patients: Patient[];
}

interface Patient {
    _id: string;
    fullName: string;
    patientID: string;
    conditions: string[];
    allergies: string[];
    email: string;
    contact: string;
}

export default function MyPatientsScreen() {
    const router = useRouter();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const token = await storage.getItem('caretakerToken');

            if (!token) {
                Alert.alert('Error', 'Please login as a caretaker');
                return;
            }

            console.log('🔍 Loading patients for caretaker...');

            // Get caretaker profile (now includes linked patients)
            const profileResponse = await axios.get(`${API_BASE_URL}/api/caretaker/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const profileData = profileResponse.data as CaretakerProfile;
            console.log('📋 Caretaker profile response:', profileData);
            console.log('👥 Linked patients from profile:', profileData.linkedPatients);

            // Use patients from profile response
            setPatients(profileData.linkedPatients || []);
        } catch (error: any) {
            console.error('❌ Error fetching patients:', error);
            console.error('❌ Error response:', error.response?.data);
            Alert.alert('Error', error.response?.data?.message || 'Failed to fetch patients');
        } finally {
            setLoading(false);
        }
    };


    const handleChat = (patient: Patient) => {
        console.log('Navigating to caretaker-chat for patient:', patient._id, patient.fullName);
        const qp = `?patientId=${encodeURIComponent(patient._id)}&patientName=${encodeURIComponent(patient.fullName)}`;
        router.push(`/screens/caretaker-chat${qp}`);
    };

    const handleUnlink = async (patientId: string, patientName: string) => {
        try {
            console.log('🔗 [CaretakerUnlink] Unlinking patient:', patientId, patientName);

            // Get caretaker token
            const token: string | null = await storage.getItem('caretakerToken');
            if (!token) {
                Alert.alert('Authentication Required', 'Please login first.');
                return;
            }

            // Prepare request data
            const requestData = { patientId };
            console.log('🔗 [CaretakerUnlink] Request data:', requestData);
            console.log('🔗 [CaretakerUnlink] API URL:', `${API_BASE_URL}/api/caretaker/unlink-patient`);

            // Make API call
            const response = await axios.post<{ message: string }>(
                `${API_BASE_URL}/api/caretaker/unlink-patient`,
                requestData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('🔗 [CaretakerUnlink] Success response:', response.data);
            Alert.alert('Success', `${patientName} has been unlinked successfully!`);

            // Refresh patient list
            loadPatients();
        } catch (error: any) {
            console.error('🔗 [CaretakerUnlink] Error:', error);
            console.error('🔗 [CaretakerUnlink] Error response:', error.response?.data);
            Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to unlink patient');
        }
    };


    return (
        <ScrollView className="flex-1 bg-white">
            {/* Header Section */}
            <View className="px-6 pt-12 pb-6">
                <Text className="text-3xl font-bold text-blue-900 text-center mb-4">
                    My Patients
                </Text>
                <Text className="text-base text-gray-600 leading-6">
                    Manage whose health progress you can view and whom you can care about. You can link or unlink them whenever you want.
                </Text>
            </View>

            {/* Linked Patients Section */}
            <View className="px-6 mb-8">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-xl font-bold text-gray-800">
                        Linked Patients
                    </Text>
                    <Text className="text-blue-600 font-medium">
                        {patients.length} Active Connections
                    </Text>
                </View>

                {/* Patient Cards */}
                <View>
                    {loading ? (
                        <View className="bg-gray-100 rounded-xl p-8 items-center">
                            <Ionicons name="refresh" size={48} color="#3B82F6" />
                            <Text className="text-lg text-gray-500 mt-4">Loading patients...</Text>
                        </View>
                    ) : patients.length === 0 ? (
                        <View className="bg-gray-100 rounded-xl p-8 items-center">
                            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                            <Text className="text-lg text-gray-500 mt-4">No patients linked yet</Text>
                            <Text className="text-sm text-gray-400 text-center mt-2">
                                Accept patient requests in "Link New Patients" to see them here
                            </Text>
                        </View>
                    ) : (
                        patients.map((patient, index) => (
                            <View key={patient._id} className={`bg-white rounded-xl p-4 shadow-sm border border-gray-200 ${index < patients.length - 1 ? 'mb-4' : ''}`}>
                                <View className="flex-row items-center">
                                    {/* Avatar */}
                                    <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                                        <Ionicons name="person" size={24} color="#3B82F6" />
                                    </View>

                                    {/* Patient Info */}
                                    <View className="flex-1">
                                        <Text className="text-lg font-bold text-gray-800 mb-1">
                                            {patient.fullName} ({patient.patientID})
                                        </Text>
                                        <Text className="text-sm text-gray-600 mb-1">
                                            Conditions: {patient.conditions?.join(', ') || 'None specified'}
                                        </Text>
                                        <Text className="text-sm text-gray-600">
                                            Allergies: {patient.allergies?.join(', ') || 'None specified'}
                                        </Text>
                                    </View>

                                    {/* Action Buttons */}
                                    <View>
                                        <TouchableOpacity
                                            className="border border-blue-500 rounded-lg px-3 py-2 bg-white mb-2"
                                            onPress={() => handleChat(patient)}
                                        >
                                            <Text className="text-blue-500 text-sm font-medium">Chat</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className="bg-red-500 rounded-lg px-3 py-2"
                                            onPress={() => handleUnlink(patient._id, patient.fullName)}
                                        >
                                            <Text className="text-white text-sm font-medium">Unlink</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

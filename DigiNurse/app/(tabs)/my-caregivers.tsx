import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { storage } from '../../config/storage';
import "../../global.css";

interface Caregiver {
    _id: string;
    fullName: string;
    professionalRole: string;
    organization: string;
    email: string;
    contact: string;
    caretakerId: string;
}

interface CaregiversResponse {
    caretakers: Caregiver[];
}

interface RequestCaretakerResponse {
    message: string;
    caretaker?: Caregiver;
}

export default function MyCaregiversScreen() {
    const router = useRouter();
    const [caregiverId, setCaregiverId] = useState("");
    const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCaregivers();
    }, []);

    const loadCaregivers = async () => {
        try {
            const token = await storage.getItem('patientToken');

            if (!token) {
                console.warn('loadCaregivers: no patientToken found in storage');
                Alert.alert('Error', 'Please login as a patient');
                return;
            }

            console.log('loadCaregivers: using token', token?.slice ? `${token.slice(0,10)}...` : token);
            const response = await axios.get(`${API_BASE_URL}/api/patient/caretakers`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('loadCaregivers: API response status', response.status);
            console.log('loadCaregivers: API response data', response.data);

            const data = response.data as CaregiversResponse;
            setCaregivers(data.caretakers || []);
        } catch (error: any) {
            console.error('Error fetching caregivers:', error);
            console.error('Error fetching caregivers - response:', error?.response?.data);
        }
    };

    const handleLinkCaregiver = async () => {
        if (!caregiverId.trim()) {
            Alert.alert('Error', 'Please enter a Caregiver ID');
            return;
        }

        try {
            setLoading(true);
            const token = await storage.getItem('patientToken');
            const requestData = { caretakerId: caregiverId.trim() };

            const response = await axios.post(
                `${API_BASE_URL}/api/patient/request-caretaker`,
                requestData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = response.data as RequestCaretakerResponse;
            console.log('✅ Request response:', data);

            Alert.alert('Success', `Request sent to caregiver ${caregiverId}!`);
            setCaregiverId('');
            loadCaregivers();
        } catch (error: any) {
            console.error('❌ Error requesting caretaker:', error);
            const errorMessage = error.response?.data?.message || error.message;

            if (errorMessage === "Patient or caretaker not found") {
                Alert.alert(
                    'Caretaker Not Found',
                    `The caretaker ID "${caregiverId.trim()}" doesn't exist.\n\nClick "Debug: List All Caretakers" to see available caretaker IDs.`
                );
            } else if (errorMessage === "Already requested or linked") {
                Alert.alert(
                    'Already Connected',
                    `You are already linked or have a pending request with caretaker "${caregiverId.trim()}".`
                );
            } else {
                Alert.alert(
                    'Error',
                    `Status: ${error.response?.status}\nMessage: ${errorMessage}\nCheck console for details`
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChat = (caregiver: Caregiver) => {
        console.log('Navigating to patient-chat for caregiver:', caregiver._id, caregiver.fullName);
        router.push({
            pathname: '/screens/patient-chat',
            params: {
                caregiverId: caregiver._id,
                caregiverName: caregiver.fullName
            }
        });
    };


    // const handleStopAccess = async (caregiverId: string) => {
    //     Alert.alert(
    //         'Stop Access',
    //         'Are you sure you want to remove this caregiver?',
    //         [
    //             { text: 'Cancel', style: 'cancel' },
    //             {
    //                 text: 'Remove',
    //                 style: 'destructive',
    //                 onPress: async () => {
    //                     try {
    //                         console.log('🔗 [PatientUnlink] Removing caregiver access:', caregiverId);
    //                         const token = await storage.getItem('patientToken');

    //                         const requestData = { caretakerId: caregiverId };
    //                         console.log('🔗 [PatientUnlink] Request data:', requestData);
    //                         console.log('🔗 [PatientUnlink] API URL:', `${API_BASE_URL}/api/patient/unlink-caretaker`);

    //                         const response = await axios.post(
    //                             `${API_BASE_URL}/api/patient/unlink-caretaker`,
    //                             requestData,
    //                             { headers: { Authorization: `Bearer ${token}` } }
    //                         );

    //                         console.log('🔗 [PatientUnlink] Success response:', response.data);
    //                         Alert.alert('Success', 'Caregiver access removed successfully!');
    //                         loadCaregivers();
    //                     } catch (error: any) {
    //                         console.error('🔗 [PatientUnlink] Error:', error);
    //                         console.error('🔗 [PatientUnlink] Error response:', error.response?.data);
    //                         Alert.alert('Error', error.response?.data?.message || 'Failed to remove caregiver');
    //                     }
    //                 }
    //             }
    //         ]
    //     );
    // };


    const handleStopAccess = async (caregiverId: string) => {
        try {
            console.log('🔗 [PatientUnlink] Removing caregiver access:', caregiverId);

            // Get patient token
            const token: string | null = await storage.getItem('patientToken');
            if (!token) {
                Alert.alert('Authentication Required', 'Please login first.');
                return;
            }

            // Prepare request data
            const requestData = { caretakerId: caregiverId };
            console.log('🔗 [PatientUnlink] Request data:', requestData);
            console.log('🔗 [PatientUnlink] API URL:', `${API_BASE_URL}/api/patient/unlink-caretaker`);

            // Make API call
            const response = await axios.post<{ message: string }>(
                `${API_BASE_URL}/api/patient/unlink-caretaker`,
                requestData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('🔗 [PatientUnlink] Success response:', response.data);
            Alert.alert('Success', response.data.message || 'Caregiver access removed successfully!');

            // Refresh caregivers list
            loadCaregivers();
        } catch (error: any) {
            console.error('🔗 [PatientUnlink] Error:', error);
            console.error('🔗 [PatientUnlink] Error response:', error.response?.data);
            Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to remove caregiver');
        }
    };


    return (
        <ScrollView className="flex-1 bg-white">
            {/* Header Section */}
            <View className="px-6 pt-12 pb-6">
                <Text className="text-3xl font-bold text-[#0077B6] text-center mb-4">
                    My Caregivers
                </Text>
                <Text className="text-xs text-gray-600 leading-4">
                    Manage who can view your health progress and help coordinate care.
                </Text>
            </View>

            {/* Linked Caregivers Section */}
            <View className="px-6 mb-8">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-xl font-bold text-gray-800">
                        Linked Caregivers
                    </Text>
                    <Text className="text-[#0077B6] font-small">
                        {caregivers.length} Active Connections
                    </Text>
                </View>

                <View>
                    {caregivers.length === 0 ? (
                        <View className="bg-gray-100 rounded-xl p-8 items-center">
                            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                            <Text className="text-lg text-gray-500 mt-4">No caregivers linked yet</Text>
                            <Text className="text-sm text-gray-400 text-center mt-2">
                                Add a caregiver using their ID below
                            </Text>
                        </View>
                    ) : (
                        caregivers.map((caregiver, index) => (
                            <View
                                key={caregiver._id}
                                className={`bg-gray-100 rounded-xl p-4 shadow-sm ${index < caregivers.length - 1 ? "mb-4" : ""}`}
                            >
                                <View className="flex-row items-center">
                                    {/* Avatar */}
                                    <View className="w-12 h-12 bg-[#0077B6] rounded-full items-center justify-center mr-4">
                                        <Ionicons name="person" size={24} color="white" />
                                    </View>

                                    {/* Caregiver Info */}
                                    <View className="flex-1">
                                        <Text className="text-md font-bold text-gray-800 mb-1">
                                            {caregiver.fullName}
                                        </Text>
                                        <Text className="text-sm text-gray-600 mb-1">
                                            {caregiver.professionalRole || 'Healthcare Professional'}
                                        </Text>
                                        {caregiver.organization && (
                                            <Text className="text-sm text-gray-600">
                                                {caregiver.organization}
                                            </Text>
                                        )}
                                        {caregiver.caretakerId && (
                                            <Text className="text-xs text-gray-500 mt-1">
                                                ID: {caregiver.caretakerId}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Action Buttons */}
                                    <View>
                                        <TouchableOpacity
                                            className="border border-[#0077B6] items-center rounded-md px-2 py-1 bg-white mb-2 hover:bg-[#EBF9FC]"
                                            onPress={() => handleChat(caregiver)}
                                        >
                                            <Text className="text-[#0077B6] text-[10px] font-medium">
                                                Chat
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className="border border-[#000000] bg-[#F95643] rounded-md px-2 py-1"
                                            onPress={() => handleStopAccess(caregiver._id)}
                                        >
                                            <Text className="text-white text-[10px] font-medium">
                                                Stop Access
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </View>

            {/* Add New Caregiver Section */}
            <View className="px-6 pb-8">
                <Text className="text-xl font-bold text-gray-800 mb-4">
                    Add a New Caregiver
                </Text>

                <TextInput
                    className="border border-[#0077B6] rounded-lg px-4 py-3 mb-3 bg-white hover:bg-[#EBF9FC] focus:bg-[#EBF9FC]"
                    placeholder="Enter Caregiver ID"
                    placeholderTextColor="#9CA3AF"
                    value={caregiverId}
                    onChangeText={setCaregiverId}
                />

                <View className="items-center">
                    <Text className="text-sm text-gray-600 mb-6 text-center">
                        Ask your professional caregiver or family member for unique{" "}
                        <Text className="text-[#0077B6]">Diginurse ID</Text>
                    </Text>

                    <TouchableOpacity
                        className="bg-[#0077B6] rounded-lg w-[200px] py-2 shadow-sm"
                        onPress={handleLinkCaregiver}
                        disabled={loading}
                    >
                        <Text className="text-white text-center font-semibold text-lg">
                            {loading ? 'Linking...' : 'Link Caregiver'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

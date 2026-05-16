
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import "../../global.css";
import { storage } from '../../config/storage';
import { API_BASE_URL } from '../../config/api';
import axios from 'axios';

export default function SOSScreen() {

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

    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [caretakers, setCaretakers] = useState<Caregiver[]>([]);
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [popupType, setPopupType] = useState<'success' | 'warning' | 'error'>('success');

    useEffect(() => {
        const loadCaretakers = async () => {
            const fetchedCaretakers = await fetchLinkedCaretakers();
            setCaretakers(fetchedCaretakers);
        };

        loadCaretakers();
    }, []);

    // Debug function to check authentication
    const checkAuthentication = async () => {
        try {
            const token = await storage.getItem('patientToken');
            console.log('Patient token exists:', !!token);
            console.log('Token length:', token?.length);

            if (token) {
                // Test the token by making a simple API call
                const response = await axios.get(`${API_BASE_URL}/api/patient/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Patient authentication test:', response.data);
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Authentication check failed:', error);
            console.error('Error status:', error.response?.status);
            console.error('Error message:', error.response?.data);
            return false;
        }
    };

    const fetchLinkedCaretakers = async (): Promise<Caregiver[]> => {
        try {
            const token = await storage.getItem('patientToken');

            if (!token) {
                setPopupMessage('Please login as a patient.');
                setPopupType('error');
                return [];
            }

            const response = await axios.get(`${API_BASE_URL}/api/patient/caretakers`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = response.data as CaregiversResponse;
            return data.caretakers || [];
        } catch (error) {
            console.error('Error fetching caregivers:', error);
            setPopupMessage('Failed to fetch caregivers. Please try again.');
            setPopupType('error');
            return [];
        }
    };

    const handleSOSPress = () => {
        setShowModal(true);
    };

    const handleYes = async () => {
        setLoading(true);
        try {
            const token = await storage.getItem('patientToken');

            if (!token) {
                setLoading(false);
                setShowModal(false);
                setPopupMessage('Please login first.');
                setPopupType('error');
                return;
            }

            // Debug: Check authentication before sending SOS
            console.log('Sending SOS alert with token:', token.substring(0, 20) + '...');

            // Test authentication first
            const isAuthenticated = await checkAuthentication();
            if (!isAuthenticated) {
                setLoading(false);
                setShowModal(false);
                setPopupMessage('Authentication failed. Please login again.');
                setPopupType('error');
                return;
            }

            // The backend now gets patient ID from the authenticated token
            // So we don't need to send patientId in the body anymore
            const response = await axios.post(
                `${API_BASE_URL}/api/patient/sos-alert`,
                {
                    emergencyType: 'AMBULANCE_REQUIRED',
                    location: {
                        // You can add location data here if available
                        // latitude: currentLocation?.latitude,
                        // longitude: currentLocation?.longitude,
                        // address: currentLocation?.address
                    }
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setLoading(false);
            setShowModal(false);

            console.log('SOS response:', response.data);
            const data = response.data as { success: boolean; message: string; alerts: number; notifications: number };

            if (data.success) {
                setPopupMessage(
                    `Emergency alert has been sent to ${data.alerts} caregiver${data.alerts !== 1 ? 's' : ''}. Help is on the way!`
                );
                setPopupType('success');
            } else {
                setPopupMessage(data.message || 'Alert sent but some caregivers may not have been notified.');
                setPopupType('warning');
            }
        } catch (error: any) {
            setLoading(false);
            setShowModal(false);
            console.error('Error sending SOS:', error);
            console.error('Error response:', error.response?.data);

            // Handle specific error cases
            if (error.response?.status === 400) {
                setPopupMessage(error.response.data.message || 'No caregivers linked to this patient.');
                setPopupType('warning');
            } else if (error.response?.status === 401) {
                setPopupMessage('Please login again.');
                setPopupType('error');
            } else if (error.response?.status === 500) {
                setPopupMessage('Server error. Please try again later.');
                setPopupType('error');
            } else {
                setPopupMessage('Failed to send SOS alert. Please try again or call emergency services directly.');
                setPopupType('error');
            }
        }
    };

    const handleNo = () => {
        setShowModal(false);
    };

    const closePopup = () => {
        setPopupMessage(null);
    };

    return (
        <View className="flex-1 items-center justify-center bg-white">
            <View className="items-center">
                {/* SOS Button */}
                <TouchableOpacity
                    onPress={handleSOSPress}
                    className="w-64 h-64 rounded-full bg-red-600 items-center justify-center shadow-lg"
                    activeOpacity={0.8}
                >
                    <Text className="text-6xl font-bold text-white">SOS</Text>
                </TouchableOpacity>

                {/* Description */}
                <Text className="text-xl text-gray-700 text-center px-8 mt-8">
                    Emergency assistance when you need it most
                </Text>

                {/* Caretaker count */}
                {caretakers.length > 0 ? (
                    <Text className="text-sm text-gray-500 text-center mt-4">
                        {caretakers.length} caregiver{caretakers.length !== 1 ? 's' : ''} will be alerted
                    </Text>
                ) : (
                    <Text className="text-sm text-orange-500 text-center mt-4 px-8">
                        No caregivers linked. Please add a caregiver from your profile.
                    </Text>
                )}


            </View>

            {/* Confirmation Modal */}
            {showModal && (
                <View className="absolute inset-0 bg-black/50 items-center justify-center">
                    <View className="bg-white rounded-2xl p-6 mx-8 shadow-xl" style={{ maxWidth: 340 }}>
                        <Text className="text-lg font-semibold text-gray-800 text-center mb-6">
                            Do you want to enable SOS mode and inform your Caregivers?
                        </Text>

                        {loading ? (
                            <View className="py-4">
                                <ActivityIndicator size="large" color="#dc2626" />
                                <Text className="text-center text-gray-600 mt-2">
                                    Sending alert...
                                </Text>
                            </View>
                        ) : (
                            <View className="flex-row justify-center space-x-4">
                                <TouchableOpacity
                                    onPress={handleYes}
                                    className="bg-blue-600 px-8 py-3 rounded-lg"
                                    activeOpacity={0.8}
                                >
                                    <Text className="text-white font-semibold text-base">Yes</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleNo}
                                    className="bg-red-500 px-8 py-3 rounded-lg"
                                    activeOpacity={0.8}
                                >
                                    <Text className="text-white font-semibold text-base">No</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {/* Centered Popup */}
            {popupMessage && (
                <View className="absolute inset-0 bg-black/30 items-center justify-center">
                    <View className="bg-white rounded-2xl p-6 mx-8 shadow-xl" style={{ maxWidth: 300 }}>
                        <Text
                            className={`text-center text-lg font-semibold mb-4 ${popupType === 'success'
                                ? 'text-green-600'
                                : popupType === 'warning'
                                    ? 'text-orange-500'
                                    : 'text-red-600'
                                }`}
                        >
                            {popupMessage}
                        </Text>
                        <TouchableOpacity
                            onPress={closePopup}
                            className="bg-blue-600 px-6 py-2 rounded-lg self-center"
                        >
                            <Text className="text-white font-semibold text-base">OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

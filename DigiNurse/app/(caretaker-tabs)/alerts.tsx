import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { storage } from '../../config/storage';
import "../../global.css";

interface AlertItem {
    _id: string;
    type: string; // 'urgent' | 'warning' | 'info' | 'emergency'
    title: string;
    patient: string;
    patientId?: string;
    patientID?: string; // Patient ID like PT12345
    message: string;
    timestamp: string | Date;
    priority: string; // 'Critical' | 'High' | 'Medium' | 'Low'
    status: string; // 'active' | 'acknowledged' | 'resolved'
    emergencyType?: string;
    isRead: boolean;
    createdAt: string | Date;
}

export default function AlertsScreen() {
    const router = useRouter();
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const token = await storage.getItem('caretakerToken');
            if (!token) {
                Alert.alert('Error', 'Please login as a caretaker first');
                setLoading(false);
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/api/alerts`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data as { success: boolean; alerts: AlertItem[]; message?: string };
            if (data.success) {
                setAlerts(data.alerts || []);
            } else {
                throw new Error(data.message || 'Failed to fetch alerts');
            }
        } catch (error: any) {
            console.error('Error fetching alerts:', error);
            if (error?.response?.status !== 401 && error?.response?.status !== 403) {
                Alert.alert('Error', 'Failed to fetch alerts. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: string | Date): string => {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes} min ago`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)} hours ago`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)} days ago`;
        }
    };

    const openChat = (patientName: string, patientId?: string) => {
        if (patientId) {
            router.push({
                pathname: '/screens/caretaker-chat',
                params: {
                    patientId: patientId,
                    patientName: patientName
                }
            });
        } else {
            Alert.alert('Info', `Opening chat with ${patientName}`);
        }
    };

    const acknowledgeAlert = async (alertId: string) => {
        try {
            const token = await storage.getItem('caretakerToken');
            if (!token) return;

            const response = await axios.put(
                `${API_BASE_URL}/api/alerts/${alertId}/acknowledge`,
                { notes: 'Alert acknowledged by caretaker' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = response.data as { success: boolean };
            if (data.success) {
                setAlerts(prev => prev.map(alert =>
                    alert._id === alertId
                        ? { ...alert, status: 'acknowledged', isRead: true }
                        : alert
                ));
                Alert.alert('Success', 'Alert acknowledged');
            }
        } catch (error: any) {
            console.error('Error acknowledging alert:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to acknowledge alert');
        }
    };

    const markAsRead = async (alertId: string) => {
        try {
            const token = await storage.getItem('caretakerToken');
            if (!token) return;

            await axios.put(
                `${API_BASE_URL}/api/alerts/${alertId}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setAlerts(prev => prev.map(alert =>
                alert._id === alertId
                    ? { ...alert, isRead: true }
                    : alert
            ));
        } catch (error) {
            console.error('Error marking alert as read:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAlerts();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-600 mt-4">Loading alerts...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="px-6 pt-12 pb-6">
                <Text className="text-3xl font-bold text-blue-900 text-center mb-2">
                    All Alerts
                </Text>
            </View>

            {/* Alerts List */}
            <ScrollView
                className="flex-1 px-6"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {alerts.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
                        <Text className="text-lg text-gray-500 mt-4 text-center">
                            No alerts available
                        </Text>
                        <Text className="text-sm text-gray-400 mt-2 text-center">
                            Alerts from your patients will appear here
                        </Text>
                    </View>
                ) : (
                    alerts.map((alert) => (
                        <View
                            key={alert._id}
                            className={`bg-white rounded-xl p-4 mb-3 shadow-sm border ${!alert.isRead ? 'border-blue-400 border-2' : 'border-gray-200'}`}
                        >
                            <View className="flex-row items-start">
                                {/* Avatar */}
                                <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mr-3 border-2 border-blue-200">
                                    <Ionicons name="person" size={24} color="#3B82F6" />
                                </View>

                                {/* Content */}
                                <View className="flex-1">
                                    <Text className="text-base font-semibold text-gray-900 mb-1">
                                        {alert.patient} {alert.patientID && `(${alert.patientID})`}
                                    </Text>
                                    <Text className="text-sm text-gray-600 mb-3">
                                        {alert.message}
                                    </Text>

                                    {/* Action Buttons */}
                                    <View className="flex-row gap-2">
                                        <TouchableOpacity
                                            onPress={() => openChat(alert.patient, alert.patientId)}
                                            className="border border-blue-500 rounded-lg px-4 py-2 flex-1 items-center"
                                            activeOpacity={0.7}
                                        >
                                            <Text className="text-blue-500 text-sm font-medium">
                                                Chat
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => {
                                                acknowledgeAlert(alert._id);
                                                if (!alert.isRead) markAsRead(alert._id);
                                            }}
                                            className="bg-red-500 rounded-lg px-4 py-2 flex-1 items-center"
                                            activeOpacity={0.7}
                                        >
                                            <Text className="text-white text-sm font-medium">
                                                Acknowledge
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

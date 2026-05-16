import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../../config/api';
import { storage } from '../../config/storage';
import { useChat } from '../../contexts/ChatContext';
import "../../global.css";

interface Patient {
    _id: string;
    fullName: string;
    patientID: string;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
}

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderRole: string;
    timestamp: number;
    readBy: string[];
}

export default function ChatsScreen() {
    const router = useRouter();
    const { connected, getUnreadCount, getMessages } = useChat();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [caretakerId, setCaretakerId] = useState<string>('');

    // Fetch patients from backend
    const fetchPatients = async () => {
        try {
            const token = await storage.getItem('caretakerToken');
            if (!token) {
                Alert.alert('Error', 'Please login to view patients');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/caretaker/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch patients');
            }

            const data = await response.json();
            const linkedPatients = data.linkedPatients || [];
            setCaretakerId(data._id || '');

            // Transform patient data to include chat info
            const patientsWithChatInfo = linkedPatients.map((patient: any) => {
                // Get room ID (sorted IDs)
                const roomId = [data._id, patient._id].sort().join('_');
                const messages = getMessages(roomId);
                const lastMessage = messages && messages.length > 0 
                    ? messages[messages.length - 1] 
                    : null;

                return {
                    _id: patient._id,
                    fullName: patient.fullName,
                    patientID: patient.patientID,
                    lastMessage: lastMessage 
                        ? (lastMessage.senderRole === 'caretaker' ? 'You: ' : '') + lastMessage.text
                        : "No messages yet",
                    lastMessageTime: lastMessage 
                        ? formatTime(lastMessage.timestamp)
                        : "Never",
                    unreadCount: getUnreadCount(patient._id)
                };
            });

            // Sort by last message time (most recent first)
            patientsWithChatInfo.sort((a: Patient, b: Patient) => {
                if (a.lastMessageTime === "Never" && b.lastMessageTime === "Never") return 0;
                if (a.lastMessageTime === "Never") return 1;
                if (b.lastMessageTime === "Never") return -1;
                return 0; // For now, keep original order if both have messages
            });

            setPatients(patientsWithChatInfo);
        } catch (error) {
            console.error('Error fetching patients:', error);
            Alert.alert('Error', 'Failed to load patients');
        } finally {
            setLoading(false);
        }
    };


    // Format timestamp to readable time (matching image format)
    const formatTime = (timestamp: number) => {
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
        const diffInDays = Math.floor(diffInHours / 24);

        // Today - show time like "Today 12:13PM"
        if (diffInDays === 0) {
            const timeStr = messageTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            return `Today ${timeStr}`;
        }
        // Yesterday - show "Yesterday 10:30AM"
        else if (diffInDays === 1) {
            const timeStr = messageTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            return `Yesterday ${timeStr}`;
        }
        // This week - show day name like "Tuesday 3:55PM"
        else if (diffInDays < 7) {
            const timeStr = messageTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            return `${messageTime.toLocaleDateString('en-US', { weekday: 'long' })} ${timeStr}`;
        }
        // Older - show day and time like "Sunday 11:00AM"
        else {
            const timeStr = messageTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            return `${messageTime.toLocaleDateString('en-US', { weekday: 'long' })} ${timeStr}`;
        }
    };

    useEffect(() => {
        fetchPatients();
        // Refresh periodically to get latest messages
        const interval = setInterval(() => {
            fetchPatients();
        }, 5000); // Refresh every 5 seconds

        return () => clearInterval(interval);
    }, [getMessages, getUnreadCount]);

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 justify-center items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-600 mt-4">Loading patients...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-6 pt-12 pb-6 bg-white">
                <Text className="text-3xl font-bold text-blue-900 text-center mb-2">
                    My Chats
                </Text>
                <View className="flex-row items-center justify-center">
                    <View className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <Text className="text-sm text-gray-500">
                        {connected ? 'Connected' : 'Disconnected'}
                    </Text>
                </View>
            </View>

            {/* Conversations List */}
            <ScrollView className="flex-1 px-6">
                {patients.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
                        <Text className="text-lg text-gray-500 mt-4 text-center">
                            No patients linked yet
                        </Text>
                        <Text className="text-sm text-gray-400 mt-2 text-center">
                            Patients will appear here once they're linked to your account
                        </Text>
                    </View>
                ) : (
                    patients.map((patient) => (
                        <TouchableOpacity
                            key={patient._id}
                            className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
                            onPress={() => {
                                // Navigate to individual chat screen
                                router.push({
                                    pathname: '/screens/caretaker-chat',
                                    params: {
                                        patientId: patient._id,
                                        patientName: patient.fullName
                                    }
                                });
                            }}
                        >
                            <View className="flex-row items-center">
                                {/* Avatar */}
                                <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mr-3 border-2 border-blue-200">
                                    <Ionicons name="person" size={24} color="#3B82F6" />
                                </View>

                                {/* Patient Info */}
                                <View className="flex-1">
                                    <View className="flex-row items-center justify-between mb-1">
                                        <Text className="text-lg font-bold text-gray-800">
                                            {patient.fullName}
                                        </Text>
                                        <Text className="text-sm text-gray-500">
                                            {patient.lastMessageTime}
                                        </Text>
                                    </View>
                                    <Text className="text-sm text-gray-500 mb-1">
                                        {patient.patientID}
                                    </Text>
                                    <Text className="text-gray-600 text-sm" numberOfLines={1}>
                                        {patient.lastMessage}
                                    </Text>
                                </View>

                                {/* Unread Badge */}
                                {patient.unreadCount && patient.unreadCount > 0 && (
                                    <View className="bg-red-500 rounded-full w-6 h-6 items-center justify-center ml-2">
                                        <Text className="text-white text-xs font-bold">
                                            {patient.unreadCount}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

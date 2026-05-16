import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { storage } from '../../config/storage';
import { API_BASE_URL } from '../../config/api';
import { useChat } from '../../contexts/ChatContext';
import "../../global.css";

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderRole: string;
    timestamp: number;
    readBy: string[];
}

interface ChatParams {
    caregiverId?: string;
    caregiverName?: string;
    patientId?: string;
    patientName?: string;
}

export default function ChatScreen() {
    const router = useRouter();
    const rawParams = useLocalSearchParams();
    // Safe cast via unknown
    const params = rawParams as unknown as ChatParams;

    // Fallback values
    const otherUserId = params.caregiverId || params.patientId || '';
    const otherUserName = params.caregiverName || params.patientName || 'Unknown User';

    const scrollViewRef = useRef<ScrollView>(null);

    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
    const [roomId, setRoomId] = useState('');
    const { socket, connected, messages: allMessages, sendMessage, joinRoom } = useChat();

    useEffect(() => {
        initializeChat();
        // Do not disconnect the shared singleton socket on unmount
        return () => {};
    }, []);

    const initializeChat = async () => {
        try {
            const patientToken = await storage.getItem('patientToken');
            const caretakerToken = await storage.getItem('caretakerToken');

            let userRole = '';
            let userId = '';

            if (patientToken) {
                userRole = 'patient';
                try {
                    const res = await fetch(`${API_BASE_URL}/api/patient/dashboard`, {
                        headers: { Authorization: `Bearer ${patientToken}` }
                    });
                    const data = await res.json();
                    userId = data._id || (await storage.getItem('patientID')) || '';
                } catch {
                    userId = await storage.getItem('patientID') || '';
                }
            } else if (caretakerToken) {
                userRole = 'caretaker';
                try {
                    const res = await fetch(`${API_BASE_URL}/api/caretaker/profile`, {
                        headers: { Authorization: `Bearer ${caretakerToken}` }
                    });
                    const data = await res.json();
                    userId = data._id || (await storage.getItem('caretakerID')) || '';
                } catch {
                    userId = await storage.getItem('caretakerID') || '';
                }
            } else {
                Alert.alert('Error', 'No valid token found');
                router.back();
                return;
            }

            if (!userId || !otherUserId) {
                Alert.alert('Error', 'Cannot start chat - missing user information');
                router.back();
                return;
            }

            if (userId === otherUserId) {
                Alert.alert('Error', 'Cannot chat with yourself');
                router.back();
                return;
            }

            setCurrentUser({ id: userId, role: userRole });
            const room = [userId, otherUserId].sort().join('_');
            setRoomId(room);

            // use shared ChatContext socket — just set loading false here
            setLoading(false);

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to initialize chat');
            setLoading(false);
        }
    };

    const sendMessageLocal = () => {
        if (!newMessage.trim() || !currentUser) return;
        sendMessage(roomId, newMessage.trim(), currentUser.id, currentUser.role);
        setNewMessage('');
    };

    const handleTyping = (text: string) => {
        setNewMessage(text);
        // avoid duplicate typing emits; consider implementing in ChatContext if needed
    };

    // join room when shared socket connects
    useEffect(() => {
        if (connected && roomId && currentUser) {
            try {
                joinRoom(roomId, currentUser.id, currentUser.role);
                setIsConnected(true);
            } catch (e) {
                console.error('Failed to join room after connect:', e);
            }
        }
    }, [connected, roomId, currentUser, joinRoom]);

    const scrollToBottom = () => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (loading) {
        return (
            <View className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#0077B6" />
                <Text className="mt-4 text-gray-600">Connecting to chat...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-[#0077B6]">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View className="flex-1 items-center">
                    <Text className="text-white text-lg font-semibold">{otherUserName}</Text>
                    <View className="flex-row items-center">
                        <View className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                        <Text className="text-white text-xs">{isConnected ? 'Online' : 'Offline'}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => console.log({ currentUser, roomId, params, isConnected })}>
                    <Ionicons name="information-circle" size={24} color="white" />
                </TouchableOpacity>
            </View>




            {/* Messages */}
            <ScrollView ref={scrollViewRef} className="flex-1 px-4 py-2" onContentSizeChange={scrollToBottom}>
                {(allMessages[roomId] || []).map(message => {
                    const isOwn = message.senderId === currentUser?.id;
                    return (
                        <View key={message.id} className={`mb-3 ${isOwn ? 'items-end' : 'items-start'}`}>
                            <View className={`max-w-[80%] px-4 py-2 rounded-lg ${isOwn ? 'bg-[#90CFEF] rounded-br-sm' : 'bg-[#EBF9FC] rounded-bl-sm'}`}>
                                <Text className={`text-sm ${isOwn ? 'text-black' : 'text-gray-800'}`}>{message.text}</Text>
                                <Text className={`text-xs mt-1 ${isOwn ? 'text-black' : 'text-gray-500'}`}>{formatTime(message.timestamp)}</Text>
                            </View>
                        </View>
                    );
                })}
                {isTyping && (
                    <View className="mb-3 items-start">
                        <View className="bg-gray-200 px-4 py-2 rounded-lg rounded-bl-sm">
                            <Text className="text-gray-500 text-sm italic">Typing...</Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Input */}
            <View className="flex-row items-center px-4 py-3 bg-[#EBF9FC] border-t border-gray-200">
                <TextInput
                    className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-3 mr-3"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChangeText={handleTyping}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity className={`w-12 h-12 rounded-full items-center justify-center ${newMessage.trim() ? 'bg-[#0077B6]' : 'bg-gray-300'}`} onPress={sendMessageLocal} disabled={!newMessage.trim() || !isConnected}>
                    <Ionicons name="send" size={20} color={newMessage.trim() ? 'white' : 'gray'} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

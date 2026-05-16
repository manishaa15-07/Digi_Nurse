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
    patientId: string;
    patientName: string;
    caregiverId?: string;
    caregiverName?: string;
}

export default function CaretakerChatScreen() {
    const router = useRouter();
    const rawParams = useLocalSearchParams();
    const { connected, getMessages, sendMessage, joinRoom, markAsRead } = useChat();

    // Safe cast via unknown
    const params = rawParams as unknown as ChatParams;

    // Provide fallback values
    const patientId = params.patientId || '';
    const patientName = params.patientName || 'Unknown Patient';

    const scrollViewRef = useRef<ScrollView>(null);

    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
    const [roomId, setRoomId] = useState('');

    const messages = getMessages(roomId);

    useEffect(() => {
        initializeChat();
    }, []);

    // Ensure we join the room once the shared chat socket becomes connected
    useEffect(() => {
        if (connected && roomId && currentUser) {
            try {
                joinRoom(roomId, currentUser.id, currentUser.role);
            } catch (e) {
                console.error('Failed to join room after connect:', e);
            }
        }
    }, [connected, roomId, currentUser, joinRoom]);

    const initializeChat = async () => {
        try {
            const token = await storage.getItem('caretakerToken');
            if (!token) {
                Alert.alert('Error', 'Please login as a caretaker');
                router.back();
                return;
            }

            // Get caretaker profile
            let userId = '';
            try {
                const profileRes = await fetch(`${API_BASE_URL}/api/caretaker/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const profileData = await profileRes.json();
                userId = profileData._id;
            } catch {
                userId = (await storage.getItem('caretakerID')) || '';
            }

            if (!userId) {
                Alert.alert('Error', 'User not authenticated');
                router.back();
                return;
            }

            const userRole = 'caretaker';
            setCurrentUser({ id: userId, role: userRole });

            // Room ID based on participants
            if (!patientId || patientId === userId) {
                Alert.alert('Error', 'Invalid chat participant');
                router.back();
                return;
            }

            const room = [userId, patientId].sort().join('_');
            setRoomId(room);

            // Join room using chat context
            if (connected) {
                joinRoom(room, userId, userRole);
            }

            setLoading(false);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to initialize chat');
            setLoading(false);
        }
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !currentUser || !roomId) return;

        sendMessage(roomId, newMessage.trim(), currentUser.id, currentUser.role);
        setNewMessage('');
    };

    const handleTyping = (text: string) => {
        setNewMessage(text);
    };

    const scrollToBottom = () => {
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

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
        <KeyboardAvoidingView className="flex-1 bg-gray-100" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <View className="flex-1 items-center">
                    <Text className="text-gray-900 text-lg font-semibold">{patientName}</Text>
                    <View className="flex-row items-center mt-1">
                        <View className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <Text className="text-gray-500 text-sm">{connected ? 'Online' : 'Offline'}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => console.log({ currentUser, roomId, params, connected })} className="p-2">
                    <Ionicons name="information-circle-outline" size={24} color="#374151" />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView ref={scrollViewRef} className="flex-1 px-4 py-2" onContentSizeChange={scrollToBottom}>
                {messages.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
                        <Text className="text-lg text-gray-500 mt-4 text-center">
                            No messages yet
                        </Text>
                        <Text className="text-sm text-gray-400 mt-2 text-center">
                            Start a conversation with {patientName}
                        </Text>
                    </View>
                ) : (
                    messages.map((message, index) => {
                        const isOwn = message.senderId === currentUser?.id;
                        const prevMessage = index > 0 ? messages[index - 1] : null;
                        const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId !== message.senderId);

                        return (
                            <View key={message.id} className={`mb-2 ${isOwn ? 'items-end' : 'items-start'}`}>
                                <View className={`flex-row max-w-[85%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar for received messages */}
                                    {showAvatar && !isOwn && (
                                        <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-2 mt-1">
                                            <Ionicons name="person" size={16} color="#3B82F6" />
                                        </View>
                                    )}

                                    {/* Spacer for sent messages */}
                                    {isOwn && <View className="w-8" />}

                                    {/* Message bubble */}
                                    <View className={`flex-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                                        <View className={`px-4 py-3 rounded-2xl ${isOwn
                                            ? 'bg-blue-500 rounded-br-md'
                                            : 'bg-white rounded-bl-md border border-gray-200'
                                            }`}>
                                            <Text className={`text-sm leading-5 ${isOwn ? 'text-white' : 'text-gray-800'
                                                }`}>
                                                {message.text}
                                            </Text>
                                        </View>

                                        {/* Timestamp */}
                                        <Text className={`text-xs mt-1 px-2 ${isOwn ? 'text-gray-500 text-right' : 'text-gray-400 text-left'
                                            }`}>
                                            {formatTime(message.timestamp)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}

                {/* Typing indicator */}
                {isTyping && (
                    <View className="mb-2 items-start">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-2">
                                <Ionicons name="person" size={16} color="#3B82F6" />
                            </View>
                            <View className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-gray-200">
                                <View className="flex-row items-center space-x-1">
                                    <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                                    <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                    <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Input */}
            <View className="flex-row items-end px-4 py-3 bg-white border-t border-gray-200">
                <View className="flex-1 bg-gray-100 rounded-full px-4 py-3 mr-3 max-h-20">
                    <TextInput
                        className="text-gray-800 text-base"
                        placeholder="Type a message..."
                        placeholderTextColor="#9CA3AF"
                        value={newMessage}
                        onChangeText={handleTyping}
                        multiline
                        maxLength={500}
                    />
                </View>
                <TouchableOpacity
                    className={`w-12 h-12 rounded-full items-center justify-center ${newMessage.trim() && connected
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                        }`}
                    onPress={handleSendMessage}
                    disabled={!newMessage.trim() || !connected}
                >
                    <Ionicons
                        name="send"
                        size={20}
                        color={newMessage.trim() && connected ? 'white' : '#9CA3AF'}
                    />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

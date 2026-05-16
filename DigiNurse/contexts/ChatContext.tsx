import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { createSocketConnection } from '../utils/socket-client';
import { API_BASE_URL } from '../config/api';
import { storage } from '../config/storage';

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderRole: string;
    timestamp: number;
    readBy: string[];
    roomId?: string;
}

interface ChatContextType {
    socket: any;
    connected: boolean;
    messages: { [roomId: string]: Message[] };
    unreadCounts: { [patientId: string]: number };
    sendMessage: (roomId: string, text: string, senderId: string, senderRole: string) => void;
    joinRoom: (roomId: string, userId: string, role: string) => void;
    leaveRoom: (roomId: string) => void;
    markAsRead: (roomId: string, messageIds: string[]) => void;
    getMessages: (roomId: string) => Message[];
    getUnreadCount: (patientId: string) => number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<any>(null);
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState<{ [roomId: string]: Message[] }>({});
    const [unreadCounts, setUnreadCounts] = useState<{ [patientId: string]: number }>({});
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const joinedRoomsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        initializeSocket();
        // Do not disconnect shared socket on unmount; it's a singleton used across providers
        return () => {};
    }, []);

    const initializeSocket = async () => {
        try {
            // Try to get either caretaker or patient token
            const caretakerToken = await storage.getItem('caretakerToken');
            const patientToken = await storage.getItem('patientToken');
            const token = caretakerToken || patientToken;
            
            if (!token) return;

            // determine current user id (used to avoid counting our own messages as unread)
            try {
                const uid = caretakerToken ? await storage.getItem('caretakerID') : await storage.getItem('patientID');
                setCurrentUserId(uid || null);
            } catch (e) {
                setCurrentUserId(null);
            }

            const socketUrl = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');
            const newSocket = await createSocketConnection(socketUrl, {
                transports: ['websocket'],
                timeout: 20000,
                forceNew: true
            });

            newSocket.on('connect', () => {
                console.log('Chat socket connected');
                setConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('Chat socket disconnected');
                setConnected(false);
                // Clear joined rooms so re-join may happen on reconnect
                joinedRoomsRef.current.clear();
            });

            newSocket.on('connect_error', (error) => {
                console.error('Chat socket connection error:', error);
                setConnected(false);
            });

            newSocket.on('history', (data: { roomId: string; messages: Message[] }) => {
                console.log('Received chat history for room:', data.roomId);
                setMessages(prev => ({
                    ...prev,
                    [data.roomId]: data.messages || []
                }));
            });

            newSocket.on('message', (message: Message) => {
                console.log('New message received:', message);
                // We need to determine the room ID from the message
                // For now, we'll use a simple approach - you might need to modify this based on your backend
                const roomId = message.roomId || 'default'; // Assuming message has roomId
                
                setMessages(prev => {
                    const roomMsgs = prev[roomId] || [];
                    // dedupe by message id (or clientId if id missing)
                    const already = roomMsgs.some(m => (m.id && message.id && m.id === message.id) || (m.clientId && message.clientId && m.clientId === message.clientId));
                    if (already) return prev;
                    return {
                        ...prev,
                        [roomId]: [...roomMsgs, message]
                    };
                });

                // Only increment unread count for messages not from current user
                if (message.senderId !== currentUserId) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [message.senderId]: (prev[message.senderId] || 0) + 1
                    }));
                }
            });

            newSocket.on('read', (data: { userId: string; messageIds: string[] }) => {
                console.log('Messages marked as read:', data);
                // Update read status for messages
                setMessages(prev => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach(roomId => {
                        updated[roomId] = updated[roomId].map(msg =>
                            data.messageIds.includes(msg.id) && !msg.readBy.includes(data.userId)
                                ? { ...msg, readBy: [...msg.readBy, data.userId] }
                                : msg
                        );
                    });
                    return updated;
                });
            });

            newSocket.on('joined', (data: any) => console.log('Server joined ack', data));
            setSocket(newSocket);
        } catch (error) {
            console.error('Failed to initialize chat socket:', error);
        }
    };

    const sendMessage = (roomId: string, text: string, senderId: string, senderRole: string) => {
        if (!socket || !connected) {
            console.error('Socket not connected');
            return;
        }

        const messageData = {
            roomId,
            text: text.trim(),
            senderId,
            senderRole,
            clientId: `client_${Date.now()}`
        };

        socket.emit('message', messageData);
    };

    const joinRoom = (roomId: string, userId: string, role: string) => {
        if (!socket || !connected) {
            console.error('Socket not connected');
            return;
        }

        if (joinedRoomsRef.current.has(roomId)) {
            console.log('ChatContext: already joined room', roomId);
            return;
        }

        socket.emit('join', { roomId, userId, role });
        joinedRoomsRef.current.add(roomId);
    };

    const leaveRoom = (roomId: string) => {
        if (!socket || !connected) return;

        socket.emit('leave', { roomId });
    };

    const markAsRead = (roomId: string, messageIds: string[]) => {
        if (!socket || !connected) return;

        socket.emit('read', { roomId, messageIds });
    };

    const getMessages = (roomId: string): Message[] => {
        return messages[roomId] || [];
    };

    const getUnreadCount = (patientId: string): number => {
        return unreadCounts[patientId] || 0;
    };

    const value: ChatContextType = {
        socket,
        connected,
        messages,
        unreadCounts,
        sendMessage,
        joinRoom,
        leaveRoom,
        markAsRead,
        getMessages,
        getUnreadCount
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};


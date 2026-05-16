import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { storage } from '../config/storage';
import { API_BASE_URL } from '../config/api';
import { createSocketConnection } from '../utils/socket-client';

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Notification) => void;
    clearNotifications: () => void;
    markAsRead: (id: string) => void;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'message' | 'request' | 'alert';
    timestamp: number;
    read: boolean;
    data?: any;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [socket, setSocket] = useState<any>(null);
    const joinedPersonalRef = useRef<boolean>(false);

    useEffect(() => {
        initializeNotifications();
        // Do not disconnect the shared singleton socket here
        return () => {};
    }, []);

    const initializeNotifications = async () => {
        try {
            // Get current user info
            const patientToken = await storage.getItem('patientToken');
            const caretakerToken = await storage.getItem('caretakerToken');

            if (!patientToken && !caretakerToken) return;

            const userId = patientToken
                ? await storage.getItem('patientID')
                : await storage.getItem('caretakerID');

            if (!userId) return;

            // Initialize socket connection for notifications
            const socketUrl = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');

            const newSocket = await createSocketConnection(socketUrl, {
                transports: ['websocket'],
                timeout: 20000,
            });

            newSocket.on('connect', () => {
                console.log('Connected to notification server', { socketId: newSocket.id });
            });

            // Join a personal room to receive message notifications
            const personalRoomJoin = async () => {
                try {
                    if (joinedPersonalRef.current) return;
                    const userId = await storage.getItem('patientID') || await storage.getItem('caretakerID');
                    if (userId) {
                        newSocket.emit('join', { roomId: userId, userId, role: patientToken ? 'patient' : 'caretaker' });
                        joinedPersonalRef.current = true;
                    }
                } catch (e) {
                    console.error('Failed to join personal notification room:', e);
                }
            };
            personalRoomJoin();

            // Listen for new messages
            newSocket.on('message', (message: any) => {
                // Only show notification if message is not from current user
                if (message.senderId !== userId) {
                    addNotification({
                        id: `msg_${message.id}`,
                        title: 'New Message',
                        message: message.text,
                        type: 'message',
                        timestamp: message.timestamp,
                        read: false,
                        data: message
                    });
                }
            });

            // Listen for connection requests
            newSocket.on('connection_request', (data: any) => {
                addNotification({
                    id: `req_${Date.now()}`,
                    title: 'New Connection Request',
                    message: `${data.requesterName} wants to connect with you`,
                    type: 'request',
                    timestamp: Date.now(),
                    read: false,
                    data: data
                });
            });

            setSocket(newSocket);

        } catch (error) {
            console.error('Error initializing notifications:', error);
        }
    };

    const addNotification = (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);

        // Show alert for important notifications
        if (notification.type === 'message' || notification.type === 'request') {
            Alert.alert(notification.title, notification.message);
        }
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === id ? { ...notif, read: true } : notif
            )
        );
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            clearNotifications,
            markAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

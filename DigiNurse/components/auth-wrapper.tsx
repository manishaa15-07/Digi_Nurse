import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { storage } from '../config/storage';

interface AuthWrapperProps {
    children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [shouldShowProfileSelection, setShouldShowProfileSelection] = useState(false);
    const router = useRouter();

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const patientToken = await storage.getItem('patientToken');
            const caretakerToken = await storage.getItem('caretakerToken');

            // If no tokens exist, show profile selection
            if (!patientToken && !caretakerToken) {
                setShouldShowProfileSelection(true);
            }
            // If tokens exist, let the tab layouts handle the routing
            else {
                setShouldShowProfileSelection(false);
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            setShouldShowProfileSelection(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    if (shouldShowProfileSelection) {
        router.replace('/');
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return <>{children}</>;
}

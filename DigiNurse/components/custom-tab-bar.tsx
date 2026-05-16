import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
    ChatIcon,
    CameraIcon,
    HomeIcon,
    SOSIcon,
    CaregiversIcon,
    BellIcon,
    MedicalBagIcon,
    UsersIcon,
    PlusIcon,
    CalendarIcon
} from './tab-icons';
import { storage } from '../config/storage';

const { width } = Dimensions.get('window');

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const [userRole, setUserRole] = useState<'patient' | 'caretaker' | null>(null);
    const tabWidth = width / state.routes.length;

    useEffect(() => {
        checkUserRole();
    }, []);

    const checkUserRole = async () => {
        try {
            const patientToken = await storage.getItem('patientToken');
            const caretakerToken = await storage.getItem('caretakerToken');

            // Clear conflicting tokens - only one role should be active at a time
            // Prioritize patient role (matches _layout.tsx behavior)
            if (patientToken && caretakerToken) {
                await storage.removeItem('caretakerToken');
                setUserRole('patient');
            } else if (patientToken) {
                setUserRole('patient');
            } else if (caretakerToken) {
                setUserRole('caretaker');
            }
        } catch (error) {
            console.error('Error checking user role:', error);
        }
    };

    const getIcon = (routeName: string, isFocused: boolean) => {
        const color = isFocused ? '#0077B6' : '#94a3b8';

        if (userRole === 'caretaker') {
            switch (routeName) {
                case 'chats':
                    return <ChatIcon size={24} color={color} />;
                case 'alerts':
                    return <BellIcon size={24} color={color} />;
                case 'index':
                    return <MedicalBagIcon size={24} color={color} />;
                case 'my-patients':
                    return <UsersIcon size={24} color={color} />;
                case 'link':
                    return <PlusIcon size={24} color={color} />;
                default:
                    return null;
            }
        } else {
            // Patient tabs
            switch (routeName) {
                case 'ai-chatbot':
                    return <ChatIcon size={24} color={color} />;
                case 'appointment-calendar':
                    return <CalendarIcon size={24} color={color} />;
                case 'index':
                    return <HomeIcon size={24} color={color} />;
                case 'sos':
                    return <SOSIcon size={24} color={color} />;
                case 'my-caregivers':
                    return <CaregiversIcon size={24} color={color} />;
                default:
                    return null;
            }
        }
    };

    return (
        <View style={styles.container}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel !== undefined
                    ? options.tabBarLabel
                    : options.title !== undefined
                        ? options.title
                        : route.name;

                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        onPress={onPress}
                        style={[styles.tab, { width: tabWidth }]}
                    >
                        <View style={[styles.tabContent, isFocused && styles.activeTab]}>
                            <View style={styles.iconContainer}>
                                {getIcon(route.name, isFocused)}
                            </View>
                            <Text style={styles.label}>
                                {typeof label === 'string' ? label : route.name}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff', // light blue background
        height: 80,
        paddingHorizontal: 8,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
        marginHorizontal: 4,
        minHeight: 64,
    },
    activeTab: {
        backgroundColor: '#dbeafe', // slightly darker blue for active state
        borderRadius: 12,
    },
    iconContainer: {
        marginBottom: 4,
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
        color: '#1e3a8a',
    },
});

import { Tabs } from 'expo-router';
import React from 'react';
import "../../global.css"
import { CustomTabBar } from '@/components/custom-tab-bar';

export default function CaretakerTabLayout() {
    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}>
            <Tabs.Screen
                name="chats"
                options={{
                    title: 'Chats',
                }}
            />
            <Tabs.Screen
                name="alerts"
                options={{
                    title: 'Alerts',
                }}
            />
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                }}
            />
            <Tabs.Screen
                name="my-patients"
                options={{
                    title: 'My Patients',
                }}
            />
            <Tabs.Screen
                name="link"
                options={{
                    title: 'Link',
                }}
            />
        </Tabs>
    );
}

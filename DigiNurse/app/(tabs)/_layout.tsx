import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import "../../global.css"
import { CustomTabBar } from '@/components/custom-tab-bar';
import { storage } from '../../config/storage';

export default function TabLayout() {
  const [userRole, setUserRole] = useState<'patient' | 'caretaker' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const patientToken = await storage.getItem('patientToken');
      const caretakerToken = await storage.getItem('caretakerToken');

      // Prioritize patient role if both tokens exist
      if (patientToken && caretakerToken) {
        // Clear caretaker token to avoid conflicts
        await storage.removeItem('caretakerToken');
        setUserRole('patient');
      } else if (patientToken) {
        setUserRole('patient');
      } else if (caretakerToken) {
        setUserRole('caretaker');
      } else {
        // No tokens found, redirect to profile selection
        setUserRole(null);
        router.replace('/');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole(null);
      router.replace('/');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while determining user role
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // If no user role is found, redirect to profile selection
  if (!userRole) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // If user is a caretaker, redirect to caretaker tabs
  if (userRole === 'caretaker') {
    router.replace('/(caretaker-tabs)');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Default patient tabs
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="ai-chatbot"
        options={{
          title: 'AI Chatbot',
        }}
      />
      <Tabs.Screen
        name="appointment-calendar"
        options={{
          title: 'Calendar',
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: 'SOS',
        }}
      />
      <Tabs.Screen
        name="my-caregivers"
        options={{
          title: 'My Caregivers',
        }}
      />
    </Tabs>
  );
}

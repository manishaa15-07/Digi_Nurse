import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { storage } from '../../config/storage';
import "../../global.css";
import Dashboard from '../patient/dashboard';
// import Dashboard from '../patient/dashboard';

export default function HomeScreen() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<'patient' | 'caretaker' | null>(null);

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
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  // if (userRole === 'caretaker') {
  //   return (
  //     <View className="flex-1 items-center justify-center bg-white px-4">
  //       <Text className="text-3xl font-bold text-blue-900 mb-4">Caretaker Dashboard</Text>
  //       <Text className="text-lg text-gray-600 text-center px-8 mb-8">
  //         Manage your patients and provide care
  //       </Text>

  //       <TouchableOpacity
  //         className="bg-blue-600 rounded-lg px-6 py-3 mb-4"
  //         onPress={() => router.push('/profile')}
  //       >
  //         <Text className="text-white font-semibold text-lg">View Profile</Text>
  //       </TouchableOpacity>

  //       <TouchableOpacity
  //         className="bg-green-600 rounded-lg px-6 py-3"
  //         onPress={() => router.push('/my-patients')}
  //       >
  //         <Text className="text-white font-semibold text-lg">Manage Patients</Text>
  //       </TouchableOpacity>
  //     </View>
  //   );
  // }

  // Default patient home screen
  return (
    // <View className="flex-1 items-center justify-center bg-white px-4">
    //   <Text className="text-3xl font-bold text-blue-900 mb-4">Welcome to DigiNurse</Text>
    //   <Text className="text-lg text-gray-600 text-center px-8 mb-8">
    //     Your healthcare companion for better health management
    //   </Text>

    //   <TouchableOpacity
    //     className="bg-blue-600 rounded-lg px-6 py-3"
    //     onPress={() => router.push('/profile')}
    //   >
    //     <Text className="text-white font-semibold text-lg">View Profile</Text>
    //   </TouchableOpacity>
    // </View>
    <Dashboard />
  );
}

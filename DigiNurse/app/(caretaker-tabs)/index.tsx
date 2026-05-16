import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import "../../global.css";
import Home from '../caretaker/dashboard';

export default function CaretakerHomeScreen() {
    const router = useRouter();

    return (
        //         <View className="flex-1 items-center justify-center bg-white px-4">
        //             <Text className="text-3xl font-bold text-blue-900 mb-4">Caretaker Dashboard</Text>
        //             <Text className="text-lg text-gray-600 text-center px-8 mb-8">
        //                 Manage your patients and provide care
        //             </Text>
        // {/* 
        //             <TouchableOpacity
        //                 className="bg-blue-600 rounded-lg px-6 py-3 mb-4"
        //                 onPress={() => router.push('/screens/caretaker-profile')}
        //             >
        //                 <Text className="text-white font-semibold text-lg">View Profile</Text>
        //             </TouchableOpacity> */}

        //             <TouchableOpacity
        //                 className="bg-green-600 rounded-lg px-6 py-3"
        //                 onPress={() => router.push('/my-patients')}
        //             >
        //                 <Text className="text-white font-semibold text-lg">Manage Patients</Text>
        //             </TouchableOpacity>
        //         </View>


        <View>
            <Home />
        </View>
    );
}




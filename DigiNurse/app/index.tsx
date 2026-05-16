import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import "../global.css";

export default function Index() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white px-6 pt-28">
      {/* App Logo */}
      <View className="items-center mb-12">
        <Image
          source={require("../assets/images/logo.png")}
          style={{ width: 100, height: 100 }}
          resizeMode="contain"
        />
      </View>

      {/* Role Selection Buttons */}
      <View className="flex-row justify-center space-x-4">
        {/* Patient Button */}
        <Pressable
          onPress={() => router.push("/patient/login")}
          className="rounded-xl border border-[#0077B6] w-28 h-28 items-center justify-center shadow-sm"
        >
          {({ pressed }) => (
            <View
              className={`w-full h-full rounded-2xl items-center justify-center ${pressed ? "bg-[#CAF0F8]" : "bg-white"
                }`}
            >
              <Image
                source={require("../assets/images/patient.png")}
                style={{
                  width: 40,
                  height: 40,
                  marginBottom: 4,
                  borderRadius: 20,
                }}
                resizeMode="contain"
              />
              <Text className="text-sm font-semibold text-gray-800">
                Patient
              </Text>
            </View>
          )}
        </Pressable>

        {/* Caretaker Button */}
        <Pressable
          onPress={() => router.push("/caretaker/login")}
          className="rounded-2xl border border-[#0077B6] w-28 h-28 items-center justify-center shadow-sm"
        >
          {({ pressed }) => (
            <View
              className={`w-full h-full rounded-2xl items-center justify-center ${pressed ? "bg-[#CAF0F8]" : "bg-white"
                }`}
            >
              <Image
                source={require("../assets/images/caretaker.png")}
                style={{
                  width: 40,
                  height: 40,
                  marginBottom: 4,
                  borderRadius: 20,
                }}
                resizeMode="contain"
              />
              <Text className="text-sm font-semibold text-gray-800">
                Caretaker
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Footer */}
      <View className="flex-1 justify-start items-center">
        <Text className="text-xl font-semibold text-gray-900 mt-16">
          Select a Profile
        </Text>
      </View>
    </View>
  );
}

// app/doctor/Login.tsx
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";
import { API_BASE_URL } from "../../config/api";
import { storage } from "../../config/storage";
import "../../global.css";

// 👁️ Eye Icon Component
const EyeIcon = ({ hidden = false, color = "#6b7280" }) => (
  <View
    style={{
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <View
      style={{
        width: 20,
        height: 12,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: color,
      }}
    />
    <View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: color,
        position: "absolute",
      }}
    />
    {hidden && (
      <View
        style={{
          width: 1.5,
          height: 22,
          backgroundColor: color,
          position: "absolute",
          transform: [{ rotate: "-45deg" }],
        }}
      />
    )}
  </View>
);

interface DoctorLoginResponse {
  token: string;
  doctorId: string;
  fullName: string;
  email: string;
}

export default function DoctorLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Validation", "Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post<DoctorLoginResponse>(
        `${API_BASE_URL}/api/doctor/login`,
        { email, password },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );

      const { token, doctorId, fullName } = response.data;

      if (!token || !doctorId) throw new Error("Invalid response from server");

      // Store token and doctor info
      await storage.setItem("doctorToken", token);
      await storage.setItem("doctorID", doctorId);
      await storage.setItem("doctorFullName", fullName);

      Alert.alert("Welcome", `Hello Dr. ${fullName}!`);
      router.replace("/doctor/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || "Login failed";
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View
        className={`flex-1 justify-center items-center p-6 ${
          Platform.OS === "web" ? "max-w-md mx-auto" : ""
        }`}
      >
        {/* Doctor Image */}
        <Image
          source={require("../../assets/images/caretaker.png")}
          className="w-20 h-20 mb-2"
          resizeMode="contain"
        />

        <Text className="text-3xl font-bold text-gray-800 mt-4 mb-10">
          Doctor Login
        </Text>

        {/* Email Field */}
        <View className="w-full mb-4">
          <Text className="text-base font-medium text-gray-600 mb-2 ml-1">Email</Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-4 text-base"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Password Field */}
        <View className="w-full mb-5">
          <Text className="text-base font-medium text-gray-600 mb-2 ml-1">Password</Text>
          <View className="flex-row items-center justify-between border border-gray-300 rounded-xl">
            <TextInput
              className="flex-1 p-4 text-base"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
              placeholderTextColor="#9ca3af"
            />
            <Pressable
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              className="p-3"
            >
              <EyeIcon hidden={!isPasswordVisible} />
            </Pressable>
          </View>
        </View>

        {/* Signup Redirect */}
        <View className="w-full flex-row items-center justify-center mb-8">
          <Text className="text-gray-600 text-base">Don't have an account? </Text>
          <Pressable onPress={async () => {
            // Clear any stored step1Data when coming from login page
            await storage.removeItem("step1Data");
            router.push("/doctor/signup");
          }}>
            <Text className="text-sky-600 font-semibold text-base">Register</Text>
          </Pressable>
        </View>

        {/* Login Button */}
        <Pressable
          onPress={handleLogin}
          disabled={loading}
          className="w-full bg-sky-600 rounded-xl p-4 active:bg-sky-700 shadow"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">Login</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

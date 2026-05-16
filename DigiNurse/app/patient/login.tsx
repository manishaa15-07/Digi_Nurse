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
import { Ionicons } from "@expo/vector-icons";
import "../../global.css";

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

export default function PatientLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log("[PatientLogin] Button pressed");
    console.log("[PatientLogin] Input:", {
      email,
      passwordLen: password?.length ?? 0,
    });

    if (!email || !password) {
      console.warn("[PatientLogin] Validation failed: missing email/password");
      Alert.alert("Login", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const url = `${API_BASE_URL}/api/patient/login`;
      console.log("[PatientLogin] Sending request:", { url, method: "POST" });

      const response = await axios.post(
        url,
        {
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log("[PatientLogin] Response status:", response.status);
      console.log(
        "[PatientLogin] Response keys:",
        Object.keys(response.data || {})
      );

      const responseData = response.data as {
        token?: string;
        fullName?: string;
        patientID?: string;
      };
      const { token, fullName, patientID } = responseData;

      console.log(
        "[PatientLogin] Saving token and patientID via storage helper..."
      );
      await storage.setItem("patientToken", token!);
      await storage.setItem("patientID", patientID!);

      console.log(`Login successful for ${fullName}, redirecting...`);
      Alert.alert("Welcome", `Hello ${fullName}`);
      router.replace("/(tabs)");
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      console.error("[PatientLogin] Error status:", status);
      console.error("[PatientLogin] Error data:", data);
      console.error("[PatientLogin] Error message:", error?.message);

      Alert.alert(
        "Login Failed",
        `${status || ""} ${data?.message || error.message || "Unknown error"}`.trim()
      );
    } finally {
      console.log("[PatientLogin] Attempt finished");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View
        className={`flex-1 justify-center items-center p-6 ${Platform.OS === "web" ? "max-w-md mx-auto" : ""
          }`}
      >
        <View className="w-12 h-12 bg-[#0077B6] rounded-full items-center justify-center mr-4">
          <Ionicons name="person" size={24} color="white" />
        </View>

        <Text className="text-2xl font-bold text-gray-800 mt-4 mb-10">
          Patient Login
        </Text>

        <View className="w-full mb-4">
          <Text className="text-small font-bold text-gray-600 mb-2 ml-1">
            Email
          </Text>
          <TextInput
            className="border bg-[#EBF9FC] border-[#0077B6] w-[200px] rounded-md p-2 text-base"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View className="w-[200px] mb-5">
          <Text className="text-small font-bold text-gray-600 mb-2 ml-1">
            Password
          </Text>
          <View className="flex-row bg-[#EBF9FC] border border-[#0077B6] p-2 rounded-md">
            <TextInput
              className="w-[150px] rounded-md text-base"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
              placeholderTextColor="#9ca3af"
            />
            <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
              <EyeIcon hidden={!isPasswordVisible} />
            </Pressable>
          </View>
        </View>

        <View className="w-full flex-row items-center justify-center mb-8">
          <Text className="text-gray-600 text-xs">Don't have an account? </Text>
          <Pressable onPress={() => router.push("/patient/signup")}>
            <Text className="text-[#0077B6] font-semibold text-xs">
              Register
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          className="w-[120px] bg-[#0077B6] rounded-md py-2 active:bg-sky-700 shadow"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              Login
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

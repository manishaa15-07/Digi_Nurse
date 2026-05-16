import axios from "axios";
import { Picker } from "@react-native-picker/picker";
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
    <View style={{ width: 24, height: 24, justifyContent: "center", alignItems: "center" }}>
        <View style={{ width: 20, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: color }} />
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, position: "absolute" }} />
        {hidden && (
            <View
                style={{ width: 1.5, height: 22, backgroundColor: color, position: "absolute", transform: [{ rotate: "-45deg" }] }}
            />
        )}
    </View>
);

export default function LoginScreen() {
    const router = useRouter();
    const [role, setRole] = useState<"caretaker" | "doctor">("caretaker");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    // Define the response type
    interface LoginResponse {
        token: string;
        fullName: string;
        caretakerId?: string;
        doctorId?: string;
    }

    // ------------------- Handle Login -------------------
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter email and password");
            return;
        }

        try {
            setLoading(true);
            const url = `${API_BASE_URL}/api/${role}/login`;

            // Type the response data
            const response = await axios.post<LoginResponse>(url, { email, password }, {
                headers: { "Content-Type": "application/json" },
                timeout: 10000,
            });

            const { token, fullName, caretakerId, doctorId } = response.data;

            if (!token) throw new Error("Invalid response: token missing");

            // Save session based on role
            if (role === "caretaker") {
                await storage.setItem("caretakerToken", token);
                await storage.setItem("caretakerID", caretakerId!);
                router.replace("/(caretaker-tabs)");
            } else {
                await storage.setItem("doctorToken", token);
                await storage.setItem("doctorID", doctorId!);
                router.replace("/doctor/dashboard");
            }

            Alert.alert("Welcome", `Hello ${fullName}!`);
        } catch (error: any) {
            const status = error?.response?.status;
            const msg = error?.response?.data?.message || error.message;
            let errorMessage = "Login failed. Please try again.";

            if (error.code === "ECONNABORTED") {
                errorMessage = "Connection timeout. Check your internet.";
            } else if (!error.response) {
                errorMessage = "Network error. Check your connection.";
            } else if (status === 400 || status === 401) {
                errorMessage = msg || "Invalid email or password.";
            } else if (status === 500) {
                errorMessage = "Server error. Try again later.";
            }

            Alert.alert("Login Failed", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className={`flex-1 justify-center items-center p-6 ${Platform.OS === "web" ? "max-w-md mx-auto" : ""}`}>
                <Image
                    source={require("../../assets/images/caretaker.png")}
                    className="w-20 h-20 mb-2"
                    resizeMode="contain"
                />

                <Text className="text-3xl font-bold text-gray-800 mt-4 mb-6">Login</Text>

                {/* Role Picker */}
                <View className="w-full mb-4">
                    <Text className="text-base font-medium text-gray-600 mb-2 ml-1">Role</Text>
                    <View className="border border-gray-300 rounded-xl">
                        <Picker
                            selectedValue={role}
                            onValueChange={(val) => setRole(val)}
                            style={{ height: 50, width: "100%" }}
                        >
                            <Picker.Item label="Caretaker" value="caretaker" />
                            <Picker.Item label="Doctor" value="doctor" />
                        </Picker>
                    </View>
                </View>

                {/* Email */}
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

                {/* Password */}
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
                        <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)} className="p-3">
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
                        router.push(`/${role}/signup`);
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
                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-center font-bold text-lg">Login</Text>}
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

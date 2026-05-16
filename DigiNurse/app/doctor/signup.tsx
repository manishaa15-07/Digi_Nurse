// app/doctor/Signup.tsx
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { storage } from "../../config/storage";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { API_BASE_URL } from "../../config/api";
import "../../global.css";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20, paddingBottom: Platform.OS === "web" ? 40 : 80 },
  headerIcon: { width: 64, height: 64, alignSelf: "center", marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center", color: "#1f2937" },
  stepTitle: { fontSize: 16, textAlign: "center", color: "#6b7280", marginTop: 8, marginBottom: 12 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.03, elevation: 1 },
  fieldLabel: { fontSize: 14, color: "#374151", marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, padding: 12, fontSize: 15, color: "#111827", backgroundColor: "#fff" },
  row: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  navRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, alignItems: "center" },
  primaryButton: { backgroundColor: "#0ea5e9", paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, width: "45%", alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  secondaryButton: { backgroundColor: "#f1f5f9", paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, width: "45%", alignItems: "center" },
  secondaryButtonText: { color: "#0f172a", fontWeight: "700" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" },
  finalIcon: { width: 120, height: 120, marginBottom: 18 },
  finalTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  finalSubtitle: { fontSize: 16, color: "#475569", textAlign: "center", marginBottom: 12 },
  finalId: { fontWeight: "800", color: "#0f172a" },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 20, width: "100%", maxWidth: 300 },
  dashboardButton: { backgroundColor: "#10b981", paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, flex: 1, alignItems: "center" },
  homeButton: { backgroundColor: "#f1f5f9", paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, flex: 1, alignItems: "center" },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  checkboxBox: { width: 22, height: 22, borderWidth: 1.5, borderColor: "#9ca3af", borderRadius: 6, marginRight: 10, justifyContent: "center", alignItems: "center" },
  checkboxBoxChecked: { backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" },
  checkboxTick: { color: "#fff", fontWeight: "700" },
  checkboxLabel: { color: "#374151", flex: 1 },
});

// ----------------- Checkbox -----------------
const Checkbox = ({ label, checked, onCheck }: { label: string; checked: boolean; onCheck: () => void }) => (
  <Pressable onPress={onCheck} style={styles.checkboxRow}>
    <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>{checked && <Text style={styles.checkboxTick}>✓</Text>}</View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </Pressable>
);

export default function DoctorSignup() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [registrationComplete, setRegistrationComplete] = useState<boolean>(false);
  const [doctorId, setDoctorId] = useState<string>(""); 

  // Step 1
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [contact, setContact] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // Step 2
  const [specialization, setSpecialization] = useState<string>("");
  const [hospitalName, setHospitalName] = useState<string>("");
  const [hospitalId, setHospitalId] = useState<string>("");
  const [licenseNumber, setLicenseNumber] = useState<string>("");
  const [experienceYears, setExperienceYears] = useState<string>("");

  // Step 3
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
  const [agreeToEthics, setAgreeToEthics] = useState<boolean>(false);

  // Auto-fill Step 1 and skip it if data exists
  useEffect(() => {
    const loadStep1Data = async () => {
      const step1Data = await storage.getItem("step1Data");
      if (step1Data) {
        const data = JSON.parse(step1Data);
        setFullName(data.fullName || "");
        setEmail(data.email || "");
        setContact(data.contact || "");
        setPassword(data.password || "");
        setConfirmPassword(data.password || "");

        // Only skip to step 2 if we have complete data AND we're coming from caretaker signup
        // If coming from login page, start from step 1
        const isFromCaretakerSignup = data.fromCaretakerSignup === true;
        if (data.fullName && data.email && data.contact && data.password && isFromCaretakerSignup) {
          setStep(2); // Skip Step 1 only if coming from caretaker signup
        } else {
          // Clear the stored data if coming from login page
          await storage.removeItem("step1Data");
        }
      }
    };
    loadStep1Data();
  }, []);

  const validateStep1 = () => {
    console.log('[DoctorSignup] Validating Step 1:', { fullName, email, contact, password: password ? '***' : '', confirmPassword: confirmPassword ? '***' : '' });
    
    if (!fullName?.trim()) {
      Alert.alert("Validation Error", "Full Name is required");
      return false;
    }
    if (!email?.trim()) {
      Alert.alert("Validation Error", "Email is required");
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }
    if (!contact?.trim()) {
      Alert.alert("Validation Error", "Contact number is required");
      return false;
    }
    if (!password?.trim()) {
      Alert.alert("Validation Error", "Password is required");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters");
      return false;
    }
    if (!confirmPassword?.trim()) {
      Alert.alert("Validation Error", "Please confirm your password");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return false;
    }
    console.log('[DoctorSignup] Step 1 validation passed');
    return true;
  };

  const validateStep2 = () => {
    console.log('[DoctorSignup] Validating Step 2:', { specialization, hospitalName, hospitalId, licenseNumber, experienceYears });
    
    if (!specialization?.trim()) {
      Alert.alert("Validation Error", "Please select a specialization");
      return false;
    }
    if (!hospitalName?.trim()) {
      Alert.alert("Validation Error", "Hospital Name is required");
      return false;
    }
    if (!hospitalId?.trim()) {
      Alert.alert("Validation Error", "Hospital ID is required");
      return false;
    }
    if (!licenseNumber?.trim()) {
      Alert.alert("Validation Error", "License Number is required");
      return false;
    }
    if (!experienceYears?.trim()) {
      Alert.alert("Validation Error", "Years of Experience is required");
      return false;
    }
    const expYears = Number(experienceYears);
    if (isNaN(expYears) || expYears < 0 || expYears > 50) {
      Alert.alert("Validation Error", "Please enter a valid number of years (0-50)");
      return false;
    }
    console.log('[DoctorSignup] Step 2 validation passed');
    return true;
  };

  const handleNext = () => {
    console.log('[DoctorSignup] handleNext called, step:', step);
    if (step === 1) {
      console.log('[DoctorSignup] Validating step 1...');
      if (!validateStep1()) {
        console.log('[DoctorSignup] Step 1 validation failed');
        return;
      }
      console.log('[DoctorSignup] Step 1 validation passed, moving to step 2');
    }
    if (step === 2) {
      console.log('[DoctorSignup] Validating step 2...');
      if (!validateStep2()) {
        console.log('[DoctorSignup] Step 2 validation failed');
        return;
      }
      console.log('[DoctorSignup] Step 2 validation passed, moving to step 3');
    }
    setStep(step + 1);
  };

  const handleBack = () => (step > 1 ? setStep(step - 1) : router.back());

  interface DoctorSignupResponse {
    message: string;
    doctorId: string;
    fullName: string;
    email: string;
    token: string;
  }

  const handleSubmit = async () => {
    if (!agreeToTerms || !agreeToEthics) {
      Alert.alert("Consent Required", "Please agree to Terms and Ethics.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post<DoctorSignupResponse>(`${API_BASE_URL}/api/doctor/signup`, {
        fullName,
        email,
        contact,
        password,
        specialization,
        hospitalName,
        hospitalId,
        licenseNumber,
        experienceYears: Number(experienceYears),
        agreeToTerms,
        agreeToEthics,
      });

      if (res.data?.doctorId && res.data?.token) {
        setDoctorId(res.data.doctorId);
        await storage.setItem("doctorId", res.data.doctorId);
        await storage.setItem("doctorFullName", fullName);
        await storage.setItem("doctorToken", res.data.token);
        setRegistrationComplete(true);
      }
    } catch (err: any) {
      Alert.alert("Signup Failed", err.response?.data?.message || err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (registrationComplete) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Image source={require("../../assets/images/caretaker.png")} style={styles.finalIcon} resizeMode="contain" />
        <Text style={styles.finalTitle}>Registration Completed!</Text>
        <Text style={styles.finalSubtitle}>
          Your Doctor ID: <Text style={styles.finalId}>{doctorId}</Text>
        </Text>
        <Text style={styles.finalSubtitle}>Welcome, {fullName}! You are now logged in.</Text>
        <View style={styles.buttonRow}>
          <Pressable style={styles.homeButton} onPress={() => router.replace("/")}>
            <Text style={styles.secondaryButtonText}>Go to Home</Text>
          </Pressable>
          <Pressable style={styles.dashboardButton} onPress={() => router.replace("/doctor/dashboard")}>
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require("../../assets/images/caretaker.png")} style={styles.headerIcon} resizeMode="contain" />
        <Text style={styles.title}>Doctor Registration</Text>
        <Text style={styles.stepTitle}>Step {step} of 3</Text>

        {/* Step 1 */}
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full Name" />
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
            <Text style={styles.fieldLabel}>Contact</Text>
            <TextInput style={styles.input} value={contact} onChangeText={setContact} placeholder="Contact Number" keyboardType="phone-pad" />
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm Password" secureTextEntry />
          </View>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Specialization</Text>
            <View style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
              <Picker selectedValue={specialization} onValueChange={setSpecialization} style={{ height: 50 }}>
                <Picker.Item label="Select Specialization" value="" />
                {["Cardiology","Neurology","Oncology","Orthopedics","General Medicine","Endocrinology","Pediatrics","Psychiatry","Dermatology","Other"].map((s) => (
                  <Picker.Item key={s} label={s} value={s} />
                ))}
              </Picker>
            </View>
            <Text style={styles.fieldLabel}>Hospital Name</Text>
            <TextInput style={styles.input} value={hospitalName} onChangeText={setHospitalName} placeholder="Hospital Name" />
            <Text style={styles.fieldLabel}>Hospital ID</Text>
            <TextInput style={styles.input} value={hospitalId} onChangeText={setHospitalId} placeholder="Hospital ID" />
            <Text style={styles.fieldLabel}>License Number</Text>
            <TextInput style={styles.input} value={licenseNumber} onChangeText={setLicenseNumber} placeholder="License Number" />
            <Text style={styles.fieldLabel}>Years of Experience</Text>
            <TextInput style={styles.input} value={experienceYears} onChangeText={setExperienceYears} placeholder="Years of Experience" keyboardType="numeric" />
          </View>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <View style={styles.card}>
            <Checkbox label="I agree to Terms of Service & Privacy Policy" checked={agreeToTerms} onCheck={() => setAgreeToTerms(!agreeToTerms)} />
            <Checkbox label="I agree to uphold Ethics & Confidentiality" checked={agreeToEthics} onCheck={() => setAgreeToEthics(!agreeToEthics)} />
          </View>
        )}

        <View style={styles.navRow}>
          <Pressable style={styles.secondaryButton} onPress={handleBack} disabled={loading}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
          <Pressable 
            style={[styles.primaryButton, loading && { opacity: 0.6 }]} 
            onPress={() => {
              console.log('[DoctorSignup] Button pressed, step:', step, 'loading:', loading);
              if (step === 3) {
                handleSubmit();
              } else {
                handleNext();
              }
            }} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{step === 3 ? "Submit" : "Next"}</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

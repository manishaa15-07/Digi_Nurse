// app/patient/Signup.tsx
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { storage } from "../../config/storage";
import { Ionicons } from "@expo/vector-icons";

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

/* ----------------------- Styles ----------------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  container: { padding: 20, paddingBottom: Platform.OS === "web" ? 40 : 80 },
  headerIcon: { width: 64, height: 64, alignSelf: "center", marginBottom: 12 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#1f2937",
  },
  stepTitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#6b7280",
    marginTop: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    elevation: 1,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#0077B6",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#EBF9FC",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginRight: 4,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    marginRight: 4,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: "#0077B6",
    borderRadius: 6,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxBoxChecked: { backgroundColor: "#0077B6" },
  checkboxTick: { color: "#fff", fontWeight: "700" },
  checkboxLabel: { color: "#374151", flex: 1 },
  tagContainer: { marginTop: 6 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#90CFEF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { color: "#000", fontWeight: "600" },
  tagRemove: { color: "#000", marginLeft: 4, fontWeight: "700" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  paragraph: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    width: "45%",
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    width: "45%",
    alignItems: "center",
  },
  secondaryButtonText: { color: "#0f172a", fontWeight: "700" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  finalIcon: { width: 120, height: 120, marginBottom: 18 },
  finalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  finalSubtitle: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    marginBottom: 12,
  },
  finalId: { fontWeight: "800", color: "#0f172a" },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    width: "100%",
    maxWidth: 300,
  },
  dashboardButton: {
    backgroundColor: "#10b981",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  homeButton: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
});

/* ----------------------- Small UI Components ----------------------- */
const RadioButton = ({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) => (
  <Pressable onPress={onSelect} style={styles.row}>
    <View style={[styles.checkboxBox, selected && styles.checkboxBoxChecked]}>
      {selected && <Text style={styles.checkboxTick}>✓</Text>}
    </View>
    <Text>{label}</Text>
  </Pressable>
);

const Checkbox = ({
  label,
  checked,
  onCheck,
}: {
  label: string;
  checked: boolean;
  onCheck: () => void;
}) => (
  <Pressable onPress={onCheck} style={styles.checkboxRow}>
    <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
      {checked && <Text style={styles.checkboxTick}>✓</Text>}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </Pressable>
);

/* ----------------------- Tag Input ----------------------- */
const TagInput = ({
  label,
  placeholder,
  tags,
  onTagsChange,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onTagsChange: (next: string[]) => void;
}) => {
  const [text, setText] = useState<string>("");

  const handleAddTag = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase() === "none") {
      onTagsChange(["None"]);
      setText("");
      return;
    }

    if (tags.includes("None")) {
      Alert.alert("Not Allowed", "Remove 'None' before adding more items.");
      setText("");
      return;
    }

    if (!tags.includes(trimmed)) onTagsChange([...tags, trimmed]);
    setText("");
  };

  const handleRemoveTag = (tagToRemove: string) =>
    onTagsChange(tags.filter((t) => t !== tagToRemove));

  return (
    <View style={styles.tagContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleAddTag}
        style={styles.input}
        placeholderTextColor="#9ca3af"
      />
      <View style={styles.tagRow}>
        {tags.map((tag, i) => (
          <Pressable
            key={i}
            onPress={() => handleRemoveTag(tag)}
            style={styles.tagPill}
          >
            <Text style={styles.tagText}>{tag}</Text>
            <Text style={styles.tagRemove}> ×</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

/* ----------------------- Main Component ----------------------- */
export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [registrationComplete, setRegistrationComplete] =
    useState<boolean>(false);
  const [patientID, setPatientID] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");

  // Step 1
  const [dob, setDob] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [contact, setContact] = useState<string>("");
  const [emergencyContact, setEmergencyContact] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // Step 2
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [smoking, setSmoking] = useState<"Yes" | "No" | null>(null);
  const [drinking, setDrinking] = useState<
    "None" | "Rarely" | "Regularly" | null
  >(null);
  const [activity, setActivity] = useState<
    "Rarely" | "Weekly" | "Daily" | null
  >(null);

  // Step 3
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
  const [consentToShare, setConsentToShare] = useState<boolean>(false);

  // Add missing navigation functions
  const handleGoToDashboard = () => {
    console.log("[Signup] Navigating to dashboard...");
    router.replace("/(tabs)");
  };

  const handleGoToHome = () => {
    console.log("[Signup] Navigating to home...");
    router.replace("/(tabs)");
  };

  /* ----------------------- Validation ----------------------- */
  const validateStep1 = (): boolean => {
    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!fullName.trim() || !nameRegex.test(fullName)) {
      Alert.alert("Validation", "Enter a valid full name (letters only).");
      return false;
    }
    if (!dobRegex.test(dob)) {
      Alert.alert("Validation", "Enter a valid date (YYYY-MM-DD).");
      return false;
    }
    if (!["Male", "Female", "Other"].includes(gender)) {
      Alert.alert("Validation", "Please select Male, Female, or Other.");
      return false;
    }
    if (!phoneRegex.test(contact)) {
      Alert.alert("Validation", "Enter a valid 10-digit contact number.");
      return false;
    }
    if (!phoneRegex.test(emergencyContact)) {
      Alert.alert("Validation", "Enter a valid 10-digit emergency contact.");
      return false;
    }
    if (!emailRegex.test(email)) {
      Alert.alert("Validation", "Enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match.");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!smoking || !drinking || !activity) {
      Alert.alert("Validation", "Please answer all lifestyle questions.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
    } else {
      handleSubmit();
    }
  };

  /* ----------------------- Submit with Auto-Login ----------------------- */
  interface SignupResponse {
    patientID: string;
    token: string;
  }

  // Add submission lock to prevent multiple requests
  const isSubmittingRef = React.useRef(false);

  const handleSubmit = async () => {
    if (!agreeToTerms) {
      Alert.alert(
        "Consent Required",
        "You must agree to the Terms of Service."
      );
      return;
    }

    console.log("[Signup] handleSubmit called - Loading state:", loading);

    // Prevent multiple submissions with ref
    if (loading || isSubmittingRef.current) {
      console.log(
        "[Signup] Already loading or submitting, ignoring duplicate call"
      );
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      console.log("[Signup] Starting registration process...");
      console.log("[Signup] API_BASE_URL:", API_BASE_URL);

      const requestPayload = {
        fullName,
        dob,
        gender,
        contact,
        emergencyContact,
        email,
        password: "***", // Don't log actual password
        allergies,
        conditions,
        medications,
        smoking,
        drinking,
        activity,
        consentToShare,
      };

      console.log(
        "[Signup] Request payload:",
        JSON.stringify(requestPayload, null, 2)
      );
      console.log(
        "[Signup] Sending registration request to:",
        `${API_BASE_URL}/api/patient/signup`
      );

      const startTime = Date.now();

      const response = await axios.post<SignupResponse>(
        `${API_BASE_URL}/api/patient/signup`,
        {
          fullName,
          dob,
          gender,
          contact,
          emergencyContact,
          email,
          password,
          allergies,
          conditions,
          medications,
          smoking,
          drinking,
          activity,
          consentToShare,
        },
        {
          headers: {
            Authorization: undefined,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const endTime = Date.now();
      console.log(`[Signup] Request completed in ${endTime - startTime}ms`);
      console.log("[Signup] Response status:", response.status);
      console.log("[Signup] Response data:", response.data);

      if (response.data.token && response.data.patientID) {
        const { patientID, token } = response.data;

        console.log("[Signup] Storing authentication data...");

        // Store token and patient data for auto-login
        await storage.setItem("patientToken", token);
        await storage.setItem("patientID", patientID);
        await storage.setItem("patientEmail", email);
        await storage.setItem("patientFullName", fullName);

        console.log("[Signup] Storage completed");

        setPatientID(patientID);
        setRegistrationComplete(true);

        console.log(
          "[Signup] Auto-login data stored successfully - State updated"
        );
      } else {
        throw new Error("Invalid response: missing token or patientID");
      }
    } catch (error: any) {
      console.error("[Signup] Error details:", {
        name: error.name,
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });

      // Handle specific error types
      if (error.code === "ECONNABORTED") {
        Alert.alert(
          "Connection Timeout",
          "The request took too long. Please try again."
        );
      } else if (error.response?.data?.message) {
        Alert.alert("Signup Failed", error.response.data.message);
      } else if (error.message) {
        Alert.alert("Signup Failed", error.message);
      } else {
        Alert.alert("Signup Failed", "An unexpected error occurred");
      }
    } finally {
      console.log("[Signup] Finalizing - setting loading to false");
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  /* ----------------------- UI ----------------------- */
  if (registrationComplete) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Image
          source={require("../../assets/images/patient.png")}
          style={styles.finalIcon}
          resizeMode="contain"
        />
        <Text style={styles.finalTitle}>Registration Completed!</Text>
        <Text style={styles.finalSubtitle}>
          Your Patient ID: <Text style={styles.finalId}>{patientID}</Text>
        </Text>
        <Text style={styles.finalSubtitle}>
          Welcome, {fullName}! You have been automatically logged in.
        </Text>

        <View style={styles.buttonRow}>
          <Pressable style={styles.homeButton} onPress={handleGoToHome}>
            <Text style={styles.secondaryButtonText}>Go to Home</Text>
          </Pressable>
          <Pressable
            style={styles.dashboardButton}
            onPress={handleGoToDashboard}
          >
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View className="items-center">
          <View className="w-12 h-12 bg-[#0077B6] rounded-full items-center justify-center mr-4">
            <Ionicons name="person" size={24} color="white" />
          </View>

          <Text className="text-xl font-bold text-gray-800 mt-4 mb-10">
            Patient Registration
          </Text>

          <Text style={styles.stepTitle}>{`Step ${step} of 3`}</Text>
        </View>
        {/* Step 1 */}
        {step === 1 && (
          <View style={styles.card}>
            <Text className="text-l text-center font-bold text-gray-800 mt-2 mb-2">
              Personal & Account Information
            </Text>
            <View className="w-full flex-row justify-center mb-4">
              <View className="w-[0px] h-[5px] bg-[#0077B6]"></View>
              <View className="w-[210px] h-[5px] bg-[#D9D9D9]"></View>
            </View>
            <Text className="text-small font-bold text-gray-600 mb-2 ml-1">
              Full Name
            </Text>
            <TextInput
              className="border bg-[#EBF9FC] border-[#0077B6] rounded-md mb-4 p-2 text-base"
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
            />
            <Text className="text-small font-bold text-gray-600 mb-2 ml-1">
              Date of Birth (YYYY-MM-DD)
            </Text>
            <TextInput
              className="border bg-[#EBF9FC] border-[#0077B6] rounded-md mb-4 p-2 text-base"
              value={dob}
              onChangeText={setDob}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />
            <Text className="text-small font-bold text-gray-600 mb-2 ml-1">
              Gender
            </Text>
            <View className="border bg-[#EBF9FC] border-[#0077B6] rounded-md mb-4 p-2 text-base">
              <Picker
                selectedValue={gender}
                onValueChange={setGender}
                className="h-50 bg-[#EBF9FC]"
              >
                <Picker.Item label="Select Gender" value="" />
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>

            <Text className="text-small font-bold text-gray-600 mb-2 ml-1">
              Contact Number
            </Text>
            <TextInput
              className="border bg-[#EBF9FC] border-[#0077B6] rounded-md mb-4 p-2 text-base"
              value={contact}
              onChangeText={setContact}
              placeholder="10-digit number"
              keyboardType="phone-pad"
              maxLength={10}
            />
            <Text className="text-small font-bold text-gray-600 mb-2 ml-1">
              Emergency Contact
            </Text>
            <TextInput
              className="border bg-[#EBF9FC] border-[#0077B6] rounded-md mb-4 p-2 text-base"
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              placeholder="10-digit number"
              keyboardType="phone-pad"
              maxLength={10}
            />
            <Text className="text-small font-bold text-gray-600 mb-2 ml-1">
              Email
            </Text>
            <TextInput
              className="border bg-[#EBF9FC] border-[#0077B6] rounded-md mb-4 p-2 text-base"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text className="text-small font-bold text-gray-600 mb-2 ml-1">
              Password
            </Text>
            <View className="flex-row bg-[#EBF9FC] border border-[#0077B6] mb-4 p-2 rounded-md">
              <TextInput
                className="w-[250px] rounded-md text-base"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                placeholderTextColor="#9ca3af"
              />
              <Pressable
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <EyeIcon hidden={!isPasswordVisible} />
              </Pressable>
            </View>
            <Text className="text-small font-bold text-gray-600 mb-2 ml-1">
              Confirm Password
            </Text>
            <View className="flex-row bg-[#EBF9FC] border border-[#0077B6] mb-4 p-2 rounded-md">
              <TextInput
                className="w-[250px] rounded-md text-base"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!isPasswordVisible}
                placeholderTextColor="#9ca3af"
              />
              <Pressable
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <EyeIcon hidden={!isPasswordVisible} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <View style={styles.card}>
            <Text className="text-l text-center font-bold text-gray-800 mt-2 mb-2">
              Medical History
            </Text>
            <View className="w-full flex-row justify-center mb-4">
              <View className="w-[70px] h-[5px] bg-[#0077B6]"></View>
              <View className="w-[140px] h-[5px] bg-[#D9D9D9]"></View>
            </View>
            <TagInput
              label="Allergies"
              placeholder="Add allergy or 'None'"
              tags={allergies}
              onTagsChange={setAllergies}
            />
            <TagInput
              label="Medical Conditions"
              placeholder="Add condition or 'None'"
              tags={conditions}
              onTagsChange={setConditions}
            />
            <TagInput
              label="Current Medications"
              placeholder="Add medication or 'None'"
              tags={medications}
              onTagsChange={setMedications}
            />

            <Text style={styles.fieldLabel}>Smoking</Text>
            <View style={styles.rowWrap}>
              {["Yes", "No"].map((opt) => (
                <RadioButton
                  key={opt}
                  label={opt}
                  selected={smoking === opt}
                  onSelect={() => setSmoking(opt as "Yes" | "No")}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Alcohol Consumption</Text>
            <View style={styles.rowWrap}>
              {["None", "Rarely", "Regularly"].map((opt) => (
                <RadioButton
                  key={opt}
                  label={opt}
                  selected={drinking === opt}
                  onSelect={() =>
                    setDrinking(opt as "None" | "Rarely" | "Regularly")
                  }
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Physical Activity</Text>
            <View style={styles.rowWrap}>
              {["Rarely", "Weekly", "Daily"].map((opt) => (
                <RadioButton
                  key={opt}
                  label={opt}
                  selected={activity === opt}
                  onSelect={() =>
                    setActivity(opt as "Rarely" | "Weekly" | "Daily")
                  }
                />
              ))}
            </View>
          </View>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <View style={styles.card}>
            <Text className="text-l text-center font-bold text-gray-800 mt-2 mb-2">
              Caretaker Connection & Consent
            </Text>
            <View className="w-full flex-row justify-center mb-4">
              <View className="w-[140px] h-[5px] bg-[#0077B6]"></View>
              <View className="w-[70px] h-[5px] bg-[#D9D9D9]"></View>
            </View>
            <Text style={styles.sectionTitle}>
              Consent to Treatment & Data Use
            </Text>
            <ScrollView style={{ maxHeight: 250, marginBottom: 12 }}>
              <Text style={styles.paragraph}>
                By registering for DigiNurse, you consent to secure storage and
                use of your health information for personalized care and
                insights.
              </Text>
              <Text style={styles.paragraph}>
                Your data may be shared with your linked caregivers if you give
                explicit consent below.
              </Text>
            </ScrollView>

            <Checkbox
              label="I agree to the Terms of Service & Privacy Policy."
              checked={agreeToTerms}
              onCheck={() => setAgreeToTerms(!agreeToTerms)}
            />
            <Checkbox
              label="I consent to share my health data with my linked caregivers."
              checked={consentToShare}
              onCheck={() => setConsentToShare(!consentToShare)}
            />
          </View>
        )}

        {/* Navigation */}
        <View className="w-full flex-row justify-center">
          <Pressable
            className="w-[120px] bg-[#D9D9D9] rounded-md mx-4 py-2 active:bg-sky-700 shadow"
            onPress={() => setStep((s) => Math.max(1, s - 1))}
            disabled={loading}
          >
            <Text className="text-white text-center font-bold text-lg">
              Back
            </Text>
          </Pressable>
          <Pressable
            className="w-[120px] bg-[#0077B6] rounded-md mx-4 py-2 active:bg-sky-700 shadow"
            style={[loading && { opacity: 0.6 }]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center font-bold text-lg">
                {step === 3 ? "Submit" : "Next"}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

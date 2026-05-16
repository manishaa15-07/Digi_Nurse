// app/caretaker/Signup.tsx
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { JSX, useState } from "react";
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
import { storage } from "../../config/storage";
import "../../global.css";

/* ----------------------- Styles ----------------------- */
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#ffffff" },
    container: { padding: 20, paddingBottom: Platform.OS === "web" ? 40 : 80 },
    headerIcon: { width: 64, height: 64, alignSelf: "center", marginBottom: 12 },
    title: { fontSize: 28, fontWeight: "700", textAlign: "center", color: "#1f2937" },
    stepTitle: { fontSize: 16, textAlign: "center", color: "#6b7280", marginTop: 8, marginBottom: 12 },
    progressRow: { marginVertical: 12 },
    progressText: { color: "#6b7280", marginBottom: 6 },
    progressBarBg: { height: 8, backgroundColor: "#e5e7eb", borderRadius: 8, overflow: "hidden" },
    progressBarFill: { height: 8, backgroundColor: "#0ea5e9" },
    card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.03, elevation: 1 },
    fieldLabel: { fontSize: 14, color: "#374151", marginBottom: 6, marginTop: 10 },
    input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, padding: 12, fontSize: 15, color: "#111827", backgroundColor: "#fff" },
    row: { flexDirection: "row", alignItems: "center", marginTop: 6 },
    flex: { flex: 1 },
    iconButton: { padding: 10, marginLeft: 8 },
    checkboxRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
    checkboxBox: { width: 22, height: 22, borderWidth: 1.5, borderColor: "#9ca3af", borderRadius: 6, marginRight: 10, justifyContent: "center", alignItems: "center" },
    checkboxBoxChecked: { backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" },
    checkboxTick: { color: "#fff", fontWeight: "700" },
    checkboxLabel: { color: "#374151", flex: 1 },
    navRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, alignItems: "center" },
    primaryButton: { backgroundColor: "#0ea5e9", paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, width: "45%", alignItems: "center" },
    primaryButtonText: { color: "#fff", fontWeight: "700" },
    secondaryButton: { backgroundColor: "#f1f5f9", paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, width: "45%", alignItems: "center" },
    secondaryButtonText: { color: "#0f172a", fontWeight: "700" },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" },
    finalIcon: { width: 120, height: 120, marginBottom: 18 },
    finalTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
    finalSubtitle: { fontSize: 16, color: "#475569", textAlign: "center", marginBottom: 18 },
    finalId: { fontWeight: "800", color: "#0f172a" },
    buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, gap: 12 },
    homeButton: { backgroundColor: "#f1f5f9", paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, flex: 1, alignItems: "center" },
    dashboardButton: { backgroundColor: "#0ea5e9", paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, flex: 1, alignItems: "center" },
});

/* ----------------------- Small UI Components ----------------------- */
const EyeIcon = ({ isVisible = false, color = "#6b7280" }) => (
    <View style={{ width: 24, height: 24, justifyContent: "center", alignItems: "center" }}>
        <View style={{ width: 20, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: color }} />
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, position: "absolute" }} />
        {isVisible && <View style={{ width: 1.5, height: 22, backgroundColor: color, position: "absolute", transform: [{ rotate: "-45deg" }] }} />}
    </View>
);

const Checkbox = ({ label, checked, onCheck }: { label: string; checked: boolean; onCheck: () => void }) => (
    <Pressable onPress={onCheck} style={styles.checkboxRow}>
        <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
            {checked && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
);

/* ----------------------- Main Component ----------------------- */
export default function CaretakerSignup(): JSX.Element {
    const router = useRouter();
    const [step, setStep] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
    const [registrationComplete, setRegistrationComplete] = useState<boolean>(false);
    const [caretakerId, setCaretakerId] = useState<string>("");

    // Step 1 - Basic Info
    const [fullName, setFullName] = useState<string>("");
    const [professionalRole, setProfessionalRole] = useState<string>("");
    const [organization, setOrganization] = useState<string>("");
    const [orgId, setOrgId] = useState<string>("");
    const [contact, setContact] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState<boolean>(false);

    // Step 2 - Combined Consents
    const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
    const [agreeToEthics, setAgreeToEthics] = useState<boolean>(false);

    /* ----------------------- Validation ----------------------- */
    const validateStep1 = (): boolean => {
        console.log('[CaretakerSignup] Validating Step 1:', { 
            fullName: fullName ? fullName.substring(0, 10) + '...' : '', 
            professionalRole, 
            email, 
            contact, 
            password: password ? '***' : '', 
            confirmPassword: confirmPassword ? '***' : '' 
        });
        
        const nameRegex = /^[A-Za-z\s]+$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const contactRegex = /^\d{10}$/;
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;

        if (!fullName?.trim()) {
            Alert.alert("Validation Error", "Full Name is required.");
            return false;
        }
        if (!nameRegex.test(fullName.trim())) {
            Alert.alert("Invalid Name", "Name should contain only letters and spaces.");
            return false;
        }
        if (!professionalRole?.trim()) {
            Alert.alert("Role Required", "Please select your professional role.");
            return false;
        }
        if (!email?.trim()) {
            Alert.alert("Validation Error", "Email is required.");
            return false;
        }
        if (!emailRegex.test(email.trim())) {
            Alert.alert("Invalid Email", "Please enter a valid email address.");
            return false;
        }
        if (!contact?.trim()) {
            Alert.alert("Validation Error", "Contact number is required.");
            return false;
        }
        // More flexible contact validation - allow spaces, dashes, parentheses
        const cleanContact = contact.replace(/[\s\-\(\)]/g, '');
        if (!/^\d{10}$/.test(cleanContact)) {
            Alert.alert("Invalid Contact", "Contact number must be 10 digits (e.g., 1234567890).");
            return false;
        }
        if (!password?.trim()) {
            Alert.alert("Validation Error", "Password is required.");
            return false;
        }
        // More lenient password validation - just check length, allow any characters
        if (password.length < 6) {
            Alert.alert("Weak Password", "Password must be at least 6 characters.");
            return false;
        }
        if (!confirmPassword?.trim()) {
            Alert.alert("Validation Error", "Please confirm your password.");
            return false;
        }
        if (password !== confirmPassword) {
            Alert.alert("Password Mismatch", "Passwords do not match.");
            return false;
        }
        console.log('[CaretakerSignup] Step 1 validation passed');
        return true;
    };

    const validateStep2 = (): boolean => {
        if (!agreeToTerms || !agreeToEthics) {
            Alert.alert("Consent Required", "Please agree to all terms and policies.");
            return false;
        }
        return true;
    };

    /* ----------------------- Submit with Auto-Login ----------------------- */
    interface SignupResponse {
        caretakerId: string;
        token: string;
        fullName: string;
        email: string;
        message: string;
    }

    const handleSubmit = async () => {
        if (!validateStep2()) return;
        setLoading(true);
        try {
            const response = await axios.post<SignupResponse>(
                `${API_BASE_URL}/api/caretaker/signup`,
                {
                    fullName,
                    professionalRole,
                    organization,
                    orgId,
                    contact,
                    email,
                    password,
                    agreeToTerms,
                    agreeToEthics
                },
                { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
            );

            if (response.data.token && response.data.caretakerId) {
                const { caretakerId, token, fullName: responseFullName, email: responseEmail } = response.data;

                await storage.setItem("caretakerToken", token);
                await storage.setItem("caretakerID", caretakerId);
                await storage.setItem("caretakerEmail", responseEmail);
                await storage.setItem("caretakerFullName", responseFullName);

                setCaretakerId(caretakerId);
                setRegistrationComplete(true);
            } else {
                throw new Error("Invalid response: missing token or caretakerId");
            }
        } catch (error: any) {
            if (error.code === 'ECONNABORTED') {
                Alert.alert("Connection Timeout", "The request took too long. Please try again.");
            } else if (error.response?.data?.message) {
                Alert.alert("Signup Failed", error.response.data.message);
            } else if (error.message) {
                Alert.alert("Signup Failed", error.message);
            } else {
                Alert.alert("Signup Failed", "An unexpected error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    /* ----------------------- Step Navigation ----------------------- */
    const handleNext = async () => {
        console.log('[CaretakerSignup] handleNext called, step:', step);
        
        if (step === 1) {
            console.log('[CaretakerSignup] Validating step 1...');
            if (!validateStep1()) {
                console.log('[CaretakerSignup] Step 1 validation failed');
                return;
            }
            console.log('[CaretakerSignup] Step 1 validation passed');

            // Store Step 1 info for DoctorSignup
            await storage.setItem("step1Data", JSON.stringify({
                fullName,
                email,
                contact,
                organization,
                orgId,
                password,
                fromCaretakerSignup: true, // Mark that this is coming from caretaker signup
            }));

            if (professionalRole === "Doctor") {
                console.log('[CaretakerSignup] Redirecting to doctor signup');
                router.replace("/doctor/signup"); // navigate to doctor signup with Step1 prefill
                return;
            }

            console.log('[CaretakerSignup] Moving to step 2');
            setStep(2); // Caretaker role → step 2
            return;
        }

        if (step === 2) {
            console.log('[CaretakerSignup] Step 2 - calling handleSubmit');
            return handleSubmit();
        }
    };

    const handleBack = () => (step > 1 ? setStep(1) : router.back());

    const handleGoToDashboard = () => router.replace("/caretaker/dashboard");
    const handleGoToHome = () => router.replace("/");

    /* ----------------------- Final Page ----------------------- */
    if (registrationComplete) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Image source={require("../../assets/images/caretaker.png")} style={styles.finalIcon} resizeMode="contain" />
                <Text style={styles.finalTitle}>Registration Completed!</Text>
                <Text style={styles.finalSubtitle}>
                    Your Caretaker ID: <Text style={styles.finalId}>{caretakerId}</Text>
                </Text>
                <Text style={styles.finalSubtitle}>
                    Welcome, {fullName}! You have been automatically logged in.
                </Text>

                <View style={styles.buttonRow}>
                    <Pressable style={styles.homeButton} onPress={handleGoToHome}>
                        <Text style={styles.secondaryButtonText}>Go to Home</Text>
                    </Pressable>
                    <Pressable style={styles.dashboardButton} onPress={handleGoToDashboard}>
                        <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    /* ----------------------- Render ----------------------- */
    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Image source={require("../../assets/images/caretaker.png")} style={styles.headerIcon} resizeMode="contain" />
                <Text style={styles.title}>Caretaker Registration</Text>
                <Text style={styles.stepTitle}>
                    {step === 1 ? "Account Info" : "Consent & Professional Agreement"}
                </Text>

                <View style={styles.progressRow}>
                    <Text style={styles.progressText}>Step {step} of 2</Text>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${(step / 2) * 100}%` }]} />
                    </View>
                </View>

                {/* STEP 1 */}
                {step === 1 && (
                    <View style={styles.card}>
                        <Text style={styles.fieldLabel}>Full Name</Text>
                        <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />

                        <Text style={styles.fieldLabel}>Professional Role</Text>
                        <View style={[styles.input, { paddingHorizontal: 0 }]}>
                            <Picker
                                selectedValue={professionalRole}
                                onValueChange={setProfessionalRole}
                                style={{ height: 50, width: "100%" }}
                            >
                                <Picker.Item label="Select Role" value="" />
                                <Picker.Item label="Caretaker" value="Caretaker" />
                                <Picker.Item label="Doctor" value="Doctor" />
                            </Picker>
                        </View>

                        <Text style={styles.fieldLabel}>Organization</Text>
                        <TextInput style={styles.input} placeholder="Organization" value={organization} onChangeText={setOrganization} />
                        <Text style={styles.fieldLabel}>Organization ID</Text>
                        <TextInput style={styles.input} placeholder="Org ID" value={orgId} onChangeText={setOrgId} />
                        <Text style={styles.fieldLabel}>Contact</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="10-digit number (e.g., 1234567890)" 
                            value={contact} 
                            onChangeText={(text) => {
                                // Allow only digits, spaces, dashes, parentheses for display
                                const cleaned = text.replace(/[^\d\s\-\(\)]/g, '');
                                setContact(cleaned);
                            }} 
                            keyboardType="phone-pad" 
                            maxLength={14} // Allow for formatting
                        />
                        <Text style={styles.fieldLabel}>Email</Text>
                        <TextInput style={styles.input} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                        <Text style={styles.fieldLabel}>Password</Text>
                        <View style={styles.row}>
                            <TextInput style={[styles.input, styles.flex]} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!isPasswordVisible} />
                            <Pressable onPress={() => setIsPasswordVisible(v => !v)} style={styles.iconButton}><EyeIcon isVisible={!isPasswordVisible} /></Pressable>
                        </View>
                        <Text style={styles.fieldLabel}>Confirm Password</Text>
                        <View style={styles.row}>
                            <TextInput style={[styles.input, styles.flex]} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!isConfirmPasswordVisible} />
                            <Pressable onPress={() => setIsConfirmPasswordVisible(v => !v)} style={styles.iconButton}><EyeIcon isVisible={!isConfirmPasswordVisible} /></Pressable>
                        </View>
                    </View>
                )}

                {/* STEP 2 - Combined Consent */}
                {step === 2 && (
                    <View style={styles.card}>
                        <Text style={{ color: "#1e293b", fontSize: 15, lineHeight: 22, marginVertical: 12 }}>
                            By registering as a <Text style={{ fontWeight: "700" }}>DigiNurse Caretaker</Text>, you acknowledge and agree to the following terms regarding patient data access and confidentiality.
                        </Text>

                        <Checkbox
                            label="I agree to the Professional Terms of Service & Data Privacy Policy."
                            checked={agreeToTerms} onCheck={() => setAgreeToTerms(v => !v)}
                        />
                        <Checkbox
                            label="I understand and agree to uphold patient confidentiality and use DigiNurse data ethically."
                            checked={agreeToEthics} onCheck={() => setAgreeToEthics(v => !v)}
                        />
                    </View>
                )}

                {/* Navigation */}
                <View style={styles.navRow}>
                    <Pressable style={styles.secondaryButton} onPress={handleBack}>
                        <Text style={styles.secondaryButtonText}>Back</Text>
                    </Pressable>
                    <Pressable 
                        style={[styles.primaryButton, loading && { opacity: 0.6 }]} 
                        onPress={() => {
                            console.log('[CaretakerSignup] Next button pressed, step:', step, 'loading:', loading);
                            handleNext();
                        }} 
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : (
                            <Text style={styles.primaryButtonText}>
                                {step === 2 ? "Finish" : "Next"}
                            </Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

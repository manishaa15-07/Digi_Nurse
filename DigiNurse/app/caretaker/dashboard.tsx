import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { storage } from "../../config/storage";

interface Patient {
    _id: string;
    fullName: string;
    patientID: string;
    email: string;
    contact: string;
    dob: string;
    gender: string;
    conditions: string[];
    medications?: Array<{
        _id: string;
        name: string;
        missedCount?: number;
        takenCount?: number;
        isActive?: boolean;
    }>;
    dailyCheckins: Array<{
        date: string;
        energyLevel: number;
        pain: number;
        dietQuality: string;
        sleepQuality: string;
        notes: string;
        createdAt: string;
    }>;
}

interface CaretakerProfile {
    _id: string;
    fullName: string;
    email: string;
    contact: string;
    professionalRole: string;
    organization: string;
}

interface PatientsResponse {
    patients: Patient[];
    totalPatients: number;
    caretakerId: string;
    caretakerName: string;
}

interface RiskColors {
    HIGH: string;
    MODERATE: string;
    STABLE: string;
}

export default function Home() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [caretaker, setCaretaker] = useState<CaretakerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

    const riskColors: RiskColors = {
        HIGH: "#EF4444", // Red
        MODERATE: "#F59E0B", // Yellow/Orange
        STABLE: "#10B981", // Green
    };

    // Fetch caretaker profile and patients
    const fetchCaretakerData = async () => {
        try {
            const token = await storage.getItem('caretakerToken');
            if (!token) {
                console.log("No caretaker token found, redirecting to login");
                router.replace('/caretaker/login');
                return;
            }

            // Fetch caretaker profile
            const profileResponse = await axios.get<CaretakerProfile>(
                `${API_BASE_URL}/api/caretaker/profile`,
                { 
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000
                }
            );
            setCaretaker(profileResponse.data);

            // Fetch linked patients
            const patientsResponse = await axios.get<PatientsResponse>(
                `${API_BASE_URL}/api/caretaker/${profileResponse.data._id}/patients`,
                { 
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000
                }
            );
            setPatients(patientsResponse.data.patients || []);
            setFilteredPatients(patientsResponse.data.patients || []);

        } catch (error: any) {
            console.error('Error fetching caretaker data:', error);
            
            // Only redirect to login if it's an authentication error (401/403)
            if (error?.response?.status === 401 || error?.response?.status === 403) {
                console.log("Authentication error, redirecting to login");
                await storage.removeItem("caretakerToken");
                router.replace('/caretaker/login');
                return;
            }
            
            // For other errors (network, server errors), show alert but don't redirect
            Alert.alert("Connection Error", "Unable to load your dashboard. Please check your internet connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    // Get current date
    const getCurrentDate = () => {
        const today = new Date();
        const options: Intl.DateTimeFormatOptions = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        };
        return today.toLocaleDateString("en-US", options);
    };

    // Handle search functionality
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim() === "") {
            setFilteredPatients(patients);
        } else {
            const filtered = patients.filter(
                (patient) =>
                    patient.fullName.toLowerCase().includes(query.toLowerCase()) ||
                    patient.patientID.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredPatients(filtered);
        }
    };

    // Calculate risk level based on patient data
    const calculateRiskLevel = (patient: Patient): "HIGH" | "MODERATE" | "STABLE" => {
        // Check for critical symptoms in latest check-in notes
        const latestCheckin = patient.dailyCheckins && patient.dailyCheckins.length > 0
            ? patient.dailyCheckins[patient.dailyCheckins.length - 1]
            : null;

        // Check for critical conditions
        const hasCriticalCondition = patient.conditions?.some(condition =>
            condition.toLowerCase().includes('chest pain') ||
            condition.toLowerCase().includes('heart') ||
            condition.toLowerCase().includes('cardiac') ||
            condition.toLowerCase().includes('stroke')
        );

        // Check for high pain level
        const hasHighPain = latestCheckin && latestCheckin.pain >= 7;

        // Check for missed medications (recent missed doses)
        const totalMissedDoses = patient.medications?.reduce((sum, med) => 
            sum + (med.missedCount || 0), 0) || 0;
        const recentMissedDoses = totalMissedDoses; // Can be enhanced to check only today's missed doses

        // HIGH RISK: Critical symptoms, high pain, or multiple missed doses
        if (hasCriticalCondition || hasHighPain || recentMissedDoses >= 3) {
            return "HIGH";
        }

        // MODERATE RISK: Some missed doses, low energy, or poor check-in quality
        if (recentMissedDoses >= 1 || 
            (latestCheckin && (latestCheckin.energyLevel <= 4 ||
            latestCheckin.dietQuality === 'poor' ||
            latestCheckin.sleepQuality === 'poor'))) {
            return "MODERATE";
        }

        // STABLE: Everything else
        return "STABLE";
    };

    // Get last check-in time
    const getLastCheckIn = (patient: Patient): string => {
        if (!patient.dailyCheckins || patient.dailyCheckins.length === 0) {
            return "No recent check-ins";
        }

        const latestCheckin = patient.dailyCheckins[patient.dailyCheckins.length - 1];
        const checkinDate = new Date(latestCheckin.createdAt);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - checkinDate.getTime()) / (1000 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes} mins ago`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)} hours ago`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)} days ago`;
        }
    };

    // Get patient condition summary (matching image requirements)
    const getPatientCondition = (patient: Patient): string => {
        const latestCheckin = patient.dailyCheckins && patient.dailyCheckins.length > 0
            ? patient.dailyCheckins[patient.dailyCheckins.length - 1]
            : null;

        // Check for critical conditions first (like "Chest Pain")
        const criticalConditions = patient.conditions?.filter(condition =>
            condition.toLowerCase().includes('chest pain') ||
            condition.toLowerCase().includes('heart') ||
            condition.toLowerCase().includes('cardiac')
        );
        if (criticalConditions && criticalConditions.length > 0) {
            return criticalConditions[0]; // e.g., "Chest Pain"
        }

        // Check for missed medications
        const totalMissedDoses = patient.medications?.reduce((sum, med) => 
            sum + (med.missedCount || 0), 0) || 0;
        
        if (totalMissedDoses >= 3) {
            return `Missed ${totalMissedDoses} doses today`;
        } else if (totalMissedDoses === 1) {
            return "One dose missed";
        }

        // Check check-in notes for symptoms
        if (latestCheckin?.notes) {
            const notes = latestCheckin.notes.toLowerCase();
            if (notes.includes('fever') || notes.includes('high temperature')) {
                return "Has high fever";
            }
            if (notes.includes('cold') || notes.includes('cough')) {
                return "Has Cold";
            }
            if (notes.includes('not feeling') || notes.includes('unwell')) {
                return "Isn't feeling good today";
            }
        }

        // Check pain level
        if (latestCheckin && latestCheckin.pain >= 7) {
            return "High pain level";
        }

        // Check medication adherence
        const activeMedications = patient.medications?.filter(med => med.isActive !== false) || [];
        if (activeMedications.length > 0 && totalMissedDoses === 0) {
            return "Medication Adherent";
        }

        // Check for positive check-in
        if (latestCheckin?.notes) {
            const notes = latestCheckin.notes.toLowerCase();
            if (notes.includes('feeling good') || notes.includes('better') || notes.includes('fine')) {
                return "Feeling good";
            }
        }

        // Default based on conditions
        if (patient.conditions && patient.conditions.length > 0) {
            return patient.conditions[0];
        }

        return "Stable condition";
    };

    // Handle patient card press
    const handlePatientPress = (patient: Patient) => {
        const riskLevel = calculateRiskLevel(patient);
        const lastCheckIn = getLastCheckIn(patient);
        const condition = getPatientCondition(patient);

        Alert.alert(
            "Patient Details",
            `Name: ${patient.fullName}\nID: ${patient.patientID}\nRisk Level: ${riskLevel}\nCondition: ${condition}\nLast Check-in: ${lastCheckIn}\nEmail: ${patient.email}\nContact: ${patient.contact}`,
            [{ text: "OK" }]
        );
    };

    // Sort patients by risk level (HIGH -> MODERATE -> STABLE)
    const sortPatientsByRisk = (patients: Patient[]) => {
        const riskOrder = { HIGH: 1, MODERATE: 2, STABLE: 3 };
        return [...patients].sort(
            (a, b) => riskOrder[calculateRiskLevel(a)] - riskOrder[calculateRiskLevel(b)]
        );
    };

    // Update filtered patients when patients change
    useEffect(() => {
        setFilteredPatients(sortPatientsByRisk(patients));
    }, [patients]);

    // Handle refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchCaretakerData();
        } catch (error) {
            console.error("Refresh error:", error);
        } finally {
            setRefreshing(false);
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchCaretakerData();

        // Set up periodic refresh every 30 seconds to catch new patients
        const refreshInterval = setInterval(async () => {
            try {
                await fetchCaretakerData();
            } catch (error) {
                console.error("Periodic refresh error:", error);
            }
        }, 30000); // 30 seconds

        // Cleanup interval on component unmount
        return () => clearInterval(refreshInterval);
    }, []);

    // Show loading screen
    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#0077B6" />
                <Text className="text-gray-600 mt-3">Loading your dashboard...</Text>
            </View>
        );
    }

    return (
        <ScrollView 
            className="flex-1 bg-white"
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={['#0077B6']}
                    tintColor="#0077B6"
                />
            }
        >
            <View className="px-6 pt-12 pb-6">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                    <View>
                        <Text className="text-2xl font-bold text-gray-900">
                            Hello, {caretaker?.fullName || 'Caretaker'}!
                        </Text>
                        <Text className="text-gray-600 text-base mt-1">
                            {getCurrentDate()}
                        </Text>
                    </View>

                    {/* Profile Icon */}

                    <TouchableOpacity onPress={() => { router.push("./screens/caretaker-profile") }}>
                        <View className="items-center" >
                            <View className="w-12 h-12 bg-[#0077B6] rounded-full items-center justify-center">
                                <Ionicons name="person" size={24} color="white" />
                            </View>
                            <Text className="text-gray-700 text-sm mt-1">Profile</Text>
                        </View>
                    </TouchableOpacity>

                </View>

                {/* Search Bar */}
                <View className="border border-[#0077B6] bg-[#EBF9FC] rounded-lg px-4 py-3 mb-6 flex-row items-center">
                    <Ionicons name="search" size={20} color="#6B7280" className="mr-3" />
                    <TextInput
                        value={searchQuery}
                        onChangeText={handleSearch}
                        placeholder="Search Patients by Name or ID"
                        placeholderTextColor="#6B7280"
                        className="flex-1 text-gray-800 text-base"
                    />
                </View>

                {/* Patient List Title */}
                <Text className="text-xl font-bold text-gray-800 mb-4">
                    My Patients (Risk Sorted)
                </Text>

                {/* Patient Cards */}
                <View className="space-y-4">
                    {sortPatientsByRisk(filteredPatients).map((patient) => {
                        const riskLevel = calculateRiskLevel(patient);
                        const lastCheckIn = getLastCheckIn(patient);
                        const condition = getPatientCondition(patient);

                        return (
                            <TouchableOpacity
                                key={patient._id}
                                onPress={() => handlePatientPress(patient)}
                                className="rounded-lg p-4 flex-row items-center justify-between"
                                style={{ backgroundColor: riskColors[riskLevel] }}
                            >
                                <View className="flex-1">
                                    <View className="flex-row items-center justify-between mb-2">
                                        <Text className="text-gray-900 font-bold text-lg">
                                            {patient.fullName}{" "}
                                            {patient.patientID && `(${patient.patientID})`}
                                        </Text>
                                        <Text
                                            className="font-bold text-sm"
                                            style={{
                                                color:
                                                    riskLevel === "HIGH"
                                                        ? "white"
                                                        : riskLevel === "MODERATE"
                                                            ? "black"
                                                            : "white",
                                            }}
                                        >
                                            {riskLevel === "HIGH"
                                                ? "HIGH RISK"
                                                : riskLevel === "MODERATE"
                                                    ? "MODERATE RISK"
                                                    : "STABLE"}
                                        </Text>
                                    </View>
                                    <Text className="text-gray-800 text-sm">
                                        {condition}
                                    </Text>
                                    <Text className="text-gray-700 text-sm">
                                        Last check-in: {lastCheckIn}
                                    </Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color="#374151"
                                    className="ml-2"
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </ScrollView>
    );
}
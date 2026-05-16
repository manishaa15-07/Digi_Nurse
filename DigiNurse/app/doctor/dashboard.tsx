// app/doctor/DoctorDashboard.tsx
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
  RefreshControl,
} from "react-native";
import { API_BASE_URL } from "../../config/api";
import { storage } from "../../config/storage";

/* ---------------------- Type Definitions ---------------------- */
interface Medication {
  _id?: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate?: string;
  endDate?: string;
  instructions?: string;
  prescribedBy?: string;
  addedBy?: string;
  isActive?: boolean;
  takenCount?: number;
  missedCount?: number;
}

interface Visit {
  _id?: string;
  date: string;
  time: string;
  purpose: string;
  notes?: string;
  status?: string;
}

interface Patient {
  _id: string;
  fullName: string;
  email: string;
  contact: string;
  patientID?: string;
  dob?: string;
  gender?: string;
  conditions?: string[];
  healthScore?: number;
  dailyCheckins?: Array<{
    date: string;
    energyLevel: number;
    pain: number;
    dietQuality: string;
    sleepQuality: string;
    notes: string;
    createdAt: string;
  }>;
  medications?: Medication[];
  scheduledVisits?: Visit[];
}

interface DoctorProfile {
  _id: string;
  doctorId: string;
  fullName: string;
  email: string;
  contact: string;
  specialization: string;
  hospitalName: string;
  hospitalId: string;
  licenseNumber: string;
  experienceYears: number;
}

interface PatientsResponse {
  patients: Patient[];
}

interface PendingRequestsResponse {
  pendingRequests: Patient[];
}

/* ---------------------- Main Component ---------------------- */
export default function DoctorDashboard() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [myPatients, setMyPatients] = useState<Patient[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patientIdInput, setPatientIdInput] = useState("");

  // Medication and Visit inputs
  const [medicationInputs, setMedicationInputs] = useState<Record<string, Medication>>({});
  const [visitInputs, setVisitInputs] = useState<Record<string, Visit>>({});
  
  // Enhanced medication input state
  const [enhancedMedicationInputs, setEnhancedMedicationInputs] = useState<Record<string, {
    name: string;
    dosage: string;
    frequency: string;
    times: string[];
    startDate: string;
    endDate: string;
    instructions: string;
  }>>({});

  // Risk assessment state
  const [riskSortedPatients, setRiskSortedPatients] = useState<Patient[]>([]);
  
  // Appointments state
  const [appointments, setAppointments] = useState<Array<{
    _id: string;
    patientId: string;
    patientName: string;
    patientID: string;
    date: string;
    time: string;
    purpose: string;
    notes: string;
    status: string;
  }>>([]);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, {
    medications: boolean;
    visits: boolean;
  }>>({});

  const token = async () => await storage.getItem("doctorToken");

  /* ---------------------- Fetch Profile ---------------------- */
  const fetchProfile = async () => {
    try {
      const t = await token();
      if (!t) {
        console.log("No doctor token found, redirecting to login");
        router.replace("/doctor/login");
        return;
      }

      const profileRes = await axios.get<DoctorProfile>(
        `${API_BASE_URL}/api/doctor/profile`,
        { 
          headers: { Authorization: `Bearer ${t}` },
          timeout: 10000
        }
      );
      setDoctor(profileRes.data);

      const patientsRes = await axios.get<PatientsResponse>(
        `${API_BASE_URL}/api/doctor/${profileRes.data.doctorId}/patients`,
        { 
          headers: { Authorization: `Bearer ${t}` },
          timeout: 10000
        }
      );
      setMyPatients(patientsRes.data.patients || []);

      const pendingRes = await axios.get<PendingRequestsResponse>(
        `${API_BASE_URL}/api/doctor/pending-patients`,
        { 
          headers: { Authorization: `Bearer ${t}` },
          timeout: 10000
        }
      );
      setPendingRequests(pendingRes.data.pendingRequests || []);

      // Fetch appointments
      const appointmentsRes = await axios.get<{
        appointments: Array<{
          _id: string;
          patientId: string;
          patientName: string;
          patientID: string;
          date: string;
          time: string;
          purpose: string;
          notes: string;
          status: string;
        }>;
        totalAppointments: number;
      }>(
        `${API_BASE_URL}/api/doctor/appointments`,
        { 
          headers: { Authorization: `Bearer ${t}` },
          timeout: 10000
        }
      );
      setAppointments(appointmentsRes.data.appointments || []);
    } catch (err: any) {
      console.error('Error fetching doctor data:', err);
      
      // Only redirect to login if it's an authentication error (401/403)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        console.log("Authentication error, redirecting to login");
        await storage.removeItem("doctorToken");
        router.replace("/doctor/login");
        return;
      }
      
      // For other errors (network, server errors), show alert but don't redirect
      Alert.alert("Connection Error", "Unable to load your dashboard. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- Logout ---------------------- */
  const handleLogout = async () => {
    await storage.removeItem("doctorToken");
    await storage.removeItem("doctorID");
    await storage.removeItem("doctorFullName");
    router.replace("/doctor/login");
  };

  /* ---------------------- Patient Actions ---------------------- */
  const handleApproveRequest = async (patientId: string) => {
    try {
      const t = await token();
      await axios.post(
        `${API_BASE_URL}/api/doctor/approve-patient`,
        { patientId },
        { headers: { Authorization: `Bearer ${t}` } }
      );
      Alert.alert("Success", "Patient request approved!");
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err?.response?.data?.message || "Failed to approve request");
    }
  };

  const handleRejectRequest = async (patientId: string) => {
    try {
      const t = await token();
      await axios.post(
        `${API_BASE_URL}/api/doctor/reject-patient`,
        { patientId },
        { headers: { Authorization: `Bearer ${t}` } }
      );
      Alert.alert("Success", "Patient request rejected!");
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err?.response?.data?.message || "Failed to reject request");
    }
  };

  const handleUnlinkPatient = async (patientId: string) => {
    try {
      const t = await token();
      await axios.post(
        `${API_BASE_URL}/api/doctor/unlink-patient`,
        { doctorId: doctor?._id, patientId },
        { headers: { Authorization: `Bearer ${t}` } }
      );
      Alert.alert("Success", "Patient unlinked successfully!");
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err?.response?.data?.message || "Failed to unlink patient");
    }
  };

  const handleAddPatientById = async () => {
    if (!patientIdInput.trim()) {
      Alert.alert("Input Error", "Please enter a valid patient ID");
      return;
    }
    try {
      const t = await token();
      await axios.post(
        `${API_BASE_URL}/api/doctor/link-patient`,
        { doctorId: doctor?._id, patientId: patientIdInput.trim() },
        { headers: { Authorization: `Bearer ${t}` } }
      );
      Alert.alert("Success", "Patient linked successfully!");
      setPatientIdInput("");
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err?.response?.data?.message || "Failed to link patient");
    }
  };

  /* ---------------------- Medication Management ---------------------- */
  const handleAddMedication = async (patientId: string) => {
    const med = enhancedMedicationInputs[patientId];
    if (!med?.name || !med?.dosage || !med?.frequency || !med?.startDate) {
      Alert.alert("Input Error", "Please fill all required medication fields (Name, Dosage, Frequency, Start Date)");
      return;
    }
    try {
      const t = await token();
      await axios.post(
        `${API_BASE_URL}/api/doctor/patient/${patientId}/add-medication`,
        med,
        { headers: { Authorization: `Bearer ${t}` } }
      );
      Alert.alert("Success", "Medication added!");
      
      // Clear the input form
      setEnhancedMedicationInputs(prev => ({
        ...prev,
        [patientId]: {
          name: '',
          dosage: '',
          frequency: '',
          times: [],
          startDate: '',
          endDate: '',
          instructions: ''
        }
      }));
      
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err?.response?.data?.message || "Failed to add medication");
    }
  };

  const handleRemoveMedication = async (patientId: string, medicationId: string) => {
    try {
      const t = await token();
      await axios.delete(
        `${API_BASE_URL}/api/doctor/patient/${patientId}/remove-medication/${medicationId}`,
        { headers: { Authorization: `Bearer ${t}` } }
      );
      Alert.alert("Removed", "Medication removed!");
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err?.response?.data?.message || "Failed to remove medication");
    }
  };

  /* ---------------------- Scheduled Visit Management ---------------------- */
  const handleAddVisit = async (patientId: string) => {
    const v = visitInputs[patientId];
    if (!v?.date || !v?.time || !v?.purpose) {
      Alert.alert("Input Error", "Please enter visit date, time, and purpose");
      return;
    }
    try {
      const t = await token();
      await axios.post(
        `${API_BASE_URL}/api/doctor/patient/${patientId}/add-visit`,
        v,
        { headers: { Authorization: `Bearer ${t}` } }
      );
      Alert.alert("Success", "Visit scheduled successfully!");
      
      // Clear the input form
      setVisitInputs(prev => ({
        ...prev,
        [patientId]: {
          date: '',
          time: '',
          purpose: '',
          notes: ''
        }
      }));
      
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err?.response?.data?.message || "Failed to add visit");
    }
  };

  const handleRemoveVisit = async (patientId: string, visitId: string) => {
    try {
      const t = await token();
      await axios.delete(
        `${API_BASE_URL}/api/doctor/patient/${patientId}/remove-visit/${visitId}`,
        { headers: { Authorization: `Bearer ${t}` } }
      );
      Alert.alert("Removed", "Visit removed!");
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err?.response?.data?.message || "Failed to remove visit");
    }
  };

  /* ---------------------- Risk Assessment Functions ---------------------- */
  // Calculate risk level based on patient data
  const calculateRiskLevel = (patient: Patient): "HIGH" | "MODERATE" | "STABLE" => {
    if (!patient.dailyCheckins || patient.dailyCheckins.length === 0) {
      return "MODERATE"; // No recent check-ins
    }

    const latestCheckin = patient.dailyCheckins[patient.dailyCheckins.length - 1];
    const daysSinceCheckin = Math.floor(
      (Date.now() - new Date(latestCheckin.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // High risk if pain level is high or no check-in for more than 2 days
    if (latestCheckin.pain >= 7 || daysSinceCheckin > 2) {
      return "HIGH";
    }

    // Moderate risk if energy is low or diet/sleep quality is poor
    if (latestCheckin.energyLevel <= 4 ||
        latestCheckin.dietQuality === 'poor' ||
        latestCheckin.sleepQuality === 'poor') {
      return "MODERATE";
    }

    return "STABLE";
  };

  // Get risk color
  const getRiskColor = (riskLevel: "HIGH" | "MODERATE" | "STABLE"): string => {
    switch (riskLevel) {
      case "HIGH": return "#EF4444"; // Red
      case "MODERATE": return "#F59E0B"; // Yellow/Orange
      case "STABLE": return "#10B981"; // Green
      default: return "#6B7280"; // Gray
    }
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

  // Get patient condition summary
  const getPatientCondition = (patient: Patient): string => {
    if (!patient.dailyCheckins || patient.dailyCheckins.length === 0) {
      return "No recent data";
    }

    const latestCheckin = patient.dailyCheckins[patient.dailyCheckins.length - 1];
    const conditions = patient.conditions || [];

    if (latestCheckin.pain >= 7) {
      return "High pain level";
    } else if (latestCheckin.energyLevel <= 4) {
      return "Low energy";
    } else if (conditions.length > 0) {
      return conditions[0]; // Show first condition
    } else {
      return "Stable condition";
    }
  };

  // Sort patients by risk level (HIGH -> MODERATE -> STABLE)
  const sortPatientsByRisk = (patients: Patient[]) => {
    const riskOrder = { HIGH: 1, MODERATE: 2, STABLE: 3 };
    return [...patients].sort(
      (a, b) => riskOrder[calculateRiskLevel(a)] - riskOrder[calculateRiskLevel(b)]
    );
  };

  // Update risk sorted patients when myPatients change
  useEffect(() => {
    setRiskSortedPatients(sortPatientsByRisk(myPatients));
  }, [myPatients]);

  /* ---------------------- Collapsible Section Helpers ---------------------- */
  const toggleSection = (patientId: string, section: 'medications' | 'visits') => {
    setExpandedSections(prev => ({
      ...prev,
      [patientId]: {
        ...prev[patientId],
        [section]: !prev[patientId]?.[section]
      }
    }));
  };

  const isSectionExpanded = (patientId: string, section: 'medications' | 'visits') => {
    return expandedSections[patientId]?.[section] || false;
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchProfile();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    // Set up periodic refresh every 30 seconds to catch new requests and updates
    const refreshInterval = setInterval(async () => {
      try {
        await fetchProfile();
      } catch (error) {
        console.error("Periodic refresh error:", error);
      }
    }, 30000); // 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  /* ---------------------- Loading State ---------------------- */
  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="text-gray-600 mt-3">Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  /* ---------------------- Render ---------------------- */
  return (
    <SafeAreaView className="flex-1 bg-white p-6">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0ea5e9']}
            tintColor="#0ea5e9"
          />
        }
      >
        <Text className="text-2xl font-bold text-sky-700 mb-6">
          Welcome, Dr. {doctor?.fullName}
        </Text>

        {/* Doctor Info */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Profile Details</Text>
          <Text className="text-gray-600">Email: {doctor?.email}</Text>
          <Text className="text-gray-600">Contact: {doctor?.contact}</Text>
          <Text className="text-gray-600">Specialization: {doctor?.specialization}</Text>
          <Text className="text-gray-600">
            Hospital: {doctor?.hospitalName} (ID: {doctor?.hospitalId})
          </Text>
        </View>

        {/* Risk-Sorted Patients Section */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-3">⚠️ Patient Risk Assessment</Text>
          {riskSortedPatients.length === 0 ? (
            <Text className="text-gray-500">No patients linked yet.</Text>
          ) : (
            <View className="space-y-3">
              {riskSortedPatients.map((patient) => {
                const riskLevel = calculateRiskLevel(patient);
                const riskColor = getRiskColor(riskLevel);
                const lastCheckIn = getLastCheckIn(patient);
                const condition = getPatientCondition(patient);
                
                return (
                  <View
                    key={patient._id}
                    className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
                    style={{ borderLeftWidth: 4, borderLeftColor: riskColor }}
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <Text className="text-lg font-semibold text-gray-800 mr-2">
                            {patient.fullName}
                          </Text>
                          <View
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: `${riskColor}20` }}
                          >
                            <Text
                              className="text-xs font-semibold"
                              style={{ color: riskColor }}
                            >
                              {riskLevel}
                            </Text>
                          </View>
                        </View>
                        
                        <Text className="text-sm text-gray-600 mb-1">
                          ID: {patient.patientID || 'N/A'}
                        </Text>
                        <Text className="text-sm text-gray-600 mb-1">
                          Condition: {condition}
                        </Text>
                        <Text className="text-sm text-gray-600 mb-1">
                          Last Check-in: {lastCheckIn}
                        </Text>
                        {patient.healthScore && (
                          <Text className="text-sm text-gray-600">
                            Health Score: {patient.healthScore}/100
                          </Text>
                        )}
                      </View>
                      
                      <View className="items-end">
                        <View
                          className="w-3 h-3 rounded-full mb-2"
                          style={{ backgroundColor: riskColor }}
                        />
                        <Text className="text-xs text-gray-500">
                          {patient.medications?.length || 0} medications
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Appointments Section */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-3">📅 Upcoming Appointments</Text>
          {appointments.length === 0 ? (
            <Text className="text-gray-500">No appointments scheduled.</Text>
          ) : (
            <View className="space-y-3">
              {appointments.slice(0, 5).map((appointment) => {
                const appointmentDate = new Date(appointment.date);
                const today = new Date();
                const isToday = appointmentDate.toDateString() === today.toDateString();
                const isUpcoming = appointmentDate > today;
                
                return (
                  <View
                    key={appointment._id}
                    className={`border border-gray-200 rounded-xl p-4 bg-white shadow-sm ${
                      isToday ? 'border-blue-300 bg-blue-50' : ''
                    }`}
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <Text className="text-lg font-semibold text-gray-800 mr-2">
                            {appointment.patientName}
                          </Text>
                          <View
                            className={`px-2 py-1 rounded-full ${
                              appointment.status === 'upcoming' ? 'bg-blue-100' :
                              appointment.status === 'completed' ? 'bg-green-100' :
                              appointment.status === 'cancelled' ? 'bg-red-100' :
                              'bg-gray-100'
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                appointment.status === 'upcoming' ? 'text-blue-700' :
                                appointment.status === 'completed' ? 'text-green-700' :
                                appointment.status === 'cancelled' ? 'text-red-700' :
                                'text-gray-700'
                              }`}
                            >
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </Text>
                          </View>
                        </View>
                        
                        <Text className="text-sm text-gray-600 mb-1">
                          Patient ID: {appointment.patientID}
                        </Text>
                        <Text className="text-sm text-gray-600 mb-1">
                          Date: {appointmentDate.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </Text>
                        <Text className="text-sm text-gray-600 mb-1">
                          Time: {appointment.time}
                        </Text>
                        {appointment.purpose && (
                          <Text className="text-sm text-gray-600">
                            Purpose: {appointment.purpose}
                          </Text>
                        )}
                      </View>
                      
                      <View className="items-end">
                        {isToday && (
                          <View className="bg-blue-500 px-2 py-1 rounded-full mb-2">
                            <Text className="text-white text-xs font-semibold">TODAY</Text>
                          </View>
                        )}
                        {isUpcoming && !isToday && (
                          <View className="bg-green-500 px-2 py-1 rounded-full mb-2">
                            <Text className="text-white text-xs font-semibold">UPCOMING</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
              
              {appointments.length > 5 && (
                <View className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <Text className="text-center text-gray-600">
                    And {appointments.length - 5} more appointments...
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Add Patient */}
        <View className="mb-6 border border-gray-200 rounded-xl p-4 bg-sky-50">
          <Text className="text-lg font-semibold mb-2 text-gray-800">Link Patient by ID</Text>
          <TextInput
            placeholder="Enter Patient ID"
            value={patientIdInput}
            onChangeText={setPatientIdInput}
            className="border border-gray-300 rounded-xl p-3 mb-3 bg-white"
          />
          <Pressable onPress={handleAddPatientById} className="bg-sky-600 p-3 rounded-xl">
            <Text className="text-white text-center font-semibold">Link Patient</Text>
          </Pressable>
        </View>

        {/* My Patients Section */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-3">My Patients</Text>
          {myPatients.length === 0 ? (
            <Text className="text-gray-500">No patients linked yet.</Text>
          ) : (
            myPatients.map((p) => (
              <View key={p._id} className="border border-gray-200 p-4 rounded-xl mb-4 bg-sky-50">
                <Text className="text-gray-800 font-semibold">{p.fullName}</Text>
                <Text className="text-gray-600 text-sm">Email: {p.email}</Text>
                <Text className="text-gray-600 text-sm">Contact: {p.contact}</Text>

                {/* Unlink Button */}
                <Pressable
                  onPress={() => handleUnlinkPatient(p._id)}
                  className="bg-red-500 p-2 rounded-xl mt-2"
                >
                  <Text className="text-white text-center font-semibold">Unlink Patient</Text>
                </Pressable>

                {/* ----------------- Medication Section ----------------- */}
                <View className="mt-4 bg-white p-3 rounded-xl border">
                  <Pressable 
                    onPress={() => toggleSection(p._id, 'medications')}
                    className="flex-row justify-between items-center mb-2"
                  >
                    <Text className="font-semibold text-gray-800">
                      💊 Medications ({p.medications?.length || 0})
                    </Text>
                    <Text className="text-lg">
                      {isSectionExpanded(p._id, 'medications') ? '▼' : '▶'}
                    </Text>
                  </Pressable>
                  
                  {isSectionExpanded(p._id, 'medications') && (
                    <>
                      {p.medications && p.medications.length > 0 ? (
                    p.medications.map((m) => (
                      <View
                        key={m._id}
                        className="border border-gray-200 p-3 rounded-lg mb-2 bg-sky-50"
                      >
                        <Text className="font-medium">{m.name} - {m.dosage}</Text>
                        <Text className="text-sm text-gray-600">{m.frequency}</Text>
                        {m.times && m.times.length > 0 && (
                          <Text className="text-sm text-gray-500">Times: {m.times.join(', ')}</Text>
                        )}
                        {m.instructions && (
                          <Text className="text-sm text-gray-500">Instructions: {m.instructions}</Text>
                        )}
                        <View className="flex-row mt-2">
                          <View className="bg-green-100 px-2 py-1 rounded mr-2">
                            <Text className="text-green-800 text-xs">
                              Taken: {m.takenCount || 0}
                            </Text>
                          </View>
                          <View className="bg-red-100 px-2 py-1 rounded">
                            <Text className="text-red-800 text-xs">
                              Missed: {m.missedCount || 0}
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => handleRemoveMedication(p._id, m._id!)}
                          className="bg-red-400 mt-2 rounded-md p-1"
                        >
                          <Text className="text-white text-center text-sm">Remove</Text>
                        </Pressable>
                      </View>
                    ))
                  ) : (
                    <Text className="text-gray-500">No medications added yet.</Text>
                  )}

                  {/* Enhanced Add Medication Form */}
                  <View className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <Text className="font-medium text-gray-800 mb-2">Add New Medication</Text>
                    
                    <TextInput
                      placeholder="Medication Name *"
                      value={enhancedMedicationInputs[p._id]?.name || ''}
                      onChangeText={(text) =>
                        setEnhancedMedicationInputs((prev) => ({
                          ...prev,
                          [p._id]: { ...prev[p._id], name: text },
                        }))
                      }
                      className="border border-gray-300 rounded-lg p-2 mb-2 bg-white"
                    />
                    
                    <TextInput
                      placeholder="Dosage (e.g., 500mg) *"
                      value={enhancedMedicationInputs[p._id]?.dosage || ''}
                      onChangeText={(text) =>
                        setEnhancedMedicationInputs((prev) => ({
                          ...prev,
                          [p._id]: { ...prev[p._id], dosage: text },
                        }))
                      }
                      className="border border-gray-300 rounded-lg p-2 mb-2 bg-white"
                    />
                    
                    <TextInput
                      placeholder="Frequency (e.g., Twice daily) *"
                      value={enhancedMedicationInputs[p._id]?.frequency || ''}
                      onChangeText={(text) =>
                        setEnhancedMedicationInputs((prev) => ({
                          ...prev,
                          [p._id]: { ...prev[p._id], frequency: text },
                        }))
                      }
                      className="border border-gray-300 rounded-lg p-2 mb-2 bg-white"
                    />
                    
                    <TextInput
                      placeholder="Times (e.g., 08:00,20:00)"
                      value={enhancedMedicationInputs[p._id]?.times?.join(',') || ''}
                      onChangeText={(text) =>
                        setEnhancedMedicationInputs((prev) => ({
                          ...prev,
                          [p._id]: { 
                            ...prev[p._id], 
                            times: text.split(',').filter(t => t.trim()) 
                          },
                        }))
                      }
                      className="border border-gray-300 rounded-lg p-2 mb-2 bg-white"
                    />
                    
                    <TextInput
                      placeholder="Start Date (YYYY-MM-DD) *"
                      value={enhancedMedicationInputs[p._id]?.startDate || ''}
                      onChangeText={(text) =>
                        setEnhancedMedicationInputs((prev) => ({
                          ...prev,
                          [p._id]: { ...prev[p._id], startDate: text },
                        }))
                      }
                      className="border border-gray-300 rounded-lg p-2 mb-2 bg-white"
                    />
                    
                    <TextInput
                      placeholder="End Date (YYYY-MM-DD) - Optional"
                      value={enhancedMedicationInputs[p._id]?.endDate || ''}
                      onChangeText={(text) =>
                        setEnhancedMedicationInputs((prev) => ({
                          ...prev,
                          [p._id]: { ...prev[p._id], endDate: text },
                        }))
                      }
                      className="border border-gray-300 rounded-lg p-2 mb-2 bg-white"
                    />
                    
                    <TextInput
                      placeholder="Instructions (Optional)"
                      value={enhancedMedicationInputs[p._id]?.instructions || ''}
                      onChangeText={(text) =>
                        setEnhancedMedicationInputs((prev) => ({
                          ...prev,
                          [p._id]: { ...prev[p._id], instructions: text },
                        }))
                      }
                      multiline
                      className="border border-gray-300 rounded-lg p-2 mb-2 bg-white"
                    />
                    
                    <Pressable
                      onPress={() => handleAddMedication(p._id)}
                      className="bg-green-600 mt-2 p-2 rounded-xl"
                    >
                      <Text className="text-white text-center font-semibold">
                        Add Medication
                      </Text>
                    </Pressable>
                  </View>
                    </>
                  )}
                </View>

                {/* ----------------- Scheduled Visit Section ----------------- */}
                <View className="mt-4 bg-white p-3 rounded-xl border">
                  <Pressable 
                    onPress={() => toggleSection(p._id, 'visits')}
                    className="flex-row justify-between items-center mb-2"
                  >
                    <Text className="font-semibold text-gray-800">
                      📅 Scheduled Visits ({p.scheduledVisits?.length || 0})
                    </Text>
                    <Text className="text-lg">
                      {isSectionExpanded(p._id, 'visits') ? '▼' : '▶'}
                    </Text>
                  </Pressable>
                  
                  {isSectionExpanded(p._id, 'visits') && (
                    <>
                      {p.scheduledVisits && p.scheduledVisits.length > 0 ? (
                    p.scheduledVisits.map((v) => (
                      <View
                        key={v._id}
                        className="border border-gray-200 p-2 rounded-lg mb-2 bg-yellow-50"
                      >
                        <Text>{v.date} - {v.purpose}</Text>
                        <Pressable
                          onPress={() => handleRemoveVisit(p._id, v._id!)}
                          className="bg-red-400 mt-1 rounded-md p-1"
                        >
                          <Text className="text-white text-center text-sm">Remove</Text>
                        </Pressable>
                      </View>
                    ))
                  ) : (
                    <Text className="text-gray-500">No visits scheduled yet.</Text>
                  )}

                  {/* Add Visit */}
                  <TextInput
                    placeholder="Date (YYYY-MM-DD) *"
                    value={visitInputs[p._id]?.date || ''}
                    className="border border-gray-300 rounded-lg p-2 mt-2 bg-white"
                    onChangeText={(text) =>
                      setVisitInputs((prev) => ({
                        ...prev,
                        [p._id]: { ...prev[p._id], date: text },
                      }))
                    }
                  />
                  <TextInput
                    placeholder="Time (HH:MM) *"
                    value={visitInputs[p._id]?.time || ''}
                    className="border border-gray-300 rounded-lg p-2 mt-2 bg-white"
                    onChangeText={(text) =>
                      setVisitInputs((prev) => ({
                        ...prev,
                        [p._id]: { ...prev[p._id], time: text },
                      }))
                    }
                  />
                  <TextInput
                    placeholder="Purpose *"
                    value={visitInputs[p._id]?.purpose || ''}
                    className="border border-gray-300 rounded-lg p-2 mt-2 bg-white"
                    onChangeText={(text) =>
                      setVisitInputs((prev) => ({
                        ...prev,
                        [p._id]: { ...prev[p._id], purpose: text },
                      }))
                    }
                  />
                  <TextInput
                    placeholder="Notes (Optional)"
                    value={visitInputs[p._id]?.notes || ''}
                    className="border border-gray-300 rounded-lg p-2 mt-2 bg-white"
                    multiline
                    onChangeText={(text) =>
                      setVisitInputs((prev) => ({
                        ...prev,
                        [p._id]: { ...prev[p._id], notes: text },
                      }))
                    }
                  />
                  <Pressable
                    onPress={() => handleAddVisit(p._id)}
                    className="bg-green-600 mt-2 p-2 rounded-xl"
                  >
                    <Text className="text-white text-center font-semibold">
                      Add Visit
                    </Text>
                  </Pressable>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
  </View>

        {/* Pending Requests */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-3">Pending Requests</Text>
          {pendingRequests.length === 0 ? (
            <Text className="text-gray-500">No pending patient requests.</Text>
          ) : (
            pendingRequests.map((p) => (
              <View
                key={p._id}
                className="border border-gray-200 p-4 rounded-xl mb-2 bg-yellow-50 flex-row justify-between items-center"
              >
                <View>
                  <Text className="text-gray-800 font-semibold">{p.fullName}</Text>
                  <Text className="text-gray-600 text-sm">Email: {p.email}</Text>
                  <Text className="text-gray-600 text-sm">Contact: {p.contact}</Text>
                </View>
                <View className="flex-row space-x-2">
                  <Pressable
                    onPress={() => handleApproveRequest(p._id)}
                    className="bg-sky-600 p-2 rounded-xl"
                  >
                    <Text className="text-white font-semibold">Approve</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRejectRequest(p._id)}
                    className="bg-gray-500 p-2 rounded-xl"
                  >
                    <Text className="text-white font-semibold">Reject</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          className="bg-sky-600 p-4 rounded-xl mt-4 shadow"
        >
          <Text className="text-white text-center font-bold text-lg">Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

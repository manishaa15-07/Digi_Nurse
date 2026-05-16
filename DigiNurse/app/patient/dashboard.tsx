import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";
import Slider from "@react-native-community/slider";
import axios from "axios";
import { storage } from "../../config/storage";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../../config/api";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  times: string[]; // Array of times like ["08:00", "14:00", "20:00"]
  instructions?: string;
  doctorName?: string;
  // Counts for quick summary display (optional because API may not provide them)
  takenCount?: number;
  missedCount?: number;
}

interface MedicationRecord {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  scheduledDate: string;
  status: 'taken' | 'missed' | 'pending' | 'upcoming';
  takenAt?: string;
  notes?: string;
}

interface Appointment {
  doctorName: string;
  date: string;
  time: string;
  reason: string;
}

interface Caretaker {
  name: string;
  email: string;
}

interface Doctor {
  name: string;
  email: string;
}

interface HealthCheck {
  energyLevel: number;
  painLevel: number;
  dietQuality: number;
  sleepQuality: number;
}

const Dashboard: React.FC = () => {
  const router = useRouter();

  const [username, setUsername] = useState<string>("Patient");
  const [healthScore, setHealthScore] = useState<number>(85);
  const [checkedInToday, setCheckedInToday] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [healthCheck, setHealthCheck] = useState<HealthCheck>({
    energyLevel: 5, // max 5
    painLevel: 0,   // max 5
    dietQuality: 3,
    sleepQuality: 3,
  });

  const [additionalThoughts, setAdditionalThoughts] = useState<string>("");

  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationRecords, setMedicationRecords] = useState<MedicationRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [myCaretakers, setMyCaretakers] = useState<Caretaker[]>([]);
  const [requestedCaretakers, setRequestedCaretakers] = useState<Caretaker[]>([]);
  const [myDoctors, setMyDoctors] = useState<Doctor[]>([]);
  const [requestedDoctors, setRequestedDoctors] = useState<Doctor[]>([]);

  // Medication management states
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    times: [] as string[],
    startDate: '',
    endDate: '',
    instructions: ''
  });

  // Fetch profile and check-in status
  const fetchProfileAndCheckinStatus = async () => {
    try {
      const token = await storage.getItem("patientToken");
      if (!token) {
        console.log("No patient token found, redirecting to login");
        router.replace("/patient/login");
        return;
      }

      type ProfileResponse = {
        healthScore?: number;
        name?: string;
        dailyCheckins?: { date: string }[];
      };

      const res = await axios.get<ProfileResponse>(
        `${API_BASE_URL}/api/patient/profile`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000 // 10 second timeout
        }
      );

      const { healthScore, name, dailyCheckins } = res.data;
      setUsername(name || "Patient");
      setHealthScore(healthScore || 85);

      if (dailyCheckins?.length) {
        const today = new Date().toISOString().split("T")[0];
        const todayCheckin = dailyCheckins.find((checkin) => {
          const checkinDate = new Date(checkin.date).toISOString().split("T")[0];
          return checkinDate === today;
        });
        if (todayCheckin) setCheckedInToday(true);
      }
    } catch (error: any) {
      console.error("Profile fetch error:", error);
      
      // Only redirect to login if it's an authentication error (401/403)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log("Authentication error, redirecting to login");
        await storage.removeItem("patientToken");
        router.replace("/patient/login");
        return;
      }
      
      // For other errors (network, server errors), show alert but don't redirect
      Alert.alert("Connection Error", "Unable to load your profile. Please check your internet connection and try again.");
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const token = await storage.getItem("patientToken");
      if (!token) return;

      type DashboardResponse = {
        medications: Medication[];
        appointments: Appointment[];
        fullName: string;
      };

      const res = await axios.get<DashboardResponse>(
        `${API_BASE_URL}/api/patient/dashboard`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );

      setMedications(res.data.medications || []);
      setAppointments(res.data.appointments || []);
      setUsername(res.data.fullName || "Patient");
    } catch (error: any) {
      console.error("Dashboard data fetch error:", error);
      
      // Only show alert for non-authentication errors
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        console.log("Dashboard data fetch failed, but continuing...");
        // Don't show alert for dashboard data fetch failures to avoid spam
      }
    }
  };

  // Fetch medication records
  const fetchMedicationRecords = async () => {
    try {
      const token = await storage.getItem("patientToken");
      if (!token) return;

      type MedicationRecordsResponse = {
        records: MedicationRecord[];
      };

      const res = await axios.get<MedicationRecordsResponse>(
        `${API_BASE_URL}/api/patient/medication-records`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );

      setMedicationRecords(res.data.records || []);
    } catch (error: any) {
      console.error("Medication records fetch error:", error);
      
      // Only use mock data for non-authentication errors
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        console.log("Using mock medication records due to API failure");
        setMedicationRecords(generateMockMedicationRecords());
      }
    }
  };

  // Fetch caretakers and doctors
  const fetchConnections = async () => {
    try {
      const token = await storage.getItem("patientToken");
      if (!token) return;

      type CaretakerListResponse = { caretakers: Caretaker[] };
      type CaretakerRequestResponse = { requests: Caretaker[] };
      type DoctorListResponse = { doctors: Doctor[] };
      type DoctorRequestResponse = { requests: Doctor[] };

      const caretakersRes = await axios.get<CaretakerListResponse>(
        `${API_BASE_URL}/api/patient/caretakers`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );
      setMyCaretakers(caretakersRes.data.caretakers || []);

      const pendingCaretakersRes = await axios.get<CaretakerRequestResponse>(
        `${API_BASE_URL}/api/patient/pending-caretakers`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );
      setRequestedCaretakers(pendingCaretakersRes.data.requests || []);

      const doctorsRes = await axios.get<DoctorListResponse>(
        `${API_BASE_URL}/api/patient/doctors`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );
      setMyDoctors(doctorsRes.data.doctors || []);

      const pendingDoctorsRes = await axios.get<DoctorRequestResponse>(
        `${API_BASE_URL}/api/patient/pending-doctors`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );
      setRequestedDoctors(pendingDoctorsRes.data.requests || []);
    } catch (error: any) {
      console.error("Connections fetch error:", error);
      
      // Don't redirect for connection fetch failures, just log the error
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log("Authentication error in connections fetch");
        // Don't redirect here as the main profile fetch will handle it
      }
    }
  };

  // Generate mock medication records for demonstration
  const generateMockMedicationRecords = (): MedicationRecord[] => {
    const today = new Date();
    const records: MedicationRecord[] = [];
    
    // Generate records for the past 3 days and next 3 days
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Morning medication (8:00 AM)
      records.push({
        id: `record-${dateStr}-morning`,
        medicationId: 'med-1',
        medicationName: 'Metformin',
        scheduledTime: '08:00',
        scheduledDate: dateStr,
        status: i < 0 ? (Math.random() > 0.2 ? 'taken' : 'missed') : 
                i === 0 ? (new Date().getHours() >= 8 ? 'taken' : 'pending') : 'upcoming',
        takenAt: i < 0 && Math.random() > 0.2 ? `${dateStr}T08:15:00` : undefined,
      });
      
      // Evening medication (8:00 PM)
      records.push({
        id: `record-${dateStr}-evening`,
        medicationId: 'med-2',
        medicationName: 'Lisinopril',
        scheduledTime: '20:00',
        scheduledDate: dateStr,
        status: i < 0 ? (Math.random() > 0.1 ? 'taken' : 'missed') : 
                i === 0 ? (new Date().getHours() >= 20 ? 'taken' : 'upcoming') : 'upcoming',
        takenAt: i < 0 && Math.random() > 0.1 ? `${dateStr}T20:05:00` : undefined,
      });
    }
    
    return records;
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      try {
        // Run all fetch operations in parallel for better performance
        await Promise.allSettled([
          fetchProfileAndCheckinStatus(),
          fetchDashboardData(),
          fetchMedicationRecords(),
          fetchConnections()
        ]);
      } catch (error) {
        console.error("Dashboard initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();

    // Set up periodic refresh every 30 seconds to catch doctor-added medications
    const refreshInterval = setInterval(async () => {
      try {
        await Promise.allSettled([
          fetchDashboardData(),
          fetchMedicationRecords()
        ]);
      } catch (error) {
        console.error("Periodic refresh error:", error);
      }
    }, 30000); // 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  // Calculate health score with improved algorithm
  const calculateHealthScore = (
    energy: number,
    pain: number,
    diet: number,
    sleep: number
  ): number => {
    // Clamp all values to valid ranges
    const clampedEnergy = Math.min(Math.max(energy, 0), 5);
    const clampedPain = Math.min(Math.max(pain, 0), 5);
    const clampedDiet = Math.min(Math.max(diet, 0), 5);
    const clampedSleep = Math.min(Math.max(sleep, 0), 5);
    
    // Calculate weighted score (pain is inverted - lower pain = higher score)
    const energyScore = (clampedEnergy / 5) * 30; // 30% weight
    const painScore = ((5 - clampedPain) / 5) * 30; // 30% weight (inverted)
    const dietScore = (clampedDiet / 5) * 20; // 20% weight
    const sleepScore = (clampedSleep / 5) * 20; // 20% weight
    
    const totalScore = energyScore + painScore + dietScore + sleepScore;
    return Math.round(Math.min(Math.max(totalScore, 0), 100));
  };

  useEffect(() => {
    const score = calculateHealthScore(
      healthCheck.energyLevel,
      healthCheck.painLevel,
      healthCheck.dietQuality,
      healthCheck.sleepQuality
    );
    setHealthScore(score);
  }, [healthCheck]);

  // Submit check-in
  const handleSubmitCheckin = async () => {
    try {
      const token = await storage.getItem("patientToken");
      if (!token) return Alert.alert("Error", "You are not logged in.");

      const getQuality = (value: number) => {
        if (value <= 2) return "poor";
        if (value === 3) return "average";
        if (value === 4) return "good";
        return "excellent";
      };

      const payload = {
        energyLevel: Math.min(Math.max(healthCheck.energyLevel, 0), 5),
        painLevel: Math.min(Math.max(healthCheck.painLevel, 0), 5),
        dietQuality: getQuality(Math.min(Math.max(healthCheck.dietQuality, 0), 5)),
        sleepQuality: getQuality(Math.min(Math.max(healthCheck.sleepQuality, 0), 5)),
        notes: additionalThoughts,
        healthScore,
      };

      type CheckinResponse = { message: string };

      const res = await axios.post<CheckinResponse>(
        `${API_BASE_URL}/api/patient/daily-checkin`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCheckedInToday(true);
      Alert.alert("✅ Success", res.data.message || "Check-in saved!");
    } catch (error: any) {
      const message = error?.response?.data?.message;
      if (message?.includes("already")) {
        Alert.alert("Notice", "You’ve already submitted your check-in today!");
        setCheckedInToday(true);
      } else {
        Alert.alert("Error", message || "Submission failed");
      }
    }
  };

  const handleLogout = async () => {
    await storage.removeItem("patientToken");
    router.replace("/patient/login");
  };

  // Refresh dashboard data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        fetchProfileAndCheckinStatus(),
        fetchDashboardData(),
        fetchMedicationRecords(),
        fetchConnections()
      ]);
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Add medication function
  const handleAddMedication = async () => {
    try {
      const token = await storage.getItem("patientToken");
      if (!token) return Alert.alert("Error", "You are not logged in.");

      if (!newMedication.name || !newMedication.dosage || !newMedication.frequency || !newMedication.startDate) {
        Alert.alert("Error", "Please fill in all required fields (Name, Dosage, Frequency, Start Date)");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/patient/medications`,
        newMedication,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Medication added successfully!");
      setNewMedication({
        name: '',
        dosage: '',
        frequency: '',
        times: [],
        startDate: '',
        endDate: '',
        instructions: ''
      });
      setShowAddMedication(false);
      
      // Refresh medication data
      fetchDashboardData();
      fetchMedicationRecords();
    } catch (error: any) {
      console.error("Error adding medication:", error);
      Alert.alert("Error", error?.response?.data?.message || "Failed to add medication");
    }
  };

  // Remove medication function
  const handleRemoveMedication = async (medicationId: string) => {
    try {
      const token = await storage.getItem("patientToken");
      if (!token) return Alert.alert("Error", "You are not logged in.");

      Alert.alert(
        "Confirm Removal",
        "Are you sure you want to remove this medication?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                await axios.delete(
                  `${API_BASE_URL}/api/patient/medications/${medicationId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                Alert.alert("Success", "Medication removed successfully!");
                
                // Refresh medication data
                fetchDashboardData();
                fetchMedicationRecords();
              } catch (error: any) {
                console.error("Error removing medication:", error);
                Alert.alert("Error", error?.response?.data?.message || "Failed to remove medication");
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error("Error removing medication:", error);
      Alert.alert("Error", "Failed to remove medication");
    }
  };

  // Mark medication as taken
  const markMedicationAsTaken = async (recordId: string) => {
    try {
      const token = await storage.getItem("patientToken");
      if (!token) return;

      await axios.patch(
        `${API_BASE_URL}/api/patient/medication-records/${recordId}/taken`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("✅ Success", "Medication marked as taken!");
      
      // Refresh medication records
      fetchMedicationRecords();
    } catch (error: any) {
      console.error("Error marking medication as taken:", error);
      Alert.alert("Error", error?.response?.data?.message || "Failed to update medication status");
    }
  };

  const getHealthScoreDescription = (score: number): string => {
    if (score >= 85) return "Excellent 🌟";
    if (score >= 70) return "Good 😊";
    if (score >= 55) return "Fair 😐";
    return "Needs Attention ⚠️";
  };

  const getHealthScoreColors = (score: number) => {
    if (score < 60) return { bg: "#FFCCCB", border: "#FF0000" };
    if (score < 75) return { bg: "#FFF5BA", border: "#FFD700" };
    return { bg: "#90EE90", border: "#2E8B57" };
  };

  // Helper functions for medication records
  const getPastMedications = () => {
    const today = new Date().toISOString().split('T')[0];
    return medicationRecords.filter(record => 
      record.scheduledDate < today || 
      (record.scheduledDate === today && record.status === 'taken')
    );
  };

  const getUpcomingMedications = () => {
    const today = new Date().toISOString().split('T')[0];
    return medicationRecords.filter(record => 
      record.scheduledDate > today || 
      (record.scheduledDate === today && (record.status === 'pending' || record.status === 'upcoming'))
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return '#10B981'; // green
      case 'missed': return '#EF4444'; // red
      case 'pending': return '#F59E0B'; // yellow
      case 'upcoming': return '#3B82F6'; // blue
      default: return '#6B7280'; // gray
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return 'checkmark-circle';
      case 'missed': return 'close-circle';
      case 'pending': return 'time';
      case 'upcoming': return 'calendar';
      default: return 'help-circle';
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const colors = getHealthScoreColors(healthScore);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-gray-600">Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-6 pt-12">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0077B6']}
            tintColor="#0077B6"
          />
        }
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-[#0077B6]">
            Welcome back, {username}
          </Text>
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
              <Ionicons 
                name="refresh" 
                size={24} 
                color={refreshing ? "#ccc" : "#0077B6"} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={26} color="#0077B6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Health Score */}
        <View className="items-center mb-6">
          <View
            className="w-24 h-24 rounded-full items-center justify-center"
            style={{
              backgroundColor: colors.bg,
              borderWidth: 2,
              borderColor: colors.border,
            }}
          >
            <Text className="text-2xl font-bold text-black mb-1">{healthScore}</Text>
            <Text className="text-xs text-black text-center px-2 leading-tight">
              {getHealthScoreDescription(healthScore)}
            </Text>
          </View>
          <Text className="text-base text-gray-600 mt-2">Overall Health Score</Text>
        </View>

        {/* Check-in Today Badge */}
        {checkedInToday && (
          <View className="bg-green-100 border border-green-500 rounded-lg p-3 mb-5">
            <Text className="text-green-700 text-center font-semibold">
              ✅ You’ve already checked in today!
            </Text>
          </View>
        )}

        {/* Daily Health Check-In */}
        <Text className="text-xl font-semibold mb-3 text-[#0077B6]">
          Daily Health Check-In
        </Text>

        {/* Sliders */}
        {[
          { label: "Energy Level", key: "energyLevel", max: 5 },
          { label: "Pain Level", key: "painLevel", max: 5 },
          { label: "Diet Quality", key: "dietQuality", max: 5 },
          { label: "Sleep Quality", key: "sleepQuality", max: 5 },
        ].map((item, idx) => (
          <View key={idx} className="mb-4">
            <Text className="font-medium mb-1">{item.label}</Text>
            <Slider
              minimumValue={0}
              maximumValue={item.max}
              step={1}
              value={Math.min(Math.max(healthCheck[item.key as keyof HealthCheck], 0), item.max)}
              minimumTrackTintColor="#0077B6"
              thumbTintColor="#0077B6"
              onValueChange={(v: number) => {
                const clampedValue = Math.min(Math.max(v, 0), item.max);
                setHealthCheck({
                  ...healthCheck,
                  [item.key]: clampedValue,
                });
              }}
            />
            <Text>
              Current: {Math.min(Math.max(healthCheck[item.key as keyof HealthCheck], 0), item.max)}
            </Text>
          </View>
        ))}

        {/* Notes */}
        <View className="mb-4">
          <Text className="font-medium mb-1">Additional Notes</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-2"
            placeholder="Any thoughts or comments..."
            multiline
            value={additionalThoughts}
            onChangeText={setAdditionalThoughts}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          disabled={checkedInToday}
          onPress={handleSubmitCheckin}
          className={`${checkedInToday ? "bg-gray-400" : "bg-[#0077B6]"
            } rounded-lg w-[160px] py-2 items-center mb-8 self-center`}
        >
          <Text className="text-white font-semibold text-lg">
            {checkedInToday ? "Checked-in Today" : "Submit Check-in"}
          </Text>
        </TouchableOpacity>

        {/* Medication Tracking Section */}
        <View className="mb-6">
          <Text className="text-xl font-semibold mb-4 text-[#0077B6]">
            📋 Medication Tracking
          </Text>

          {/* Past Medications */}
          <View className="mb-4">
            <Text className="text-lg font-medium mb-3 text-gray-700">
              Recent Medications
            </Text>
            {getPastMedications().length > 0 ? (
              <View className="space-y-2">
                {getPastMedications().slice(-6).map((record) => (
                  <View
                    key={record.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex-row items-center justify-between"
                  >
                    <View className="flex-1">
                      <Text className="font-medium text-gray-800">
                        {record.medicationName}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {formatDate(record.scheduledDate)} at {formatTime(record.scheduledTime)}
                      </Text>
                      {record.takenAt && (
                        <Text className="text-xs text-gray-500">
                          Taken at {new Date(record.takenAt).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </Text>
                      )}
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons
                        name={getStatusIcon(record.status)}
                        size={20}
                        color={getStatusColor(record.status)}
                      />
                      <Text
                        className="ml-2 text-sm font-medium"
                        style={{ color: getStatusColor(record.status) }}
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <Text className="text-gray-600 text-center">
                  No recent medication records
                </Text>
              </View>
            )}
          </View>

          {/* Upcoming Medications */}
          <View className="mb-4">
            <Text className="text-lg font-medium mb-3 text-gray-700">
              Upcoming Medications
            </Text>
            {getUpcomingMedications().length > 0 ? (
              <View className="space-y-2">
                {getUpcomingMedications().slice(0, 6).map((record) => (
                  <View
                    key={record.id}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex-row items-center justify-between"
                  >
                    <View className="flex-1">
                      <Text className="font-medium text-gray-800">
                        {record.medicationName}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {formatDate(record.scheduledDate)} at {formatTime(record.scheduledTime)}
                      </Text>
                      {record.status === 'pending' && (
                        <Text className="text-xs text-orange-600 font-medium">
                          Due now
                        </Text>
                      )}
                    </View>
                    <View className="flex-row items-center">
                      {record.status === 'pending' ? (
                        <TouchableOpacity
                          onPress={() => markMedicationAsTaken(record.id)}
                          className="bg-green-500 px-3 py-1 rounded-full"
                        >
                          <Text className="text-white text-xs font-medium">
                            Mark Taken
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <Ionicons
                            name={getStatusIcon(record.status)}
                            size={20}
                            color={getStatusColor(record.status)}
                          />
                          <Text
                            className="ml-2 text-sm font-medium"
                            style={{ color: getStatusColor(record.status) }}
                          >
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Text className="text-gray-600 text-center">
                  No upcoming medications scheduled
                </Text>
              </View>
            )}
          </View>

          {/* Medication Summary */}
          <View className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
            <Text className="text-lg font-semibold mb-2 text-gray-800">
              📊 Medication Summary
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">
                  {getPastMedications().filter(r => r.status === 'taken').length}
                </Text>
                <Text className="text-sm text-gray-600">Taken</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-red-600">
                  {getPastMedications().filter(r => r.status === 'missed').length}
                </Text>
                <Text className="text-sm text-gray-600">Missed</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-600">
                  {getUpcomingMedications().length}
                </Text>
                <Text className="text-sm text-gray-600">Upcoming</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Medication Management Section */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semibold text-[#0077B6]">
              💊 My Medications
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddMedication(!showAddMedication)}
              className="bg-[#0077B6] px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-semibold">
                {showAddMedication ? "Cancel" : "Add Medication"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add Medication Form */}
          {showAddMedication && (
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <Text className="text-lg font-semibold mb-3 text-gray-800">Add New Medication</Text>
              
              <TextInput
                placeholder="Medication Name *"
                value={newMedication.name}
                onChangeText={(text) => setNewMedication({...newMedication, name: text})}
                className="border border-gray-300 rounded-lg p-3 mb-3 bg-white"
              />
              
              <TextInput
                placeholder="Dosage (e.g., 500mg) *"
                value={newMedication.dosage}
                onChangeText={(text) => setNewMedication({...newMedication, dosage: text})}
                className="border border-gray-300 rounded-lg p-3 mb-3 bg-white"
              />
              
              <TextInput
                placeholder="Frequency (e.g., Twice daily) *"
                value={newMedication.frequency}
                onChangeText={(text) => setNewMedication({...newMedication, frequency: text})}
                className="border border-gray-300 rounded-lg p-3 mb-3 bg-white"
              />
              
              <TextInput
                placeholder="Times (e.g., 08:00,20:00)"
                value={newMedication.times.join(',')}
                onChangeText={(text) => setNewMedication({...newMedication, times: text.split(',').filter(t => t.trim())})}
                className="border border-gray-300 rounded-lg p-3 mb-3 bg-white"
              />
              
              <TextInput
                placeholder="Start Date (YYYY-MM-DD) *"
                value={newMedication.startDate}
                onChangeText={(text) => setNewMedication({...newMedication, startDate: text})}
                className="border border-gray-300 rounded-lg p-3 mb-3 bg-white"
              />
              
              <TextInput
                placeholder="End Date (YYYY-MM-DD) - Optional"
                value={newMedication.endDate}
                onChangeText={(text) => setNewMedication({...newMedication, endDate: text})}
                className="border border-gray-300 rounded-lg p-3 mb-3 bg-white"
              />
              
              <TextInput
                placeholder="Instructions (Optional)"
                value={newMedication.instructions}
                onChangeText={(text) => setNewMedication({...newMedication, instructions: text})}
                multiline
                className="border border-gray-300 rounded-lg p-3 mb-3 bg-white"
              />
              
              <TouchableOpacity
                onPress={handleAddMedication}
                className="bg-green-600 p-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">Add Medication</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Current Medications List */}
          <View className="space-y-3">
            {medications.length > 0 ? (
              medications.map((medication) => (
                <View
                  key={medication.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-800">
                        {medication.name}
                      </Text>
                      <Text className="text-gray-600">
                        {medication.dosage} - {medication.frequency}
                      </Text>
                      {medication.times && medication.times.length > 0 && (
                        <Text className="text-sm text-gray-500">
                          Times: {medication.times.join(', ')}
                        </Text>
                      )}
                      {medication.instructions && (
                        <Text className="text-sm text-gray-500 mt-1">
                          Instructions: {medication.instructions}
                        </Text>
                      )}
                      <View className="flex-row mt-2">
                        <View className="bg-green-100 px-2 py-1 rounded mr-2">
                          <Text className="text-green-800 text-xs">
                            Taken: {medication.takenCount || 0}
                          </Text>
                        </View>
                        <View className="bg-red-100 px-2 py-1 rounded">
                          <Text className="text-red-800 text-xs">
                            Missed: {medication.missedCount || 0}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveMedication(medication.id)}
                      className="bg-red-500 px-3 py-1 rounded-lg ml-2"
                    >
                      <Text className="text-white text-sm font-medium">Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <Text className="text-gray-600 text-center">
                  No medications added yet. Add your first medication above!
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Dashboard;

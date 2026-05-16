import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Alert, Clipboard, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { storage } from '../../config/storage';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import "../../global.css";

interface CaretakerData {
    fullName: string;
    email: string;
    contact: string;
    caretakerId: string;
    professionalRole: string;
    organization: string;
    specializations: string[];
    experienceYears: number;
    linkedPatients: any[];
}

export default function CaretakerProfileScreen() {
    const router = useRouter();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userData, setUserData] = useState<CaretakerData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const token = await storage.getItem('caretakerToken');

            if (!token) {
                Alert.alert('Error', 'Please login as a caretaker');
                router.back();
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/api/caretaker/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUserData(response.data as CaretakerData);
        } catch (error: any) {
            console.error('Error loading user data:', error);
            Alert.alert('Error', 'Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            if (userData?.caretakerId) {
                await Clipboard.setString(userData.caretakerId);
                Alert.alert("Copied!", "Caretaker ID copied to clipboard");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to copy to clipboard");
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "New passwords don't match");
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return;
        }

        try {
            const token = await storage.getItem('caretakerToken');
            await axios.post(`${API_BASE_URL}/api/caretaker/change-password`, {
                currentPassword,
                newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert("Success", "Password changed successfully");
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to change password");
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Clear all stored tokens
                            await storage.removeItem('patientToken');
                            await storage.removeItem('patientID');
                            await storage.removeItem('caretakerToken');
                            await storage.removeItem('caretakerID');

                            // Redirect to profile selection page
                            router.replace('/');
                        } catch (error) {
                            console.error('Error during logout:', error);
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const PasswordModal = () => (
        <Modal
            visible={showPasswordModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowPasswordModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Change Password</Text>

                    <View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Current Password</Text>
                            <TextInput
                                style={styles.textInput}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Enter current password"
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>New Password</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Enter new password"
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Confirm New Password</Text>
                            <TextInput
                                style={styles.textInput}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm new password"
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowPasswordModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.changeButton}
                            onPress={handleChangePassword}
                        >
                            <Text style={styles.changeButtonText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.topNavigation}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.spacer} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0077B6" />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Top Navigation */}
            <View style={styles.topNavigation}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.spacer} />
            </View>

            {/* User Profile Header */}
            <View style={styles.profileHeader}>
                <View style={styles.profileInfo}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={32} color="white" />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userData?.fullName || 'Loading...'}</Text>
                        <Text style={styles.userRole}>Healthcare Professional</Text>
                    </View>
                    <TouchableOpacity style={styles.editButton}>
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Caretaker ID Card */}
            <View style={styles.cardContainer}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Your DigiNurse Caretaker ID</Text>
                    <View style={styles.patientIdRow}>
                        <Text style={styles.patientId}>{userData?.caretakerId || 'Loading...'}</Text>
                        <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                            <Ionicons name="copy-outline" size={24} color="#3B82F6" />
                            <Text style={styles.copyText}>Copy to Clipboard</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Account Information Card */}
            <View style={styles.cardContainer}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Account Information</Text>

                    <View>
                        <View style={styles.passwordRow}>
                            <Text style={styles.infoText}>Password: ********</Text>
                            <TouchableOpacity
                                style={styles.changePasswordButton}
                                onPress={() => setShowPasswordModal(true)}
                            >
                                <Text style={styles.changePasswordText}>Change Password</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoText}>Email: {userData?.email || 'Loading...'}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoText}>Phone Number: {userData?.contact || 'Not provided'}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoText}>
                                Patient Connections: <Text style={styles.linkText}>
                                    {userData?.linkedPatients?.length || 0} Patients
                                </Text>
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Professional Information Card */}
            <View style={styles.cardContainer}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Professional Information</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoText}>Role: {userData?.professionalRole || 'Not specified'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoText}>Organization: {userData?.organization || 'Not specified'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoText}>Experience: {userData?.experienceYears || 0} years</Text>
                    </View>

                    {userData?.specializations && userData.specializations.length > 0 && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoText}>
                                Specializations: {userData.specializations.join(', ')}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Logout Button */}
            <View style={styles.logoutContainer}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Password Change Modal */}
            <PasswordModal />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    topNavigation: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    spacer: {
        flex: 1,
    },
    profileHeader: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        backgroundColor: '#0077B6',
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    userRole: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 4,
    },
    editButton: {
        borderWidth: 1,
        borderColor: '#0077B6',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    editButtonText: {
        color: '#0077B6',
        fontWeight: '500',
    },
    cardContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
    },
    cardTitle: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 8,
        fontWeight: '600',
    },
    patientIdRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    patientId: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    copyButton: {
        alignItems: 'center',
    },
    copyText: {
        color: '#0077B6',
        fontSize: 12,
        marginTop: 4,
    },
    infoRow: {
        marginBottom: 12,
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#374151',
    },
    linkText: {
        color: '#0077B6',
    },
    changePasswordButton: {
        borderWidth: 1,
        borderColor: '#0077B6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    changePasswordText: {
        color: '#0077B6',
        fontSize: 14,
    },
    logoutContainer: {
        paddingHorizontal: 16,
        marginTop: 'auto',
        marginBottom: 32,
    },
    logoutButton: {
        backgroundColor: '#EF4444',
        borderWidth: 1,
        borderColor: '#DC2626',
        borderRadius: 8,
        paddingVertical: 16,
    },
    logoutText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 18,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 320,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: 'white',
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: 24,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
        marginRight: 8,
    },
    cancelButtonText: {
        textAlign: 'center',
        fontWeight: '500',
        color: '#374151',
    },
    changeButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#0077B6',
        borderRadius: 8,
        marginLeft: 8,
    },
    changeButtonText: {
        textAlign: 'center',
        fontWeight: '500',
        color: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#374151',
        marginTop: 16,
    },
});

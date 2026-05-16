import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { storage } from '../../config/storage';
import "../../global.css";

interface Appointment {
    _id: string;
    date: string;
    time: string;
    doctor: string;
    clinic: string;
    status: 'attended' | 'upcoming' | 'missed' | 'completed' | 'cancelled';
    notes?: string;
    purpose?: string;
    appointmentType?: 'doctor' | 'caregiver' | 'other';
}

interface PatientProfile {
    _id: string;
    fullName: string;
    email: string;
    patientID: string;
    scheduledVisits: Array<{
        _id: string;
        doctorId: {
            _id: string;
            fullName: string;
            specialization: string;
            hospitalName: string;
        };
        date: string;
        time: string;
        purpose: string;
        notes: string;
        status: string;
    }>;
    linkedDoctors: Array<{
        _id: string;
        fullName: string;
        specialization: string;
        hospitalName: string;
    }>;
}

export default function EnhancedCalendar() {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAppointments = async () => {
        try {
            const token = await storage.getItem('patientToken');
            if (!token) {
                console.error('No patient token found');
                setLoading(false);
                return;
            }

            const response = await axios.get<PatientProfile>(
                `${API_BASE_URL}/api/patient/profile`,
                { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
            );

            const appointmentsData: Appointment[] = (response.data.scheduledVisits || []).map(visit => {
                const doctor = visit.doctorId;
                return {
                    _id: visit._id,
                    date: new Date(visit.date).toISOString().split('T')[0],
                    time: visit.time,
                    doctor: doctor?.fullName || 'Unknown Doctor',
                    clinic: doctor?.hospitalName || 'Unknown Clinic',
                    status: visit.status as Appointment['status'],
                    notes: visit.notes,
                    purpose: visit.purpose,
                    appointmentType: 'doctor'
                };
            });

            setAppointments(appointmentsData);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay() };
    };

    const formatDateKey = (year: number, month: number, day: number) =>
        `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const getAppointmentsForDate = (dateString: string) =>
        appointments.filter(apt => apt.date === dateString);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'attended':
            case 'completed': return { bg: '#DEF7EC', text: '#065F46', dot: '#10B981', label: status === 'completed' ? 'Completed' : 'Attended', icon: 'checkmark-circle' as const };
            case 'upcoming': return { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Upcoming', icon: 'time' as const };
            case 'missed':
            case 'cancelled': return { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', label: status === 'cancelled' ? 'Cancelled' : 'Missed', icon: 'close-circle' as const };
            default: return { bg: '#F3F4F6', text: '#374151', dot: '#6B7280', label: status, icon: 'help-circle' as const };
        }
    };

    const changeMonth = (offset: number) =>
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));

    const renderCalendar = () => {
        const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const today = new Date();
        const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
        const cells: React.ReactNode[] = [];

        // Empty cells for days before the month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            cells.push(<View key={`empty-${i}`} className="w-[14.28%] h-12" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = formatDateKey(year, month, day);
            const dayAppointments = getAppointmentsForDate(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;

            cells.push(
                <TouchableOpacity
                    key={day}
                    onPress={() => setSelectedDate(dateStr)}
                    className="w-[14.28%] h-12 items-center justify-center"
                >
                    <View className={`w-9 h-9 rounded-full items-center justify-center ${isSelected ? 'bg-[#0077B6]' : isToday ? 'border-2 border-[#0077B6]' : ''}`}>
                        <Text className={`text-sm font-medium ${isSelected ? 'text-white' : isToday ? 'text-[#0077B6]' : 'text-gray-700'}`}>
                            {day}
                        </Text>
                    </View>
                    {dayAppointments.length > 0 && (
                        <View className="flex-row mt-0.5">
                            {dayAppointments.slice(0, 3).map((apt, idx) => (
                                <View
                                    key={idx}
                                    className="w-1.5 h-1.5 rounded-full mx-0.5"
                                    style={{ backgroundColor: getStatusStyle(apt.status).dot }}
                                />
                            ))}
                        </View>
                    )}
                </TouchableOpacity>
            );
        }
        return cells;
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#0077B6" />
                <Text className="mt-4 text-gray-600">Loading appointments...</Text>
            </View>
        );
    }

    const selectedAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];
    const formattedSelectedDate = selectedDate
        ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : '';

    return (
        <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 30 }}>
            {/* Header */}
            <View className="px-6 pt-12 pb-4">
                <View className="flex-row items-center mb-2">
                    <View className="w-10 h-10 bg-[#0077B6] rounded-xl items-center justify-center mr-3">
                        <Ionicons name="calendar" size={20} color="white" />
                    </View>
                    <View>
                        <Text className="text-xl font-bold text-gray-800">Appointment Calendar</Text>
                        <Text className="text-xs text-gray-500">View and manage your appointments</Text>
                    </View>
                </View>

                {/* Legend */}
                <View className="flex-row flex-wrap mt-3 pt-3 border-t border-gray-200">
                    {[
                        { color: '#10B981', label: 'Attended' },
                        { color: '#F59E0B', label: 'Upcoming' },
                        { color: '#EF4444', label: 'Missed' },
                        { color: '#0077B6', label: 'Doctor' },
                    ].map((item) => (
                        <View key={item.label} className="flex-row items-center mr-4 mb-1">
                            <View className="w-2.5 h-2.5 rounded-full mr-1" style={{ backgroundColor: item.color }} />
                            <Text className="text-xs text-gray-600">{item.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Calendar */}
            <View className="mx-6 bg-white rounded-xl border border-gray-200 p-4">
                {/* Month Navigation */}
                <View className="flex-row items-center justify-between mb-4">
                    <TouchableOpacity onPress={() => changeMonth(-1)} className="p-2">
                        <Ionicons name="chevron-back" size={20} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-gray-800">
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                    <TouchableOpacity onPress={() => changeMonth(1)} className="p-2">
                        <Ionicons name="chevron-forward" size={20} color="#374151" />
                    </TouchableOpacity>
                </View>

                {/* Day Headers */}
                <View className="flex-row mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <View key={day} className="w-[14.28%] items-center">
                            <Text className="text-xs font-semibold text-gray-500">{day}</Text>
                        </View>
                    ))}
                </View>

                {/* Calendar Grid */}
                <View className="flex-row flex-wrap">
                    {renderCalendar()}
                </View>
            </View>

            {/* Appointment Details for Selected Date */}
            {selectedDate && (
                <View className="mx-6 mt-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-lg font-semibold text-gray-800">
                            {formattedSelectedDate}
                        </Text>
                        <TouchableOpacity onPress={() => setSelectedDate(null)}>
                            <Ionicons name="close-circle" size={24} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {selectedAppointments.length === 0 ? (
                        <View className="bg-gray-50 rounded-xl p-6 items-center">
                            <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
                            <Text className="text-sm font-semibold text-gray-600 mt-2">No Appointments</Text>
                            <Text className="text-xs text-gray-400 mt-1">Nothing scheduled for this date</Text>
                        </View>
                    ) : (
                        selectedAppointments.map((apt, idx) => {
                            const statusStyle = getStatusStyle(apt.status);
                            return (
                                <View key={idx} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
                                    {/* Status Badge */}
                                    <View className="flex-row items-center justify-between mb-3">
                                        <View className="flex-row items-center">
                                            <Ionicons name={statusStyle.icon} size={16} color={statusStyle.dot} />
                                            <Text className="text-xs font-semibold ml-1" style={{ color: statusStyle.text }}>
                                                {statusStyle.label}
                                            </Text>
                                        </View>
                                        <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                                            <Text className="text-xs font-medium text-gray-700">{apt.time}</Text>
                                        </View>
                                    </View>

                                    {/* Doctor */}
                                    <View className="flex-row items-start mb-2">
                                        <Ionicons name="person-outline" size={14} color="#9CA3AF" style={{ marginTop: 2 }} />
                                        <View className="ml-2">
                                            <Text className="text-xs text-gray-500">Doctor</Text>
                                            <Text className="text-sm font-semibold text-gray-800">{apt.doctor}</Text>
                                        </View>
                                    </View>

                                    {/* Location */}
                                    <View className="flex-row items-start mb-2">
                                        <Ionicons name="location-outline" size={14} color="#9CA3AF" style={{ marginTop: 2 }} />
                                        <View className="ml-2">
                                            <Text className="text-xs text-gray-500">Location</Text>
                                            <Text className="text-sm font-semibold text-gray-800">{apt.clinic}</Text>
                                        </View>
                                    </View>

                                    {/* Purpose */}
                                    {apt.purpose && (
                                        <View className="mt-2 p-2 rounded-md" style={{ backgroundColor: '#EFF6FF' }}>
                                            <Text className="text-xs text-[#0077B6]">
                                                <Text className="font-semibold">Purpose: </Text>{apt.purpose}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Status-specific messages */}
                                    {apt.status === 'upcoming' && (
                                        <View className="mt-2 p-2 rounded-md flex-row items-start" style={{ backgroundColor: '#FEF3C7' }}>
                                            <Ionicons name="alert-circle" size={14} color="#92400E" style={{ marginTop: 1 }} />
                                            <Text className="text-xs ml-1" style={{ color: '#92400E', flex: 1 }}>
                                                Don't forget your appointment. Arrive 10 minutes early.
                                            </Text>
                                        </View>
                                    )}

                                    {(apt.status === 'attended' || apt.status === 'completed') && (
                                        <View className="mt-2 p-2 rounded-md" style={{ backgroundColor: '#DEF7EC' }}>
                                            <Text className="text-xs" style={{ color: '#065F46' }}>
                                                ✓ {apt.notes || 'Appointment completed successfully'}
                                            </Text>
                                        </View>
                                    )}

                                    {(apt.status === 'missed' || apt.status === 'cancelled') && (
                                        <View className="mt-2 p-2 rounded-md flex-row items-start" style={{ backgroundColor: '#FEE2E2' }}>
                                            <Ionicons name="alert-circle" size={14} color="#991B1B" style={{ marginTop: 1 }} />
                                            <Text className="text-xs ml-1" style={{ color: '#991B1B', flex: 1 }}>
                                                {apt.status === 'cancelled'
                                                    ? 'This appointment was cancelled.'
                                                    : 'You missed this appointment. Contact the clinic to reschedule.'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>
            )}
        </ScrollView>
    );
}
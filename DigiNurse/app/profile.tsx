import React from 'react';
import { ProfilePage } from '@/components/profile-page';
import { useRouter } from 'expo-router';
import "../global.css"
export default function ProfileScreen() {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return <ProfilePage onBack={handleBack} />;
}

import { Stack } from 'expo-router';

export default function ScreensLayout() {
    return (
        <Stack>
            <Stack.Screen name="patient-chat" options={{ headerShown: false }} />
            <Stack.Screen name="caretaker-chat" options={{ headerShown: false }} />
            <Stack.Screen name="patient-profile" options={{ headerShown: false }} />
            <Stack.Screen name="caretaker-profile" options={{ headerShown: false }} />
        </Stack>
    );
}

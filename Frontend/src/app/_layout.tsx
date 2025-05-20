import { Stack } from 'expo-router';
import { AuthProvider } from '@/hooks/auth';
import React from 'react';

export default function RootLayout() {
  return (
    <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
    </AuthProvider>
  );
}
import { Stack } from 'expo-router';
import { AuthProvider } from '@/hooks/auth';
import React from 'react';
import { ProductProvider } from '@/hooks/product';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProductProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ProductProvider>
    </AuthProvider>
  );
}
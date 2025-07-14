import { Stack } from 'expo-router';
import { AuthProvider } from '@/hooks/auth';
import React from 'react';
import { ProductProvider } from '@/hooks/product';
import { UserProvider } from '@/hooks/user';
import { UserLevelProvider } from '@/hooks/userLevel';

export default function RootLayout() {
  return (
    <AuthProvider>
      <UserProvider>
        <UserLevelProvider>
          <ProductProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="shop" />
              <Stack.Screen name="game" />
            </Stack>
          </ProductProvider>
        </UserLevelProvider>
      </UserProvider>
    </AuthProvider>
  );
}
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/hooks/auth';
import React, { useEffect } from 'react';
import { ProductProvider } from '@/hooks/product';
import { UserProvider } from '@/hooks/user';
import { UserLevelProvider } from '@/hooks/userLevel';
import { setAuthErrorCallback } from '@/utils/fetch';

function AppWithAuthCallback({ children }: { children: React.ReactNode }) {
  const { handleAuthError } = useAuth();

  useEffect(() => {
    setAuthErrorCallback(handleAuthError);
  }, [handleAuthError]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <UserProvider>
        <UserLevelProvider>
          <ProductProvider>
            <AppWithAuthCallback>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="shop" />
                <Stack.Screen name="game" />
              </Stack>
            </AppWithAuthCallback>
          </ProductProvider>
        </UserLevelProvider>
      </UserProvider>
    </AuthProvider>
  );
}
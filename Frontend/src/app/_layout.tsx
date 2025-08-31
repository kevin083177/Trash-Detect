import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/hooks/auth';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { ProductProvider } from '@/hooks/product';
import { UserProvider } from '@/hooks/user';
import { UserLevelProvider } from '@/hooks/userLevel';
import { setAuthErrorCallback } from '@/utils/fetch';
import { VoucherProvider } from '@/hooks/voucher';

function AppWithAuthCallback({ children }: { children: React.ReactNode }) {
  const { handleAuthError } = useAuth();

  useEffect(() => {
    setAuthErrorCallback(handleAuthError);
  }, [handleAuthError]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <>
      <StatusBar 
        translucent={false} 
        barStyle={'light-content'}
        backgroundColor={'#1C1C1C'}
      />
      <AuthProvider>
        <UserProvider>
          <UserLevelProvider>
            <ProductProvider>
              <VoucherProvider>
                <AppWithAuthCallback>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                  </Stack>
                </AppWithAuthCallback>
              </VoucherProvider>
            </ProductProvider>
          </UserLevelProvider>
        </UserProvider>
      </AuthProvider>
    </>
  );
}
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/hooks/auth';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { ProductProvider } from '@/hooks/product';
import { UserProvider } from '@/hooks/user';
import { UserLevelProvider } from '@/hooks/userLevel';
import { ThemeProvider, useTheme } from '@/hooks/theme';
import { setAuthErrorCallback } from '@/utils/fetch';

function AppWithAuthCallback({ children }: { children: React.ReactNode }) {
  const { handleAuthError } = useAuth();

  useEffect(() => {
    setAuthErrorCallback(handleAuthError);
  }, [handleAuthError]);

  return <>{children}</>;
}

function ThemedStatusBar() {
  const { isDark } = useTheme();

  return (
    <StatusBar 
      translucent={false} 
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor={isDark ? '#000000' : '#ffffff'}
    />
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedStatusBar />
      <AuthProvider>
        <UserProvider>
          <UserLevelProvider>
            <ProductProvider>
              <AppWithAuthCallback>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                </Stack>
              </AppWithAuthCallback>
            </ProductProvider>
          </UserLevelProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
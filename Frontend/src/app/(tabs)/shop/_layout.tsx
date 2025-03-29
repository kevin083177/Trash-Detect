import React from 'react-native';
import { Stack, useGlobalSearchParams } from 'expo-router';

export default function ShopLayout() {
  const { theme } = useGlobalSearchParams();
  const decodedTheme = decodeURIComponent(theme as string);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index"/>
      <Stack.Screen 
        name="theme" 
        options={{
            headerShown: true,
            title: decodedTheme,
        }}
      />
    </Stack>
  );
}
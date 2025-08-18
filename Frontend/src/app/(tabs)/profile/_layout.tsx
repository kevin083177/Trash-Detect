import React from 'react-native';
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" />
      <Stack.Screen name='verification' />
      <Stack.Screen name='feedback' />
      <Stack.Screen name='create' />
      <Stack.Screen name='voucher' />
    </Stack>
  );
}
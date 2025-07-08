import React from 'react-native';
import { Stack } from 'expo-router';

export default function BackpackLayout() {

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index"/>
    </Stack>
  );
}
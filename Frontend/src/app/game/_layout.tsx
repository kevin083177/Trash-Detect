import React from 'react';
import { Stack } from 'expo-router';

export default function GameLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="gameplay" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
import React from 'react-native';
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="settings" 
        options={{
            headerShown: true,
            title: '個人設定',
            headerBackTitle: '返回'
        }}
      />
    </Stack>
  );
}
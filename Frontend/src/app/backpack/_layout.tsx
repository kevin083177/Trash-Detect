import React from 'react-native';
import { Stack } from 'expo-router';

export default function BackpackLayout() {

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index"
        options={{ title: "家具布置" }}/>
    </Stack>
  );
}
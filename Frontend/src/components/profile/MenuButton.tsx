import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MenuButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  isDark: boolean;
  onPress: () => void;
}

export default function MenuButton({ icon, title, isDark, onPress }: MenuButtonProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={22} color={isDark ? "#fff" : "#aaa"} />
      </View>
      <Text style={[styles.title, { color: isDark ? "#fff" : "#f87000ff" }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 95,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ControlButtonProps {
  iconOn: keyof typeof Ionicons.glyphMap;
  iconOff: keyof typeof Ionicons.glyphMap;
  status: boolean;
  name: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const ControlButton: React.FC<ControlButtonProps> = ({ 
  iconOn, 
  iconOff, 
  status, 
  name,
  onPress, 
  style 
}) => {
  const iconName = status ? iconOn : iconOff;
  const iconColor = status ? '#ffcc00' : '#ffffff';

  return (
    <TouchableOpacity 
      style={[styles.button, style]}
      onPress={onPress}
    >
      <Ionicons 
        name={iconName} 
        size={24}
        color={iconColor} 
      />
      <Text style={[styles.text, {color: iconColor}]}>{name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 70,
    height: 70,
    borderRadius: 70,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 11,
    textAlign: 'center',
  }
});
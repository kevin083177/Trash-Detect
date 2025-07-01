import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ControlButtonProps {
  type: 'auto' | 'torch' | 'bounding';
  status: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const ControlButton: React.FC<ControlButtonProps> = ({ 
  type, 
  status, 
  onPress, 
  style 
}) => {
  const getButtonConfig = () => {
    switch (type) {
      case 'auto':
        return {
          iconName: 'scan' as keyof typeof Ionicons.glyphMap,
        };
      case 'torch':
        return {
          iconName: status ? 'flashlight' : 'flashlight-outline' as keyof typeof Ionicons.glyphMap,
        };
      case 'bounding':
        return {
          iconName: status ? 'color-palette-sharp' : 'color-palette-outline' as keyof typeof Ionicons.glyphMap,
        };
    }
  };

  const config = getButtonConfig();
  const iconColor = status ? '#ffcc00' : '#ffffff';

  return (
    <TouchableOpacity 
      style={[styles.button, style]}
      onPress={onPress}
    >
      <Ionicons 
        name={config.iconName} 
        size={20} 
        color={iconColor} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginHorizontal: 8,
  },
});
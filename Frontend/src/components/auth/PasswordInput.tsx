import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  value: string;
  onChangeText: (text: string) => void;
  hasError?: boolean;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChangeText,
  style,
  hasError = false,
  label,
  icon,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const getInputBorderColor = () => {
    if (hasError) return '#DC3545';
    if (isFocused) return '#007AFF';
    return '#E5E7EB';
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          {icon && (
            <Ionicons name={icon} size={16} color="#6B7280" />
          )}
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
      <View style={styles.passwordContainer}>
        <TextInput
          {...props}
          style={[
            styles.passwordInput,
            { 
              borderColor: getInputBorderColor(),
              backgroundColor: '#F9FAFB'
            },
            style
          ]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#9CA3AF"
        />
        {value.length > 0 && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={22}
              color="#6B7280"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    height: 50,
    paddingHorizontal: 16,
    paddingRight: 40,
    borderWidth: 1.5,
    borderRadius: 8,
    fontSize: 15,
    color: '#111827',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});

export default PasswordInput;
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ClearableInputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  containerStyle?: object;
  inputStyle?: object;
  hasError?: boolean;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const ClearableInput: React.FC<ClearableInputProps> = ({
  value,
  onChangeText,
  onClear,
  containerStyle,
  inputStyle,
  hasError = false,
  label,
  icon,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getInputBorderColor = () => {
    if (hasError) return '#DC3545';
    if (isFocused) return '#007AFF';
    return '#E5E7EB';
  };

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          {icon && (
            <Ionicons name={icon} size={16} color="#6B7280" />
          )}
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          {...textInputProps}
          style={[
            styles.input,
            { 
              borderColor: getInputBorderColor(),
              backgroundColor: '#F9FAFB'
            },
            inputStyle
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#9CA3AF"
        />
        {value.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
          >
            <Ionicons name="close-outline" size={20} color="#9CA3AF" />
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
  inputContainer: {
    position: 'relative',
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    paddingRight: 40,
    borderWidth: 1.5,
    borderRadius: 8,
    fontSize: 15,
    color: '#111827',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});

export default ClearableInput;
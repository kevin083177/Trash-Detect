import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ClearableInputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  containerStyle?: object;
  inputStyle?: object;
  hasError?: boolean;
}

const ClearableInput: React.FC<ClearableInputProps> = ({
  value,
  onChangeText,
  onClear,
  containerStyle,
  inputStyle,
  hasError = false,
  ...textInputProps
}) => {
  const getInputBorderColor = (value: string, hasError: boolean) => {
    if (hasError) return '#DC3545';  // 錯誤時為紅色
    if (!value) return '#ddd';       // 未輸入時為灰色
    return '#007AFF';                // 有輸入時為藍色
  };

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      <TextInput
        {...textInputProps}
        style={[
          styles.input,
          { borderColor: getInputBorderColor(value, hasError) },
          inputStyle
        ]}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
        >
          <Ionicons name="close-circle" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    height: 50,
    paddingRight: 40, 
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
});

export default ClearableInput;
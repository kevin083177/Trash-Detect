import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  value: string;
  onChangeText: (text: string) => void;
  hasError?: boolean;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChangeText,
  style,
  hasError = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const getInputBorderColor = (value: string, hasError: boolean) => {
    if (hasError) return '#DC3545';  // 錯誤時為紅色
    if (!value) return '#ddd';       // 未輸入時為灰色
    return '#007AFF';                // 有輸入時為藍色
  };

  return (
    <View style={styles.passwordContainer}>
      <TextInput
        {...props}
        style={[
          styles.passwordInput,
          { borderColor: getInputBorderColor(value, hasError) },
          style
        ]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
      />
      {value.length > 0 && (
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingRight: 40, 
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
});

export default PasswordInput;
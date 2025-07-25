import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/auth';
import PasswordInput from '@/components/auth/PasswordInput';
import ClearableInput from '@/components/auth/ClearableInput';

type ErrorFields = {
  email?: boolean;
  password?: boolean;
};

export default function Login() {
  const { email: initialEmail } = useLocalSearchParams<{ email: string }>();
  const [email, setEmail] = useState<string>(initialEmail || '');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorFields, setErrorFields] = useState<ErrorFields>({});
  
  const { login, isLoading } = useAuth();

  const validateForm = () => {
    const newErrorFields: ErrorFields = {};
    
    if (!email) {
      setErrorMessage('請輸入電子郵件');
      newErrorFields.email = true;
      setErrorFields(newErrorFields);
      return false;
    }

    if (!password) {
      setErrorMessage('請輸入密碼');
      newErrorFields.password = true;
      setErrorFields(newErrorFields);
      return false;
    }

    setErrorFields({});
    setErrorMessage('');
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    const result = await login(email, password);
    
    if (!result.success) {
      setErrorMessage(result.message);
      setErrorFields(result.errorFields || {});
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>登入</Text>
      
      <ClearableInput
        placeholder="電子郵件"
        autoCapitalize="none"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setErrorFields({});
          setErrorMessage('');
        }}
        keyboardType="email-address"
        editable={!isLoading}
        hasError={errorFields.email}
      />
      
      <PasswordInput
        placeholder="密碼"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setErrorFields({});
          setErrorMessage('');
        }}
        editable={!isLoading}
        hasError={errorFields.password}
      />
      {errorFields.password &&
        <Link href="/forget" style={styles.forgetLink}>
          忘記密碼？
        </Link>
      }

      {errorMessage && 
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      }

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? '登入中...' : '登入'}
        </Text>
      </TouchableOpacity>
      
      {!isLoading &&
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>還沒有帳號？</Text>
          <Link href="/register" style={styles.link}>
            立即註冊
          </Link>
        </View>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginTop: 20,
  },
  registerText: {
    color: '#666'
  },
  link: {
    color: '#007AFF',
  },
  forgetLink: {
    textAlign: 'left',
    color: '#007AFF',
    marginLeft: 4,
    marginBottom: 15,
  }
});
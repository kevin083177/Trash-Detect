import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/auth';
import PasswordInput from '@/components/auth/PasswordInput';
import ClearableInput from '@/components/auth/ClearableInput';

type ErrorFields = {
  username?: boolean;
  email?: boolean;
  password?: boolean;
  confirmPassword?: boolean;
};

export default function Register() {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorFields, setErrorFields] = useState<ErrorFields>({});

  const { register, isLoading } = useAuth();

  const validateForm = () => {
    const newErrorFields: ErrorFields = {};
    
    if (!username || username.length < 6 || username.length > 12) {
      setErrorMessage('使用者名稱必須介於6至12字元');
      newErrorFields.username = true;
      setErrorFields(newErrorFields);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setErrorMessage('請輸入有效的電子郵件地址');
      newErrorFields.email = true;
      setErrorFields(newErrorFields);
      return false;
    }

    if (!password || password.length < 6) {
      setErrorMessage('密碼長度至少需要6個字元');
      newErrorFields.password = true;
      newErrorFields.confirmPassword = true;
      setErrorFields(newErrorFields);
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage('密碼不一致');
      newErrorFields.password = true;
      newErrorFields.confirmPassword = true;
      setErrorFields(newErrorFields);
      return false;
    }

    setErrorFields({});
    setErrorMessage('');
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    const result = await register(username, email, password);
    
    if (result.success && result.needsVerification) {
      router.push({
        pathname: "/verification",
        params: {
          email: email,
          username: username
        }
      });
    } else if (!result.success) {
      setErrorMessage(result.message);
      setErrorFields(result.errorFields || {});
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>註冊</Text>
      
      <ClearableInput 
        placeholder="使用者名稱"
        value={username}
        onChangeText={(text) => {
          setUsername(text);
          setErrorFields({});
          setErrorMessage('');
        }}
        editable={!isLoading}
        hasError={errorFields.username}
      />
      
      <ClearableInput 
        placeholder="電子郵件"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setErrorFields({});
          setErrorMessage('');
        }}
        autoCapitalize="none"
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
      
      <PasswordInput
        placeholder="確認密碼"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          setErrorFields({});
          setErrorMessage('');
        }}
        editable={!isLoading}
        hasError={errorFields.confirmPassword}
      />
      
      {errorMessage && 
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      }

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? '註冊中...' : '註冊'}
        </Text>
      </TouchableOpacity>
      
      {!isLoading &&
        <Link href="/login" style={styles.link}>
          已有帳號？
        </Link>
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
  link: {
    marginTop: 15,
    textAlign: 'center',
    color: '#007AFF',
  },
});
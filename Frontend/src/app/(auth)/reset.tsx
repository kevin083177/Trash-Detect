import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/auth';
import PasswordInput from '@/components/auth/PasswordInput';
import Logo from '@/components/auth/Logo';

export default function ResetPassword() {
  const { reset_token, email } = useLocalSearchParams<{ reset_token: string; email: string }>();
  
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const { resetPassword, isLoading } = useAuth();

  const validateForm = (): boolean => {
    if (!newPassword) {
      setErrorMessage('請輸入新密碼');
      return false;
    }

    if (newPassword.length < 6) {
      setErrorMessage('密碼長度至少需要6個字元');
      return false;
    }

    if (!confirmPassword) {
      setErrorMessage('請確認密碼');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('密碼不一致');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    if (!reset_token) {
      setErrorMessage('伺服器錯誤，請稍後再試');
      setTimeout(() => {
        router.replace({
          pathname: '/login',
        });
      }, 1000);
      return;
    }

    const result = await resetPassword(reset_token, newPassword);
    
    if (result.success) {
      setSuccess(result.message);
      setErrorMessage('');
      
      setTimeout(() => {
        router.replace({
          pathname: '/login',
          params: { email }
        });
      }, 2000);
    } else {
      setErrorMessage(result.message);
      setSuccess('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>重設密碼</Text>
        
        <Text style={styles.subtitle}>
          請為該帳號重新設定密碼{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>
      </View>

      <View style={styles.formContainer}>
        <PasswordInput
          label="新密碼"
          icon="lock-closed-outline"
          placeholder="請輸入您的新密碼"
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            setErrorMessage('');
            setSuccess('');
          }}
          editable={!isLoading && !success}
          hasError={!!errorMessage}
        />
        
        <PasswordInput
          label="確認新密碼"
          icon='shield-outline'
          placeholder="請再次輸入您的新密碼"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setErrorMessage('');
            setSuccess('');
          }}
          editable={!isLoading && !success}
          hasError={!!errorMessage}
        />

        {errorMessage && 
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        }

        <TouchableOpacity 
          style={[
            styles.button, 
            (isLoading || success) && styles.buttonDisabled
          ]}
          onPress={handleResetPassword}
          disabled={isLoading || !!success}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '發送中...' : success ? '密碼重設成功' : '確認重設密碼'}
          </Text>
        </TouchableOpacity>
      </View>
      <Logo />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#1C1C1C',
    paddingTop: 48,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 22,
  },
  emailText: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  errorMessage: {
    color: '#DC3545',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
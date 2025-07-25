import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/auth';
import PasswordInput from '@/components/auth/PasswordInput';
import { Ionicons } from '@expo/vector-icons';

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
      <View style={styles.content}>
        <Ionicons name="lock-open" size={80} color="#007AFF" style={styles.icon} />
        
        <Text style={styles.title}>重設密碼</Text>
        
        <Text style={styles.subtitle}>
          請為 {email} 設定新的密碼
        </Text>
        
        <PasswordInput
          placeholder="新密碼"
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
          placeholder="確認新密碼"
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

        {success && 
          <Text style={styles.successMessage}>
            {success}
            {'\n'}正在跳轉到登入頁面...
          </Text>
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
            {isLoading ? '重設中...' : success ? '重設成功' : '重設密碼'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  errorMessage: {
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 15,
  },
  successMessage: {
    color: '#28A745',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
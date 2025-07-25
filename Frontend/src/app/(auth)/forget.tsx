import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/auth';
import ClearableInput from '@/components/auth/ClearableInput';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const { forgetPassword, isLoading } = useAuth();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendCode = async () => {
    if (!email) {
        setErrorMessage('請輸入電子郵件');
        return;
    }

    if (!validateEmail(email)) {
        setErrorMessage('請輸入有效的電子郵件地址');
        return;
    }

    const result = await forgetPassword(email);
    
    if (result.success) {
        setErrorMessage('');
      
        router.push({
            pathname: "/verification",
            params: { 
                email: email,
                type: 'forget'
            }
        });
    } else {
        setErrorMessage(result.message);
        setSuccess('');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Ionicons name="lock-open-outline" size={80} color="#007AFF" style={styles.icon} />
        
        <Text style={styles.title}>忘記密碼</Text>
        
        <Text style={styles.subtitle}>
            輸入電子郵件獲取驗證碼
        </Text>
        
        <ClearableInput
          placeholder="電子郵件"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setErrorMessage('');
            setSuccess('');
          }}
          keyboardType="email-address"
          editable={!isLoading}
          hasError={!!errorMessage}
        />

        {errorMessage && 
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        }

        {success && 
          <Text style={styles.successMessage}>{success}</Text>
        }

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSendCode}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '發送中...' : '發送驗證碼'}
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
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    padding: 8,
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
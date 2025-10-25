import { View, Text, TouchableOpacity, StyleSheet, TouchableNativeFeedback } from 'react-native';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/auth';
import ClearableInput from '@/components/auth/ClearableInput';
import { Ionicons } from '@expo/vector-icons';
import Logo from '@/components/auth/Logo';

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
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.title}>忘記密碼</Text>
        
        <Text style={styles.subtitle}>
          輸入您的電子郵件獲取驗證碼
        </Text>
      </View>

      <View style={styles.formContainer}>
        <ClearableInput
          label="電子郵件"
          icon='mail-outline'
          placeholder="請輸入您的電子郵件"
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
            {isLoading ? '寄送中...' : '寄送驗證碼'}
          </Text>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>記得密碼嗎 ? </Text>
          <TouchableNativeFeedback onPress={() => router.back()}>
            <Text style={styles.loginLink}>登入</Text>
          </TouchableNativeFeedback>
        </View>
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
    paddingTop: 32,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: 'center'
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
  successMessage: {
    color: '#28A745',
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
    marginBottom: 20,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
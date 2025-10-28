import { View, Text, TouchableOpacity, StyleSheet, TouchableNativeFeedback } from 'react-native';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/auth';
import PasswordInput from '@/components/auth/PasswordInput';
import ClearableInput from '@/components/auth/ClearableInput';
import TermModal from '@/components/auth/TermModal';
import Logo from '@/components/auth/Logo';

type ErrorFields = {
  email?: boolean;
  password?: boolean;
  confirmPassword?: boolean;
};

export default function Register() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorFields, setErrorFields] = useState<ErrorFields>({});
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);

  const { register, isLoading } = useAuth();

  const validateForm = () => {
    const newErrorFields: ErrorFields = {};

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

    if (!agreedToTerms) {
      setShowTermsModal(true);
      return;
    }

    const result = await register(email, password);
    
    if (result.success && result.needsVerification) {
      router.push({
        pathname: "/verification",
        params: {
          email: email,
          type: 'register'
        }
      });
    } else if (!result.success) {
      setErrorMessage(result.message);
      setErrorFields(result.errorFields || {});
    }
  };

  const handleAgreeAndRegister = async () => {
    setAgreedToTerms(true);
    setShowTermsModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.title}>註冊新帳號</Text>
        
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>已經有帳號了嗎 ? </Text>
          <TouchableNativeFeedback onPress={() => router.back()}>
            <Text style={styles.loginLink}>登入</Text>
          </TouchableNativeFeedback>
        </View>
      </View>

      <View style={styles.formContainer}>
        <ClearableInput 
          label="電子郵件"
          icon="mail-outline"
          placeholder='請輸入您的電子郵件'
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
          label="密碼"
          icon="lock-closed-outline"
          placeholder='請輸入您的密碼'
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
          label="確認密碼"
          icon='checkmark-circle-outline'
          placeholder='請再次輸入您的密碼'
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setErrorFields({});
            setErrorMessage('');
          }}
          editable={!isLoading}
          hasError={errorFields.confirmPassword}
        />

        <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={styles.checkbox}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            disabled={isLoading}
          >
            <Ionicons 
              name={agreedToTerms ? "checkbox" : "square-outline"} 
              size={24} 
              color={agreedToTerms ? "#007AFF" : "#9CA3AF"} 
            />
          </TouchableOpacity>
          <Text style={styles.termsText}>
            我已閱讀並同意
            <Text 
              style={styles.termsLink}
              onPress={() => setShowTermsModal(true)}
            >
            《隱私權政策與使用條款》
            </Text>
          </Text>
        </View>
        
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
      </View>

      <TermModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAgree={handleAgreeAndRegister}
        isLoading={isLoading}
      />
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
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  loginLink: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    marginRight: 8,
  },
  termsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  termsLink: {
    color: '#007AFF',
    fontWeight: '600',
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
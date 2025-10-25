import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/hooks/auth';
import { Ionicons } from '@expo/vector-icons';
import Logo from '@/components/auth/Logo';

export default function Verification() {
  const { email, type } = useLocalSearchParams<{ email: string, type: "forget" | "register" }>();
  
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [remainingAttempts, setRemainingAttempts] = useState<number>(5);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [resetToken, setResetToken] = useState<string>('');

  const { 
    isLoading,
    verifyEmailCode, 
    resendEmailCode, 
    checkEmailCodeStatus,
    verifyPasswordReset,
    resendPasswordCode,
    checkPasswordCodeStatus
  } = useAuth();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (email) {
      checkVerificationStatus();
    }
  }, [email]);

  useEffect(() => {
    if (resetToken && type === 'forget') {
      router.push({
        pathname: '/reset',
        params: { 
          reset_token: resetToken,
          email: email 
        }
      });
    }
  }, [resetToken, type, email]);

  const checkVerificationStatus = async () => {
    try {
      const result = await (type === 'forget' ? checkPasswordCodeStatus : checkEmailCodeStatus)(email);
      if (result.exists) {
        setRemainingAttempts(Math.max(0, 5 - result.attempts));
        if (result.expired) {
          setErrorMessage('驗證碼已過期，請重新發送');
        }
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6);
      const newCode = [...verificationCode];
      
      for (let i = 0; i < pastedCode.length && i < 6; i++) {
        newCode[i] = pastedCode[i];
      }
      
      setVerificationCode(newCode);
      
      if (pastedCode.length === 6) {
        setErrorMessage('');
        setTimeout(() => handleVerify(newCode), 100);
      } else {
        const nextIndex = Math.min(index + pastedCode.length, 5);
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      setTimeout(() => handleVerify(newCode), 100);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string[]) => {
    setErrorMessage('');
    const codeToVerify = code || verificationCode;
    const codeString = codeToVerify.join('');
    
    if (codeString.length !== 6) {
      setErrorMessage('請輸入完整的6位數驗證碼');
      return;
    }

    if (type === 'forget') {
      const result = await verifyPasswordReset(email, codeString);
      
      if (result.success) {
          setResetToken(result.reset_token);
      } else {
        setErrorMessage(result.message);
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } else {
      const result = await verifyEmailCode(email, codeString);
      
      if (result.success) {
        setTimeout(() => {
          router.replace({
            pathname: '/login',
            params: { email }
          });
        }, 500);
      } else {
        setErrorMessage(result.message);
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    
    const result = await (type === 'forget' ? resendPasswordCode : resendEmailCode)(email);
    
    if (result.success) {
      setErrorMessage('驗證碼已重新發送');
      setCountdown(60);
      setRemainingAttempts(5);
      setVerificationCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } else {
      setErrorMessage(result.message);
    }
    
    setIsResending(false);
  };

  const getTitle = () => {
    return type === 'forget' ? '重新設定密碼' : '完成註冊';
  };

  const getDescription = () => {
    return type === 'forget' 
      ? '輸入驗證碼以重新設定您的密碼' 
      : '輸入驗證碼以完成註冊驗證';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getTitle()}</Text>
        
        <Text style={styles.subtitle}>
          我們已寄送驗證碼至您的信箱{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.description}>{getDescription()}</Text>
        
        <View style={styles.codeContainer}>
          {verificationCode.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => inputRefs.current[index] = ref}
              style={[
                styles.codeInput,
                digit !== '' && styles.codeInputFilled
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={6}
              selectTextOnFocus
              editable={!isLoading}
            />
          ))}
        </View>

        {errorMessage && 
          <Text
            style={[
              styles.errorMessage,
              errorMessage.includes('驗證碼已重新發送') && styles.successMessage
            ]}
          >
            {errorMessage}
          </Text>
        }

        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
          onPress={() => handleVerify()}
          disabled={isLoading || verificationCode.join('').length !== 6}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading && !isResending ? '送出中...' : '送出'}
          </Text>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>沒有收到驗證碼 ? </Text>
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={countdown > 0 || isResending}
            style={styles.resendButton}
          >
            <Text style={[
              styles.resendButtonText,
              (countdown > 0 || isResending) && styles.resendButtonDisabled
            ]}>
              {isResending ? '發送中...' : 
               countdown > 0 ? `00:${Number(countdown).toPrecision(2)}` : '重新發送'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noteContainer}>
          <Ionicons name="time-outline" size={16} color="#f11b1b" />
          <Text style={styles.note}>驗證碼將在 5 分鐘內過期</Text>
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
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  codeInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },
  errorMessage: {
    marginBottom: 20,
    color: '#DC3545',
    textAlign: 'center',
    fontSize: 14,
  },
  successMessage: {
    color: '#28A745',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
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
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendButton: {
    marginTop: 4,
    marginLeft: 6,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  resendButtonDisabled: {
    color: '#9CA3AF',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  note: {
    fontSize: 14,
    color: '#f11b1b',
  },
});
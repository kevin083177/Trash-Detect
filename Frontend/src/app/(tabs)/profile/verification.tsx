import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { asyncPost, asyncGet } from '@/utils/fetch';
import { auth_api } from '@/api/api';
import { Ionicons } from '@expo/vector-icons';
import { tokenStorage } from '@/utils/tokenStorage';

export default function EmailVerification() {
  const { newEmail } = useLocalSearchParams<{ newEmail: string }>();
  
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [remainingAttempts, setRemainingAttempts] = useState<number>(5);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (newEmail) {
      checkVerificationStatus();
    }
  }, [newEmail]);

  const checkVerificationStatus = async () => {
    try {
      const response = await asyncGet(`${auth_api.email_code_status}?email=${newEmail}`);
      if (response.body?.exists) {
        setRemainingAttempts(Math.max(0, 5 - response.body.attempts));
        if (response.body.expired) {
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

    try {
      setIsLoading(true);
      const token = await tokenStorage.getToken();
      
      const response = await asyncPost(`${auth_api.verify_email_code}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: {
          email: newEmail,
          verification_code: codeString
        }
      });

      if (response.status === 200) {
        Alert.alert(
          '成功',
          'Email 更新成功！',
          [
            {
              text: '確定',
              onPress: () => {
                router.replace('/(tabs)/profile/settings');
              }
            }
          ]
        );
      } else {
        setErrorMessage(response.message);
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setErrorMessage('網路錯誤，請稍後再試');
      console.error('Verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    try {
      setIsResending(true);
      const token = await tokenStorage.getToken();
      
      const response = await asyncPost(`${auth_api.resend_email_code}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: { email: newEmail }
      });

      if (response.status === 200) {
        setErrorMessage('驗證碼已重新發送');
        setCountdown(60);
        setRemainingAttempts(5);
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setErrorMessage(response.message || '重新發送失敗');
      }
    } catch (error) {
      setErrorMessage('網路錯誤，請稍後再試');
      console.error('Resend error:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Ionicons name="mail-outline" size={80} color="#007AFF" style={styles.icon} />
        
        <Text style={styles.title}>驗證新的電子郵件</Text>
        
        <Text style={styles.subtitle}>我們已發送驗證碼至</Text>
        <Text style={styles.email}>{newEmail}</Text>
        
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

        {errorMessage && (
          <Text
            style={[
              styles.errorMessage,
              errorMessage.includes('驗證碼已重新發送') && styles.successMessage
            ]}
          >
            {errorMessage}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
          onPress={() => handleVerify()}
          disabled={isLoading || verificationCode.join('').length !== 6}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading ? '驗證中...' : '驗證'}
          </Text>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>沒有收到驗證碼？</Text>
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
               countdown > 0 ? `重新發送 (${countdown}s)` : '重新發送'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>驗證碼將在5分鐘後過期</Text>
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
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#E1E5E9',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  codeInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  errorMessage: {
    marginBottom: 20,
    color: 'red',
    textAlign: 'center',
  },
  successMessage: {
    color: '#1c8020'
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 30,
    minWidth: 120,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  resendButton: {
    padding: 5,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  resendButtonDisabled: {
    color: '#999',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
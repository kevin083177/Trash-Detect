import { View, Text, TouchableOpacity, StyleSheet, Switch, Image } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/auth';
import PasswordInput from '@/components/auth/PasswordInput';
import ClearableInput from '@/components/auth/ClearableInput';
import { clearRoom } from '@/utils/roomStorage';
import Logo from '@/components/auth/Logo';

type ErrorFields = {
  email?: boolean;
  password?: boolean;
};

const REMEMBER_ME_KEY = '@remember_me';
const SAVED_EMAIL_KEY = '@saved_email';
const SAVED_PASSWORD_KEY = '@saved_password';

export default function Login() {
  const { email: initialEmail } = useLocalSearchParams<{ email: string }>();
  const [email, setEmail] = useState<string>(initialEmail || '');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorFields, setErrorFields] = useState<ErrorFields>({});
  
  const { login, isLoading } = useAuth();

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedRememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      if (savedRememberMe === 'true') {
        const savedEmail = await AsyncStorage.getItem(SAVED_EMAIL_KEY);
        const savedPassword = await AsyncStorage.getItem(SAVED_PASSWORD_KEY);
        
        if (savedEmail) setEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const saveCredentials = async (email: string, password: string, remember: boolean) => {
    try {
      if (remember) {
        await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
        await AsyncStorage.setItem(SAVED_EMAIL_KEY, email);
        await AsyncStorage.setItem(SAVED_PASSWORD_KEY, password);
      } else {
        await AsyncStorage.multiRemove([REMEMBER_ME_KEY, SAVED_EMAIL_KEY, SAVED_PASSWORD_KEY]);
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

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
    const old_email = await AsyncStorage.getItem(SAVED_EMAIL_KEY);

    const result = await login(email, password);
    
    if (result.success) {
      if (old_email != email) {
        await clearRoom();
      }
      await saveCredentials(email, password, rememberMe);
      
    } else {
      setErrorMessage(result.message);
      setErrorFields(result.errorFields || {});
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>登入您的帳號</Text>
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>還沒有帳號嗎 ? </Text>
          <Link href="/register" style={styles.signupLink}>
            註冊
          </Link>
        </View>
      </View>

      <View style={styles.formContainer}>
        <ClearableInput
          label="電子郵件"
          icon="mail-outline"
          placeholder="請輸入您的電子郵件"
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
          label="密碼"
          icon='lock-closed-outline'
          placeholder="請輸入您的密碼"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrorFields({});
            setErrorMessage('');
          }}
          editable={!isLoading}
          hasError={errorFields.password}
        />

        <View style={styles.optionsRow}>
          <View style={styles.rememberMeContainer}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={rememberMe ? '#007AFF' : '#F3F4F6'}
              disabled={isLoading}
            />
            <Text style={styles.rememberMeText}>記住我</Text>
          </View>
          

          <Link href="/forget" style={styles.forgotLink}>
            忘記密碼 ?
          </Link>
        </View>

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
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  signupLink: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberMeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  forgotLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
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
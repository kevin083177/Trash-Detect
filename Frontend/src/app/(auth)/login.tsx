import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { asyncGet, asyncPost } from '@/utils/fetch';
import { auth_api, purchase_api, user_api } from '@/api/api';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/auth';
import { tokenStorage } from '@/utils/storage';
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorFields, setErrorFields] = useState<ErrorFields>({});
  const { setUser } = useAuth();

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

    try {
      setIsLoading(true);
      const response = await asyncPost(auth_api.login, {
        body: { email, password }
      });
  
      if (response.status === 200) {
        const userData = {
          ...response.body.user,  // 所有用戶資料
          role: response.body.user.userRole,  // 映射 userRole 到 role
          token: response.body.token  // 保留 token
        };
        
        await tokenStorage.setToken(userData.token);
        fetchUserProfile(userData.token);
        setUser(userData);
      } else {
        setErrorMessage(response.message);
        setErrorFields({ email: true, password: true });
      }
    } catch (error) {
      setErrorMessage("伺服器錯誤");
      setErrorFields({ email: true, password: true });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async (token: string) => {
    try {
      // fetch user_id
      const user = await asyncGet(user_api.get_user, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      const user_id: string = String(user.body['_id']);

      // fetch user's purchase_id
      const purchase = await asyncGet(purchase_api.get_purchase, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const purchase_id: string = String(purchase.body['_id']);
       
      // storage
      tokenStorage.setUserInfo({
        user_id: user_id,
        purchase_id: purchase_id
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('錯誤', '獲取用戶資料失敗');
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
      { !isLoading &&
        <Link href="/register" style={styles.link}>
          還沒有帳號？
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
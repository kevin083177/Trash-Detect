import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { asyncPost } from '@/utils/fetch';
import { auth_api } from '@/api/api';
import PasswordInput from '@/components/auth/PasswordInput';

export default function Register() {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const validateForm = () => {
    if (!username || !email || !password || !confirmPassword) {
      setErrorMessage('請填寫所有欄位');
      return false;
    }

    if (username.length < 6 || username.length > 12) {
      setErrorMessage('使用者名稱必須介於6至12字元');
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage('密碼不一致');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('請輸入有效的電子郵件地址');
      return false;
    }

    if (password.length < 6) {
      setErrorMessage('密碼長度至少需要6個字元');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const response = await asyncPost(auth_api.register, {
        body: {
          username,
          email,
          password,
          "userRole": 'user'
        }
      });

      // console.log(response);

      Alert.alert('成功', '註冊成功！', [
        {
          text: '確定',
          onPress: () => router.push({
            pathname: '/login',
            params: { email }
          })
        }
      ]);
    } catch (error: any) {
      setErrorMessage(error?.message || '註冊失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>註冊</Text>
      
      <TextInput 
        style={styles.input}
        placeholder="使用者名稱"
        value={username}
        onChangeText={setUsername}
        editable={!isLoading}
      />
      
      <TextInput 
        style={styles.input}
        placeholder="電子郵件"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isLoading}
      />
      
      <PasswordInput
        placeholder="密碼"
        value={password}
        onChangeText={setPassword}
        editable={!isLoading}
      />
      
      <PasswordInput
        placeholder="確認密碼"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        editable={!isLoading}
      />
      
      { errorMessage && 
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
      
      <Link href="/login" style={styles.link}>
        已有帳號？
      </Link>
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
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
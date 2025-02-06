import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Link } from 'expo-router';
import { asyncGet, asyncPost } from '@/utils/fetch';
import { auth_api, purchase_api, user_api } from '@/api/api';
import { useState } from 'react';
import { useAuth } from '@/hooks/auth';
import { tokenStorage } from '@/utils/storage';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { setUser } = useAuth();
  
  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('請填寫所有欄位');
      return;
    }

    try {
      const response = await asyncPost(auth_api.login, {
        body: { email, password }
      });

      if (response.status === 200) {
        const user = response.body;
        await tokenStorage.setToken(user.token);
        fetchUserProfile(user.token);
        setUser(user);
      } else {
        setErrorMessage(response.message);
      }
    } catch (error) {
      setErrorMessage("伺服器錯誤");
      console.error(error);
    }
  };
  const fetchUserProfile = async (token: string) => {
    try {
      // fetch user_id
      const user = await asyncGet(user_api.get_user, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
      })

      const user_id: string = String(user.body['_id']);

      // fetch user's record_id
      const record = await asyncGet(user_api.get_record, {
          headers: {
              'Authorization': `Bearer ${token}`
          },
      });

      const record_id: string = String(record.body['_id']); 

      // fetch user's purchase_id
      const purchase = await asyncGet(purchase_api.get_purchase, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const purchase_id: string = String(purchase.body['_id']);

      // storage
      tokenStorage.setUserInfo({
        user_id: user_id,
        record_id: record_id,
        purchase_id: purchase_id
      })
      console.log(user_id, record_id, purchase_id);9
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('錯誤', '獲取用戶資料失敗');
    }
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>登入</Text>
      
      <TextInput 
        style={styles.input}
        placeholder="電子郵件"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      
      <TextInput 
        style={styles.input}
        placeholder="密碼"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Text>{errorMessage}</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>登入</Text>
      </TouchableOpacity>
      
      <Link href="/register" style={styles.link}>
        還沒有帳號？
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
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
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
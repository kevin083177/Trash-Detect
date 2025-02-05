import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { asyncPost } from '@/src/utils/fetch';
import { auth_api } from '@/src/api/api';

const handleLogin = async(email: string, password: string) => {
  try {
    const response = await asyncPost(auth_api.login, {
      body: {
        "email": email,
        "password": password
      }
    })

    if (response) {
      console.log(response);
      
    }
  } catch (error) {
    
  }
}

export default function Login() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>登入</Text>
      
      <TextInput 
        style={styles.input}
        placeholder="電子郵件"
        autoCapitalize="none"
      />
      
      <TextInput 
        style={styles.input}
        placeholder="密碼"
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button}>
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
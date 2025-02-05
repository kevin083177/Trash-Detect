import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function Register() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>註冊</Text>
      
      <TextInput 
        style={styles.input}
        placeholder="使用者名稱"
      />
      
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
      
      <TextInput 
        style={styles.input}
        placeholder="確認密碼"
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>註冊</Text>
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
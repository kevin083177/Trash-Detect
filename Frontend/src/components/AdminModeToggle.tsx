import React, { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/auth';

export function AdminModeToggle() {
  const { isAdminMode, toggleAdminMode, user } = useAuth();

  if (user?.role !== 'admin') return null;

  return (
    <TouchableOpacity
      onPress={toggleAdminMode}
      style={[
        styles.button,
        { backgroundColor: isAdminMode ? '#ff4444' : '#44b844' }
      ]}
    >
      <Text style={styles.buttonText}>
        {isAdminMode ? '切換使用者模式' : '切換管理員模式'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 60,
    zIndex: 1000,
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
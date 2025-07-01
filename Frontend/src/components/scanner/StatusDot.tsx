import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface StatusDotProps {
  status: ConnectionStatus;
  onPress?: () => void;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, onPress }) => {
  const getStatusColor = (): string => {
    switch (status) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
      onPress={status === 'error' ? onPress : undefined}
    >
      {status === 'connecting' && (
        <ActivityIndicator size="small" color="#fff" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  statusDot: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 10,
    height: 10,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
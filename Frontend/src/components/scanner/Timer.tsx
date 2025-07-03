import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimerProps {
  timeLeft: number;
  targetItem: string;
  isActive: boolean;
}

export const Timer: React.FC<TimerProps> = ({ 
  timeLeft, 
  targetItem, 
  isActive 
}) => {
  if (!isActive) return null;

  const progress = (3 - timeLeft) / 3 * 100; // 計算進度百分比

  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <Text style={styles.targetText}>請維持不要移動</Text>
        <Text style={styles.countdownText}>{timeLeft.toFixed(1)}</Text>
        
        {/* 進度條 */}
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress}%` }
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    alignItems: 'center',
    transform: [{ translateY: -50 }],
  },
  timerContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffcc00',
    minWidth: 200,
  },
  targetText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  countdownText: {
    color: '#ffcc00',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  progressBar: {
    width: 150,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffcc00',
    borderRadius: 3,
  },
});
import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface ChapterDotsProps {
  totalDots: number;
  activeDotIndex: number;
}

export function ChapterDots({ totalDots, activeDotIndex }: ChapterDotsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalDots }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeDotIndex && styles.activeDot
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,  
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
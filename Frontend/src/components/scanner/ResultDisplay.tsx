import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ResultDisplayProps } from '@/interface/Detection';

const categoryTranslations: { [key: string]: string } = {
  'paper': '紙張',
  'container': '紙容器',
  'can': '鐵鋁罐',
  'plastic': '塑膠',
  'plasticbottle': '寶特瓶',
};

export const translateCategory = (category: string): string => {
  return categoryTranslations[category.toLowerCase()] || category;
};

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ detections }) => {
  const getDisplayText = () => {
    if (detections.length === 0) {
      return '';
    } else if (detections.length === 1) {
      return translateCategory(detections[0].category);
    } else {
      return '請一次掃描一個物體';
    }
  };

  const displayText = getDisplayText();

  if (!displayText) return null;

  return (
    <View style={styles.resultContainer}>
      <Text style={styles.resultText}>{displayText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  resultContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  resultText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
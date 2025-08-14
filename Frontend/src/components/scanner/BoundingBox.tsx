import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Detection } from '@/interface/Detection';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const BoundingBox = ({ 
  detection, 
  imageSize 
}: { 
  detection: Detection; 
  imageSize: { width: number; height: number } | null 
}) => {
  const categoryTranslations: { [key: string]: string } = {
    'paper': '紙張',
    'container': '紙容器',
    'can': '鐵鋁罐',
    'plastic': '塑膠',
    'plasticbottle': '寶特瓶',
  };
  
  const translateCategory = (category: string): string => {
    return categoryTranslations[category.toLowerCase()] || category;
  };

  const calculateBoundingBox = () => {
    if (!imageSize) return { left: 0, top: 0, width: 0, height: 0 };
    
    const [x1, y1, x2, y2] = detection.bbox;
    
    const widthRatio = screenWidth / imageSize.width;
    const heightRatio = screenHeight / imageSize.height;
    
    return {
      left: x1 * widthRatio,
      top: y1 * heightRatio,
      width: (x2 - x1) * widthRatio,
      height: (y2 - y1) * heightRatio,
    };
  };

  const box = calculateBoundingBox();

  return (
    <View
      style={[
        styles.boundingBox,
        {
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
        }
      ]}
    >
      <Text style={styles.boundingBoxLabel}>
        {translateCategory(detection.category)} {/* ({(detection.confidence * 100).toFixed(1)}%) */}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ffffffff',
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  boundingBoxLabel: {
    position: 'absolute',
    top: 0,
    left: -2,
    backgroundColor: '#fff',
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    padding: 6,
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center'
  },
});
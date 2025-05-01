import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';

interface StarsRendererProps {
  stars: number;
  style?: ViewStyle;
  size?: number;
}

export function Stars({ stars, style, size = 15 }: StarsRendererProps) {
  // 確保 stars 值在 0-3 的範圍內
  const starCount = Math.min(Math.max(0, stars), 3);
  
  return (
    <View style={[styles.container, style]}>
      {[0, 1, 2].map((index) => (
        <Image
          key={index}
          source={
            index < starCount
              ? require('@/assets/images/Star.png')        // 黃色星星
              : require('@/assets/images/Star_Disable.png') // 灰色星星
          }
          style={[styles.starImage, { width: size, height: size }]}
          resizeMode="contain"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starImage: {
    marginHorizontal: 2,
  }
});
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Path } from 'react-native-svg';

export const Cloud = ({ width, height }: { width: number; height: number }) => (
  <View style={styles.container}>
    <Svg width={width} height={height} viewBox="-63 -15 112 55">
      <Path
        d="M0 0A1 1 0 00-28 0 1 1 0 00-47 1 1 1 0 00-58 14a1 1 0 0020 11 1 1 0 0028 0 1 1 0 0027-2 1 1 0 0018 2A1 1 0 0031 1 1 1 0 006 7 1 1 0 00-2-7"
        fill="#ffffff"
        opacity={0.75}
      />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
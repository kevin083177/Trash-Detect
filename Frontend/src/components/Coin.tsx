import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface CoinProps {
  value: number;
  size?: 'small' | 'medium' | 'large';
  fontColor?: string;
}

export const Coin = ({value, size = 'medium', fontColor}: CoinProps) => {
  const sizeConfig = {
    small: {
      iconSize: 16,
      fontSize: 14,
      spacing: 6,
    },
    medium: {
      iconSize: 24,
      fontSize: 24,
      spacing: 8,
    },
    large: {
      iconSize: 32,
      fontSize: 32,
      spacing: 10,
    },
  };

  const config = sizeConfig[size];

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/icons/coin.png')}
        style={
          {
            width: config.iconSize,
            height: config.iconSize,
            marginRight: config.spacing,
          }
        }
        resizeMode="contain"
      />
      <Text style={[
        styles.coinAmount,
        { fontSize: config.fontSize,
          color: fontColor ? fontColor : "#ff8800"
        }
      ]}>
        {value.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinAmount: {
    fontWeight: 'bold',
  },
});
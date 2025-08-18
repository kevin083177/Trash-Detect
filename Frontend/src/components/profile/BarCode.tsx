import React from "react";
import { View, StyleSheet, Text } from "react-native";
import Svg, { Rect } from "react-native-svg";

const generateBarcodePattern = (text: string): number[] => {
    const pattern: number[] = [];
    
    pattern.push(2, 1, 2, 1);
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const mod = charCode % 6;
      
      switch (mod) {
        case 0: pattern.push(1, 1, 2, 2); break;
        case 1: pattern.push(2, 1, 1, 2); break;
        case 2: pattern.push(1, 2, 1, 2); break;
        case 3: pattern.push(2, 2, 1, 1); break;
        case 4: pattern.push(1, 1, 3, 1); break;
        case 5: pattern.push(3, 1, 1, 1); break;
      }
    }
    
    pattern.push(2, 1, 1, 1, 2);
    
    return pattern;
  };

export const Barcode = ({ value }: { value: string }) => {
    const pattern = generateBarcodePattern(value);
    let x = 0;
    
    return (
      <View style={styles.barcodeWrapper}>
        <Svg width={220} height={50} style={styles.barcodeSvg}>
          {pattern.map((width, index) => {
            const isBar = index % 2 === 0;
            const rect = (
              <Rect
                key={index}
                x={x}
                y={0}
                width={width * 2}
                height={50}
                fill={isBar ? '#000000' : 'transparent'}
              />
            );
            x += width * 2;
            return rect;
          })}
        </Svg>
        <Text style={styles.barcodeText}>{value}</Text>
      </View>
    );
  };

const styles = StyleSheet.create({
  barcodeWrapper: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  barcodeSvg: {
    marginBottom: 8,
  },
  barcodeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 1,
  },
});
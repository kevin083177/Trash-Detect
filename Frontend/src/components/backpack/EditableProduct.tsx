import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  PanResponder,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product, ProductCategory } from '@/interface/Product';

interface EditableProductProps {
  category: ProductCategory;
  item: Product;
  initialPosition: { x: number; y: number };
  initialScale?: number;
  initialRotation?: number;
  onConfirm: (category: ProductCategory, position: { x: number; y: number }, scale: number, rotation: number) => void;
  onCancel: (category: ProductCategory) => void;
}

const { width, height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 62;
const MIN_SCALE = 1; 
const MAX_SCALE = 4;

export default function EditableProduct({ 
  category, 
  item, 
  initialPosition,
  initialScale = 1,
  initialRotation = 0,
  onConfirm, 
  onCancel 
}: EditableProductProps) {
  const [currentScale, setCurrentScale] = useState(initialScale);
  const [currentRotation, setCurrentRotation] = useState(initialRotation);
  
  const pan = useRef(new Animated.ValueXY({ 
    x: 0, 
    y: 0 
  })).current;

  const dragPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        
        const offsetX = (pan.x as any)._value;
        const offsetY = (pan.y as any)._value;

        const actualX = initialPosition.x + offsetX;
        const actualY = initialPosition.y + offsetY;

        const scaledSize = 60 * currentScale;
        const halfScaledSize = scaledSize / 2;

        const boundedX = Math.max(halfScaledSize, Math.min(width - halfScaledSize, actualX));
        const boundedY = Math.max(halfScaledSize, Math.min(height - TAB_BAR_HEIGHT - halfScaledSize, actualY));

        const boundedOffsetX = boundedX - initialPosition.x;
        const boundedOffsetY = boundedY - initialPosition.y;

        if (boundedOffsetX !== offsetX || boundedOffsetY !== offsetY) {
          pan.setValue({ x: boundedOffsetX, y: boundedOffsetY });
        }
      }
    })
  ).current;

  // 縮放處理
  const scalePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (evt, gestureState) => {
        const scaleChange = -gestureState.dy / 100;
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale + scaleChange));
        setCurrentScale(newScale);
      },
    })
  ).current;

  // 旋轉處理
  const rotatePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (evt, gestureState) => {
        const rotationChange = -gestureState.dx;
        const newRotation = (currentRotation + rotationChange) % 360;
        setCurrentRotation(newRotation);
      },
    })
  ).current;

  const handleConfirm = () => {
    const finalPosition = {
      x: initialPosition.x + (pan.x as any)._value,
      y: initialPosition.y + (pan.y as any)._value,
    };
    onConfirm(category, finalPosition, currentScale, currentRotation);
  };

  const handleCancel = () => {
    onCancel(category);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: initialPosition.x - 30,
          top: initialPosition.y - 30,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.transformContainer,
          {
            transform: [
              { scale: currentScale },
              { rotate: `${currentRotation}deg` }
            ],
          }
        ]}
      >
        <View 
          style={styles.dashedBorder}
          {...dragPanResponder.panHandlers}
        >
          <Image
            source={{ uri: item.image?.url }}
            style={styles.itemImage}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.controlButton, 
            styles.confirmButton,
            {
              transform: [{ scale: 1 / currentScale }]
            }
          ]}
          onPress={handleConfirm}
        >
          <Ionicons name="checkmark" size={16} color="white" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.controlButton, 
            styles.cancelButton,
            {
              transform: [{ scale: 1 / currentScale }]
            }
          ]}
          onPress={handleCancel}
        >
          <Ionicons name="close" size={16} color="white" />
        </TouchableOpacity>

        <View
          style={[
            styles.controlButton, 
            styles.scaleButton,
            {
              transform: [{ scale: 1 / currentScale }]
            }
          ]}
          {...scalePanResponder.panHandlers}
        >
          <Ionicons name="resize-outline" size={16} color="white" />
        </View>

        <View
          style={[
            styles.controlButton, 
            styles.rotateButton,
            {
              transform: [{ scale: 1 / currentScale }]
            }
          ]}
          {...rotatePanResponder.panHandlers}
        >
          <Ionicons name="refresh-outline" size={16} color="white" />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
    width: 60,
    height: 60,
  },
  transformContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashedBorder: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    width: 60,
    height: 60,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  controlButton: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    top: -12,
    left: -12,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    bottom: -12,
    left: -12,
  },
  scaleButton: {
    backgroundColor: '#2196F3',
    top: -12,
    right: -12,
  },
  rotateButton: {
    backgroundColor: '#FF9800',
    bottom: -12,
    right: -12,
  },
});
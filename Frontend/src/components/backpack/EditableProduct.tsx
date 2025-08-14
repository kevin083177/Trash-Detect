import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  PanResponder,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Product, ProductCategory } from '@/interface/Product';

interface EditableProductProps {
  category: ProductCategory;
  item: Product;
  initialPosition: { x: number; y: number };
  initialScale?: number;
  initialRotation?: number;
  onTransformChange?: (category: ProductCategory, position: { x: number; y: number }, scale: number, rotation: number) => void;
}

const { width, height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 62;
const MIN_SCALE = 1; 
const MAX_SCALE = 4;
const DEFAULT_SIZE = 60;

export default function EditableProduct({ 
  category, 
  item, 
  initialPosition,
  initialScale = 1,
  initialRotation = 0,
  onTransformChange
}: EditableProductProps) {
  const [currentScale, setCurrentScale] = useState(initialScale);
  const [currentRotation, setCurrentRotation] = useState(initialRotation);
  const [imageSize, setImageSize] = useState({ width: DEFAULT_SIZE, height: DEFAULT_SIZE });
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  const currentScaleRef = useRef(initialScale);
  const currentRotationRef = useRef(initialRotation);
  const containerSizeRef = useRef({ width: DEFAULT_SIZE , height: DEFAULT_SIZE });
  
  const initialDistance = useRef(0);
  const initialAngle = useRef(0);
  const initialScaleForGesture = useRef(initialScale);
  const initialRotationForGesture = useRef(initialRotation);
  const isMultiTouch = useRef(false);
  
  const pan = useRef(new Animated.ValueXY({ 
    x: 0, 
    y: 0 
  })).current;

  const getDistance = (touch1: any, touch2: any) => {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touch1: any, touch2: any) => {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.atan2(dy, dx);
  };

  const notifyTransformChange = () => {
    if (onTransformChange) {
      const currentPosition = {
        x: initialPosition.x + (pan.x as any)._value,
        y: initialPosition.y + (pan.y as any)._value,
      };
      onTransformChange(category, currentPosition, currentScaleRef.current, currentRotationRef.current);
    }
  };

  useEffect(() => {
    if (item.image?.url) {
      Image.getSize(
        item.image.url,
        (imgWidth, imgHeight) => {
          const maxSize = 80;
          const ratio = Math.min(maxSize / imgWidth, maxSize / imgHeight);
          const displayWidth = imgWidth * ratio;
          const displayHeight = imgHeight * ratio;
          
          const newImageSize = { 
            width: Math.round(displayWidth), 
            height: Math.round(displayHeight) 
          };
          
          setImageSize(newImageSize);
          containerSizeRef.current = {
            width: newImageSize.width,
            height: newImageSize.height
          };
          setIsImageLoaded(true);
        },
        (error) => {
          console.log('Failed to get image size:', error);
          const defaultImageSize = { width: DEFAULT_SIZE, height: DEFAULT_SIZE };
          setImageSize(defaultImageSize);
          containerSizeRef.current = {
            width: DEFAULT_SIZE,
            height: DEFAULT_SIZE
          };
          setIsImageLoaded(true);
        }
      );
    } else {
      setIsImageLoaded(true);
    }
  }, [item.image?.url]);

  const updateScale = (newScale: number) => {
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    currentScaleRef.current = clampedScale;
    setCurrentScale(clampedScale);
    notifyTransformChange();
  };

  const updateRotation = (newRotation: number) => {
    const normalizedRotation = ((newRotation % 360) + 360) % 360;
    currentRotationRef.current = normalizedRotation;
    setCurrentRotation(normalizedRotation);
    notifyTransformChange();
  };

  useEffect(() => {
    currentScaleRef.current = initialScale;
    currentRotationRef.current = initialRotation;
  }, [initialScale, initialRotation]);

  const containerWidth = imageSize.width;
  const containerHeight = imageSize.height;

  const multiTouchPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return evt.nativeEvent.touches.length > 1 || Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        
        if (touches.length >= 2) {
          isMultiTouch.current = true;
          const touch1 = touches[0];
          const touch2 = touches[1];
          
          initialDistance.current = getDistance(touch1, touch2);
          initialAngle.current = getAngle(touch1, touch2);
          initialScaleForGesture.current = currentScaleRef.current;
          initialRotationForGesture.current = currentRotationRef.current;
        } else {
          isMultiTouch.current = false;
          pan.setOffset({
            x: (pan.x as any)._value,
            y: (pan.y as any)._value,
          });
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        
        if (touches.length >= 2 && isMultiTouch.current) {
          const touch1 = touches[0];
          const touch2 = touches[1];
          
          // 處理縮放
          const currentDistance = getDistance(touch1, touch2);
          const scaleRatio = currentDistance / initialDistance.current;
          const newScale = initialScaleForGesture.current * scaleRatio;
          updateScale(newScale);
          
          // 處理旋轉
          const currentAngle = getAngle(touch1, touch2);
          const angleDiff = currentAngle - initialAngle.current;
          const angleDiffDegrees = angleDiff * (180 / Math.PI);
          const newRotation = initialRotationForGesture.current + angleDiffDegrees;
          updateRotation(newRotation);
          
        } else if (touches.length === 1 && !isMultiTouch.current) {
          pan.setValue({ x: gestureState.dx, y: gestureState.dy });
          notifyTransformChange();
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        
        if (!isMultiTouch.current && touches.length <= 1) {
          pan.flattenOffset();
          
          const offsetX = (pan.x as any)._value;
          const offsetY = (pan.y as any)._value;

          const actualX = initialPosition.x + offsetX;
          const actualY = initialPosition.y + offsetY;

          const currentContainerSize = containerSizeRef.current;
          const scaledWidth = currentContainerSize.width * currentScaleRef.current;
          const scaledHeight = currentContainerSize.height * currentScaleRef.current;
          const halfScaledWidth = scaledWidth / 2;
          const halfScaledHeight = scaledHeight / 2;

          const boundedX = Math.max(halfScaledWidth, Math.min(width - halfScaledWidth, actualX));
          const boundedY = Math.max(halfScaledHeight, Math.min(height - TAB_BAR_HEIGHT * 2 - halfScaledHeight, actualY));

          const boundedOffsetX = boundedX - initialPosition.x;
          const boundedOffsetY = boundedY - initialPosition.y;

          if (boundedOffsetX !== offsetX || boundedOffsetY !== offsetY) {
            pan.setValue({ x: boundedOffsetX, y: boundedOffsetY });
          }
        }
        
        isMultiTouch.current = false;
        notifyTransformChange();
      }
    })
  ).current;

  if (!isImageLoaded) {
    return (
      <View style={[
        styles.container,
        {
          left: initialPosition.x - DEFAULT_SIZE / 2,
          top: initialPosition.y - DEFAULT_SIZE / 2,
          width: DEFAULT_SIZE,
          height: DEFAULT_SIZE,
        }
      ]} />
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: initialPosition.x - containerWidth / 2,
          top: initialPosition.y - containerHeight / 2,
          width: containerWidth,
          height: containerHeight,
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
            width: containerWidth,
            height: containerHeight,
            transform: [
              { scale: currentScale },
              { rotate: `${currentRotation}deg` }
            ],
          }
        ]}
      >
        <View 
          style={[
            styles.dashedBorder,
            {
              width: containerWidth,
              height: containerHeight,
            }
          ]}
          {...multiTouchPanResponder.panHandlers}
        >
          <Image
            source={{ uri: item.image?.url }}
            style={[
              {
                width: imageSize.width,
                height: imageSize.height,
              }
            ]}
            resizeMode="contain"
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  transformContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashedBorder: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
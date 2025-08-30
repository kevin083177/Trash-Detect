import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Text } from 'react-native';

export interface ToastProps {
  visible: boolean;
  message: string;
  position?: 'center' | 'bottom' | 'top';
  duration?: number;
  onHide: () => void;
  style?: object;
}

export const Toast: React.FC<ToastProps> = ({ 
  visible, 
  message, 
  position = 'center',
  duration = 3000,
  onHide,
  style
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(100)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      if (position === 'bottom') {
        translateY.setValue(100);
        fadeAnim.setValue(0);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
      } else if (position === 'top') {
        translateY.setValue(-100);
        fadeAnim.setValue(0);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
      } else {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }

      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, message, position, duration]);

  const hideToast = () => {
    if (position === 'bottom') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        onHide();
      });
    } else if (position === 'top') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        onHide();
      });
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onHide();
      });
    }
  };

  if (!visible) return null;

  const containerStyle = position === 'center' 
    ? styles.centerContainer 
    : position === 'top' 
    ? styles.topContainer 
    : styles.bottomContainer;
    
  const animatedStyle = position === 'center' 
    ? { opacity: fadeAnim }
    : { opacity: fadeAnim, transform: [{ translateY }] };

  return (
    <Animated.View
      style={[
        containerStyle,
        animatedStyle,
        style
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  topContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  centerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -25 }],
    width: 300,
    maxWidth: '80%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    padding: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
});
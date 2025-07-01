import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface TimerProps {
  duration: number;
  currentTime: number;
  isRunning: boolean;
  style?: StyleProp<ViewStyle>;
}

const RADIUS = 35;
const STROKE_WIDTH = 5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const Timer: React.FC<TimerProps> = ({
  duration,
  currentTime,
  isRunning,
  style
}) => {
  const progressAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const hasStartedAnimation = useRef(false);
  const wasRunning = useRef(false);

  // 顏色動畫（紅 → 黃 → 綠）
  const interpolatedColor = progressAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#FF4D4D', '#FFD700', '#70AA42']
  });

  // 計時進度動畫
  useEffect(() => {
    if (isRunning && (!wasRunning.current || !hasStartedAnimation.current)) {
      progressAnim.setValue(1);
      animationRef.current?.stop();

      animationRef.current = Animated.timing(progressAnim, {
        toValue: 0,
        duration: duration * 1000,
        useNativeDriver: false,
      });

      animationRef.current.start();
      hasStartedAnimation.current = true;
    } else if (!isRunning && wasRunning.current) {
      animationRef.current?.stop();
      hasStartedAnimation.current = false;
    }

    wasRunning.current = isRunning;

    return () => {
      animationRef.current?.stop();
    };
  }, [isRunning, duration]);

  // 重置動畫
  useEffect(() => {
    if (currentTime === duration && isRunning) {
      hasStartedAnimation.current = false;
      animationRef.current?.stop();
      progressAnim.setValue(1);

      animationRef.current = Animated.timing(progressAnim, {
        toValue: 0,
        duration: duration * 1000,
        useNativeDriver: false,
      });

      animationRef.current.start();
      hasStartedAnimation.current = true;
    }
  }, [currentTime, duration, isRunning]);

  // 抖動動畫
  useEffect(() => {
    if (isRunning && currentTime <= 3) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 5,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -5,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      shakeAnim.stopAnimation();
      shakeAnim.setValue(0);
    }
  }, [currentTime, isRunning]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        { transform: [{ translateX: shakeAnim }] }
      ]}
    >
      <Svg width={RADIUS * 2 + STROKE_WIDTH} height={RADIUS * 2 + STROKE_WIDTH}>
        <AnimatedCircle
          cx={RADIUS + STROKE_WIDTH / 2}
          cy={RADIUS + STROKE_WIDTH / 2}
          r={RADIUS}
          stroke={interpolatedColor as unknown as string}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
        />
      </Svg>

      <Animated.Text style={[styles.scoreText, { color: interpolatedColor as unknown as string }]}>
        {Math.floor(currentTime)}
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

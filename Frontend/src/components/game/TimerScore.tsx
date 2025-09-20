import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, StyleProp, ViewStyle, Text, Easing } from 'react-native';
import Svg, { Circle, Defs, ClipPath, Path, Stop, LinearGradient } from 'react-native-svg';

interface TimerScoreProps {
  duration: number;
  currentTime: number;
  isRunning: boolean;
  score: number;
  maxScore?: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
  showAnimation?: boolean;
}

export const TimerScore: React.FC<TimerScoreProps> = ({
  duration,
  currentTime,
  isRunning,
  score,
  maxScore = 2000,
  size = 120,
  style,
  showAnimation = true
}) => {
  const progressAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const hasStartedAnimation = useRef(false);
  const wasRunning = useRef(false);

  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(1);
  const waveAnimation1 = useRef(new Animated.Value(0)).current;
  const waveAnimation2 = useRef(new Animated.Value(0)).current;
  const scoreAnimation = useRef(new Animated.Value(0)).current;
  const waterLevelAnimation = useRef(new Animated.Value(0)).current;

  const STROKE_WIDTH = 6;
  const RADIUS = size / 2 + STROKE_WIDTH / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const waterLevel = Math.min(score / maxScore, 1);
  const radius = size / 2;
  const center = radius;

  const getGradientColors = (currentScore: number) => {
    const percentage = (currentScore / maxScore) * 100;

    const colorStops = [
      { percent: 0, colors: ['#a2c7ff', '#7cb1ffff'] },
      { percent: 40, colors: ['#89b8ff', '#65a2feff'] },
      { percent: 80, colors: ['#71a9feff', '#4891ffff'] },
    ];

    if (percentage < 40) return colorStops[0].colors;
    if (percentage < 80) return colorStops[1].colors;
    return colorStops[2].colors;
  };

  const interpolateColor = (color1: string, color2: string, factor: number) => {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const rgbToHex = (r: number, g: number, b: number) => {
      return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
    };

    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    const r = c1.r + factor * (c2.r - c1.r);
    const g = c1.g + factor * (c2.g - c1.g);
    const b = c1.b + factor * (c2.b - c1.b);

    return rgbToHex(r, g, b);
  };

  const getTimerColor = (progress: number) => {
    const green = '#4CAF50';
    const orange = '#FFB000'; 
    const red = '#FF3030';

    if (progress > 0.5) {
      const factor = (1.0 - progress) / 0.5;
      return interpolateColor(green, orange, factor);
    } else {
      const factor = (0.5 - progress) / 0.5;
      return interpolateColor(orange, red, factor);
    }
  };

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

  useEffect(() => {
    const listener = progressAnim.addListener(({ value }) => {
      setAnimatedProgress(value);
    });

    return () => {
      progressAnim.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    const createWaveAnimation = (animValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
    };

    const wave1Anim = createWaveAnimation(waveAnimation1, 1800);
    const wave2Anim = createWaveAnimation(waveAnimation2, 1500);

    waveAnimation2.setValue(0.5);
    
    wave1Anim.start();
    wave2Anim.start();

    return () => {
      wave1Anim.stop();
      wave2Anim.stop();
    };
  }, []);

  useEffect(() => {
    if (!showAnimation) {
      setAnimatedScore(score);
      waterLevelAnimation.setValue(waterLevel);
      return;
    }

    const scoreAnim = Animated.timing(scoreAnimation, {
      toValue: score,
      duration: 1000,
      useNativeDriver: false,
    });

    const waterAnim = Animated.timing(waterLevelAnimation, {
      toValue: waterLevel,
      duration: 1200,
      useNativeDriver: false,
    });

    Animated.parallel([scoreAnim, waterAnim]).start();

    const listener = scoreAnimation.addListener(({ value }) => {
      setAnimatedScore(Math.round(value));
    });

    return () => {
      scoreAnimation.removeListener(listener);
    };
  }, [score, waterLevel, showAnimation]);

  const gradientColors = getGradientColors(animatedScore);
  const timerColor = getTimerColor(animatedProgress);
  const strokeDashoffset = animatedProgress * CIRCUMFERENCE;
  const containerSize = (RADIUS + STROKE_WIDTH) * 2;

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          width: containerSize, 
          height: containerSize,
        },
        style
      ]}
    >
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]}>
        <Svg 
          width={containerSize} 
          height={containerSize}
          style={StyleSheet.absoluteFillObject}
        >
          <Circle
            cx={containerSize / 2}
            cy={containerSize / 2}
            r={RADIUS}
            stroke={"rgba(150,150,150,0.3)"}
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
          />
          
          <Circle
            cx={containerSize / 2}
            cy={containerSize / 2}
            r={RADIUS}
            stroke={timerColor}
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE - strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${containerSize / 2} ${containerSize / 2})`}
          />
        </Svg>
      </View>

      <View style={[
        styles.waterScoreContainer, 
        { 
          width: size, 
          height: size,
          top: (containerSize - size) / 2,
          left: (containerSize - size) / 2,
        }
      ]}>
        <View style={[styles.outerCircle, { width: size, height: size, borderRadius: radius }]}>
          
          <Animated.View 
            style={[
              styles.waveContainer,
              {
                bottom: 0,
                height: waterLevelAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [size * 0.2, size],
                }),
                overflow: 'hidden',
              }
            ]}
          >
            <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
              <Defs>
                <ClipPath id="circleClip">
                  <Circle cx={center} cy={center} r={radius - 3} />
                </ClipPath>
              </Defs>
              
              <Animated.View
                style={{
                  transform: [{
                    translateX: waveAnimation1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-size, 0],
                    })
                  }]
                }}
              >
                <Svg width={size * 2} height={size}>
                  <Defs>
                    <LinearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor={gradientColors[0]} />
                      <Stop offset="100%" stopColor={gradientColors[1]} />
                    </LinearGradient>
                  </Defs>

                  <Path
                    d={`M0,${size * 0.08} Q${size * 0.25},0 ${size * 0.5},${size * 0.08} T${size},${size * 0.08} T${size * 1.5},${size * 0.08} T${size * 2},${size * 0.08} V${size} H0 Z`}
                    fill="url(#waveGradient)"
                    clipPath="url(#circleClip)"
                  />
                </Svg>
              </Animated.View>
              
              <Animated.View
                style={{
                  transform: [{
                    translateX: waveAnimation2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -size],
                    })
                  }]
                }}
              >
   
              </Animated.View>
            </Svg>
          </Animated.View>

          <View style={styles.scoreContainer}>
            <Text 
              style={[
                styles.scoreText, 
                { 
                  fontSize: size * 0.18,
                  color: waterLevel >= 0.55 ? 'white' : '#1890FF',
                  textShadowColor: waterLevel >= 0.55 ? 'rgba(0,0,0,0.6)' : 'transparent',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 3,
                }
              ]}
            >
              {animatedScore.toLocaleString()}
            </Text>
            <Text 
              style={[
                styles.labelText, 
                { 
                  fontSize: size * 0.1,
                  color: waterLevel >= 0.3 ? 'rgba(255,255,255,0.9)' : '#1890FF',
                  textShadowColor: waterLevel >= 0.3 ? 'rgba(0,0,0,0.6)' : 'transparent',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 3,
                }
              ]}
            >
              分數
            </Text>
          </View>

          <View style={[styles.gloss, { width: size * 0.5, height: size * 0.25, top: size * 0.15 }]} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 30,
  },
  waterScoreContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    backgroundColor: 'white',
    position: 'relative',
    overflow: 'hidden',
  },
  waveContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  scoreContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 1000,
  },
  scoreText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  labelText: {
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  gloss: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
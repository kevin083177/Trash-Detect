import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Dimensions, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, ClipPath, Path } from 'react-native-svg';

interface WaterScoreProps {
  score: number;
  maxScore?: number;
  size?: number;
  style?: any;
  showAnimation?: boolean;
}

export const WaterScore: React.FC<WaterScoreProps> = ({
  score,
  maxScore = 2000,
  size = 120,
  style,
  showAnimation = true
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const waveAnimation1 = useRef(new Animated.Value(0)).current;
  const waveAnimation2 = useRef(new Animated.Value(0)).current;
  const scoreAnimation = useRef(new Animated.Value(0)).current;
  const waterLevelAnimation = useRef(new Animated.Value(0)).current;
  
  // 計算水位百分比 (0-1)
  const waterLevel = Math.min(score / maxScore, 1);
  
  // 根據分數決定水的顏色
  const getWaterColors = (currentScore: number) => {
    const percentage = (currentScore / maxScore) * 100;
    if (percentage >= 80) return { primary: '#2980b9', secondary: '#3498db' };
    if (percentage >= 60) return { primary: '#3498db', secondary: '#5dade2' };
    if (percentage >= 40) return { primary: '#5dade2', secondary: '#85c1e9' };
    if (percentage >= 20) return { primary: '#85c1e9', secondary: '#aed6f1' };
    return { primary: '#aed6f1', secondary: '#d6eaf8' };
  };

  // 波浪動畫
  useEffect(() => {
    const createWaveAnimation = (animValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        })
      );
    };

    const wave1Anim = createWaveAnimation(waveAnimation1, 3000);
    const wave2Anim = createWaveAnimation(waveAnimation2, 4000);

    wave1Anim.start();
    wave2Anim.start();

    return () => {
      wave1Anim.stop();
      wave2Anim.stop();
    };
  }, []);

  // 分數變化動畫
  useEffect(() => {
    if (!showAnimation) {
      setAnimatedScore(score);
      waterLevelAnimation.setValue(waterLevel);
      return;
    }

    // 分數數字動畫
    const scoreAnim = Animated.timing(scoreAnimation, {
      toValue: score,
      duration: 1000,
      useNativeDriver: false,
    });

    // 水位動畫
    const waterAnim = Animated.timing(waterLevelAnimation, {
      toValue: waterLevel,
      duration: 1200,
      useNativeDriver: false,
    });

    Animated.parallel([scoreAnim, waterAnim]).start();

    // 監聽分數動畫來更新顯示的分數
    const listener = scoreAnimation.addListener(({ value }) => {
      setAnimatedScore(Math.round(value));
    });

    return () => {
      scoreAnimation.removeListener(listener);
    };
  }, [score, waterLevel, showAnimation]);

  const colors = getWaterColors(animatedScore);
  const radius = size / 2;
  const center = radius;

  // 生成波浪路徑
  const generateWavePath = (animatedValue: Animated.Value, amplitude: number, frequency: number, offset: number) => {
    return animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [
        `M0,${radius} Q${radius/4},${radius - amplitude} ${radius/2},${radius} T${radius},${radius} T${radius*1.5},${radius} T${radius*2},${radius} V${size} H0 Z`,
        `M0,${radius} Q${radius/4},${radius + amplitude} ${radius/2},${radius} T${radius},${radius} T${radius*1.5},${radius} T${radius*2},${radius} V${size} H0 Z`
      ]
    });
  };

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* 外圈容器 */}
      <View style={[styles.outerCircle, { width: size, height: size, borderRadius: radius }]}>
        
        {/* SVG 波浪效果 */}
        <Animated.View 
          style={[
            styles.waveContainer,
            {
              bottom: waterLevelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, size * 0.85], // 水位從底部到85%高度
              }),
              height: waterLevelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [size * 0.15, size], // 水的高度
              }),
            }
          ]}
        >
          <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
            <Defs>
              <LinearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={colors.secondary} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={colors.primary} stopOpacity="1" />
              </LinearGradient>
              <ClipPath id="circleClip">
                <Circle cx={center} cy={center} r={radius - 3} />
              </ClipPath>
            </Defs>
            
            {/* 主要水體 */}
            <Circle 
              cx={center} 
              cy={center} 
              r={radius - 3} 
              fill="url(#waterGradient)"
              clipPath="url(#circleClip)"
            />
            
            {/* 波浪層1 */}
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
                <Path
                  d={`M0,${size * 0.1} Q${size * 0.25},0 ${size * 0.5},${size * 0.1} T${size},${size * 0.1} T${size * 1.5},${size * 0.1} T${size * 2},${size * 0.1} V${size} H0 Z`}
                  fill="rgba(255,255,255,0.2)"
                  clipPath="url(#circleClip)"
                />
              </Svg>
            </Animated.View>
            
            {/* 波浪層2 */}
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
              <Svg width={size * 2} height={size}>
                <Path
                  d={`M0,${size * 0.05} Q${size * 0.2},${size * 0.15} ${size * 0.4},${size * 0.05} T${size * 0.8},${size * 0.05} T${size * 1.2},${size * 0.05} T${size * 1.6},${size * 0.05} T${size * 2},${size * 0.05} V${size} H0 Z`}
                  fill="rgba(255,255,255,0.15)"
                  clipPath="url(#circleClip)"
                />
              </Svg>
            </Animated.View>
          </Svg>
        </Animated.View>

        {/* 分數顯示 */}
        <View style={styles.scoreContainer}>
          <Text 
            style={[
              styles.scoreText, 
              { 
                fontSize: size * 0.2,
                color: waterLevel > 0.5 ? 'white' : '#2c3e50',
                textShadowColor: waterLevel > 0.5 ? 'rgba(0,0,0,0.3)' : 'transparent',
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
                fontSize: size * 0.08,
                color: waterLevel > 0.5 ? 'rgba(255,255,255,0.8)' : '#7f8c8d',
              }
            ]}
          >
            分數
          </Text>
        </View>

        {/* 光澤效果 */}
        <View style={[styles.gloss, { width: size * 0.6, height: size * 0.3, top: size * 0.1 }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    backgroundColor: '#ecf0f1',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 10,
    position: 'relative',
  },
  waveContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  scoreContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1000,
  },
  scoreText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  labelText: {
    textAlign: 'center',
    marginTop: 2,
  },
  gloss: {
    position: 'absolute',
    left: '20%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1000,
    opacity: 0.6,
  },
});
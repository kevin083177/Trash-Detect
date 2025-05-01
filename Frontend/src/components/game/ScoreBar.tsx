import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, StyleProp, ViewStyle, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScoreProgressBarProps {
  score: number;
  style: StyleProp<ViewStyle>;
}

export const ScoreBar = ({ 
  score, 
  style
}: ScoreProgressBarProps) => {
    const totalScore = 2000;
    const starThresholds = [600, 1000, 1600];
    // Animation values
    const progressAnim = useRef(new Animated.Value(0)).current;
    const starAnims = useRef(starThresholds.map(() => new Animated.Value(1))).current;

    // Track which stars have been activated to avoid repeating animations
    const activatedStarsRef = useRef<boolean[]>(starThresholds.map(() => false));

    useEffect(() => {
        // Animate progress bar based on score
        Animated.timing(progressAnim, {
        toValue: Math.min(score / totalScore, 1),
        duration: 800,
        useNativeDriver: false,
        }).start();
        
        // Check if any star thresholds have been reached
        starThresholds.forEach((threshold, index) => {
        if (score >= threshold && !activatedStarsRef.current[index]) {
            activatedStarsRef.current[index] = true;
            
            // Create star pulse animation
            Animated.sequence([
            Animated.timing(starAnims[index], {
                toValue: 1.5, // Scale up
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(starAnims[index], {
                toValue: 1, // Scale back to normal
                duration: 300,
                useNativeDriver: true,
            }),
            ]).start();
        }
        });
    }, [score]);

    // Calculate positions for stars based on their thresholds
    const getStarPosition = (threshold: number): `${number}%` => {
        return `${(threshold / totalScore) * 100}%`;
    };

    // 計算進度百分比，但最小為3%，最大為97%（保證文字不超出容器）
    const scoreBubblePosition = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['3%', '97%']
    });

    return (
        <View style={[styles.container, style]}>            
            {/* Progress bar track */}
            <View style={styles.progressTrack}>
                {/* Progress fill */}
                <Animated.View 
                style={[
                    styles.progressFill, 
                    { 
                    width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%']
                    }),
                    backgroundColor: progressAnim.interpolate({
                        inputRange: [0, 0.3, 0.5, 0.8],
                        outputRange: ['#4A6CFA', '#4A9CFA', '#49CCB2', '#6BD465']
                    })
                    }
                ]} 
                />
                
                {/* 分數氣泡 - 跟隨進度條移動 */}
                <Animated.View style={[
                    styles.scoreBubble,
                    {
                        left: scoreBubblePosition
                    }
                ]}>
                    <Text style={styles.scoreText}>{score}</Text>
                </Animated.View>
                
                {/* Star markers */}
                {starThresholds.map((threshold, index) => (
                <Animated.View 
                    key={`star-${index}`}
                    style={[
                    styles.starContainer,
                    { 
                        left: getStarPosition(threshold),
                        transform: [{ scale: starAnims[index] }] 
                    }
                    ]}
                >
                    <Image
                        source={ score >= threshold ? require('@/assets/images/Star.png') : require('@/assets/images/Star_Disable.png')}
                        style={styles.starsImage}
                    />
                </Animated.View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 16,
        marginVertical: 10,
    },
    progressTrack: {
        height: 12,
        backgroundColor: '#E0E7FF',
        borderRadius: 6,
        overflow: 'visible',
        position: 'relative',
        marginTop: 20, // 為分數氣泡留出空間
    },
    progressFill: {
        height: '100%',
        borderRadius: 6,
        position: 'absolute',
        left: 0,
        top: 0,
    },
    starContainer: {
        position: 'absolute',
        top: -12,
        alignItems: 'center',
        transform: [{ translateX: -12 }],
    },
    starsImage: {
        width: 24,
        height: 24,
    },
    scoreBubble: {
        position: 'absolute',
        top: -30,
        backgroundColor: '#667EEA',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ translateX: -20 }], // 調整水平居中
    },
    scoreText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
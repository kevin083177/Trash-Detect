import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';

interface TimerProps {
  duration: number; // 總持續時間（秒）
  currentTime: number; // 當前剩餘時間（秒）
  isRunning: boolean; // 是否正在運行
  style?: StyleProp<ViewStyle>; // 可選的容器樣式
}

export const Timer: React.FC<TimerProps> = ({ 
  duration, 
  currentTime, 
  isRunning,
  style 
}) => {
  // 使用這個動畫值來控制進度條寬度
  const timerAnim = useRef(new Animated.Value(1)).current;
  
  // 記錄動畫實例，用於必要時停止
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  // 記錄是否已經啟動了動畫
  const hasStartedAnimation = useRef(false);
  
  // 記錄上一次的運行狀態
  const wasRunning = useRef(false);

  const timeRatio = currentTime / duration;

  const animatedColor = timerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#EA1001', '#F4C100', '#01F510']
  });

  // 處理動畫啟動和停止
  useEffect(() => {
    // 如果狀態從非運行變為運行，或者是首次運行
    if (isRunning && (!wasRunning.current || !hasStartedAnimation.current)) {
      // 設置動畫初始值為1（100%填充）
      timerAnim.setValue(1);
      
      // 清除任何現有動畫
      if (animationRef.current) {
        animationRef.current.stop();
      }
      
      // 創建從1到0的連續動畫，持續總時間
      animationRef.current = Animated.timing(timerAnim, {
        toValue: 0,
        duration: duration * 1000, // 總秒數轉換為毫秒
        useNativeDriver: false
      });
      
      // 啟動動畫
      animationRef.current.start();
      
      // 標記已啟動動畫
      hasStartedAnimation.current = true;
    } 
    // 如果狀態從運行變為非運行
    else if (!isRunning && wasRunning.current) {
      // 暫停動畫
      if (animationRef.current) {
        animationRef.current.stop();
      }
      
      // 標記動畫尚未啟動
      hasStartedAnimation.current = false;
    }
    
    // 更新上一次的運行狀態
    wasRunning.current = isRunning;
    
    // 組件卸載時的清理
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [isRunning, duration, timerAnim]);
  
  // 當進入新的問題時（重置計時器）
  useEffect(() => {
    // 如果計時器重置到初始狀態
    if (currentTime === duration) {
      // 重置動畫狀態
      hasStartedAnimation.current = false;
      
      // 如果動畫正在運行，則重啟動畫
      if (isRunning) {
        // 清除現有動畫
        if (animationRef.current) {
          animationRef.current.stop();
        }
        
        // 設置動畫初始值
        timerAnim.setValue(1);
        
        // 創建新的完整動畫
        animationRef.current = Animated.timing(timerAnim, {
          toValue: 0,
          duration: duration * 1000,
          useNativeDriver: false
        });
        
        // 啟動動畫
        animationRef.current.start();
        
        // 標記已啟動
        hasStartedAnimation.current = true;
      }
    }
  }, [currentTime, duration, isRunning, timerAnim]);

  return (
    <View style={[styles.timerContainer, style]}>
      <Animated.View
        style={[
          styles.timerBar,
          { 
            width: timerAnim.interpolate({ 
              inputRange: [0, 1], 
              outputRange: ['0%', '100%'] 
            }),
            backgroundColor: animatedColor // 使用動畫顏色
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    width: '100%',
    height: 10,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  timerBar: {
    height: '100%',
  }
});
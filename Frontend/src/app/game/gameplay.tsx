import React, { useEffect, useState, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, SafeAreaView, Easing, ImageBackground, BackHandler, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import { Question } from '@/interface/Question';
import { asyncPut } from '@/utils/fetch';
import { user_level_api } from '@/api/api';
import { tokenStorage } from '@/utils/tokenStorage';
import { Timer } from '@/components/game/Timer';
import { WaterScore } from '@/components/game/WaterScore';
import { BlurView } from 'expo-blur';

// 階段型別
type Phase = 'show-info' | 'show-question' | 'show-options' | 'game-ended';

export default function Gameplay() {
  const params = useLocalSearchParams();

  const levelBackground = params.levelBackground as string;
  const levelId = Number(params.levelId);
  const initialQuestions = useMemo(() => {
    try { return JSON.parse(params.questions as string); } catch { return []; }
  }, [params.questions]);
  
  const isFirstLoad = useRef<boolean>(true);
  const isGameEnd = useRef<boolean>(false);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(8);
  const [displayTimer, setDisplayTimer] = useState(8);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number | null>>({});
  const [phase, setPhase] = useState<Phase>('show-info');
  
  const infoFade = useRef(new Animated.Value(0)).current;
  const questionFade = useRef(new Animated.Value(0)).current;
  const optionsFade = useRef(new Animated.Value(0)).current;
  const scoreAnimRef = useRef(new Animated.Value(0)).current;
  const waterScoreVisible = useRef(new Animated.Value(0)).current; // 新增水分數顯示動畫
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const safeSetTimeout = (callback: () => void, delay: number): NodeJS.Timeout => {
    const timeoutId = setTimeout(() => {
      if (!isGameEnd.current) {
        callback();
      }
    }, delay);
    timeoutsRef.current.push(timeoutId);
    return timeoutId;
  };

  // Clear all timeouts
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  // 確保在組件渲染前完成初始化
  useLayoutEffect(() => {
    resetAllGameState();
    
    // 是否為第一次加載
    isFirstLoad.current = false;
    
    // 顯示水分數組件
    Animated.timing(waterScoreVisible, {
      toValue: 1,
      duration: 800,
      delay: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    
    // Cleanup function
    return () => {
      clearAllTimeouts();
      clearTimers();
    };
  }, []);
  
  // Handle component unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
      clearTimers();
    };
  }, []);
  
  // 重置所有狀態
  const resetAllGameState = () => {
    // Reset the game ended flag
    isGameEnd.current = false;
    
    setQuestions(initialQuestions);
    setAnsweredCount(0);
    setScore(0);
    setTimer(8);
    setDisplayTimer(8);
    setIsAnswered(false);
    setIsTimerRunning(false);
    setSelectedOptions({});
    setPhase('show-info');
    
    // 重置動畫
    infoFade.setValue(0);
    questionFade.setValue(0);
    optionsFade.setValue(0);
    scoreAnimRef.setValue(0);
    waterScoreVisible.setValue(0);
    
    clearTimers();
    clearAllTimeouts();
  };

  // 當前問題索引
  const currentIndex = answeredCount;
  const currentQuestion = questions[currentIndex];

  // 階段淡入
  useEffect(() => {
    // Skip animation if game has ended
    if (isGameEnd.current || phase === 'game-ended') return;
    
    let anim: Animated.CompositeAnimation | null = null;
    
    // 顯示題數
    if (phase !== 'show-info') infoFade.setValue(0);
    
    // 顯示題目 或 選項
    if (phase !== 'show-question' && phase !== 'show-options') questionFade.setValue(0);
    
    if (phase !== 'show-options') optionsFade.setValue(0);
    
    if (phase === 'show-info') {
      infoFade.setValue(0);
      anim = Animated.timing(infoFade, { 
        toValue: 1, 
        duration: 500, 
        delay: 100, 
        easing: Easing.out(Easing.ease), 
        useNativeDriver: true 
      });
    } else if (phase === 'show-question') {
      questionFade.setValue(0);
      anim = Animated.timing(questionFade, { 
        toValue: 1, 
        duration: 500, 
        delay: 100, 
        easing: Easing.out(Easing.ease), 
        useNativeDriver: true 
      });
    } else if (phase === 'show-options') {
      optionsFade.setValue(0);
      anim = Animated.timing(optionsFade, { 
        toValue: 1, 
        duration: 500, 
        delay: 100, 
        easing: Easing.out(Easing.ease), 
        useNativeDriver: true 
      });
    }
    
    // 啟動動畫
    if (anim) {
      anim.start();
    }
  }, [phase]);

  useEffect(() => {
    // Skip if game has ended
    if (isGameEnd.current) return;
    
    // Skip if no questions or index out of range
    if (!questions.length || currentIndex >= questions.length) return;
    
    // 首先重置階段
    resetPhase();
    setPhase('show-info');
    
    // 設置延時顯示問題
    const t1 = safeSetTimeout(() => {
      if (isGameEnd.current) return;
      setPhase('show-question');
    }, 1500);
    
    // 設置延時顯示選項和啟動計時器
    const t2 = safeSetTimeout(() => {
      if (isGameEnd.current) return;
      setPhase('show-options');
      // 確保在進入options階段時才啟動計時器
      safeSetTimeout(() => {
        if (isGameEnd.current) return;
        startCountdown();
      }, 100); // 短暫延遲確保UI已更新
    }, 2500);
    
    // No need for cleanup here as we're using safeSetTimeout
  }, [currentIndex, questions]);

  const resetPhase = () => {
    // 清理計時器
    clearTimers();
    
    // 重置狀態
    setTimer(8);
    setDisplayTimer(8);
    setIsAnswered(false);
    setIsTimerRunning(false);
  };

  const clearTimers = () => {
    // 清除間隔計時器
    if (timerRef.current) { 
      clearInterval(timerRef.current); 
      timerRef.current = null; 
    }
    
    // 確保計時器動畫停止
    setIsTimerRunning(false);
  };

  // 計時器相關邏輯
  const startCountdown = () => {
    // Skip if game has ended
    if (isGameEnd.current) return;
    
    // 首先重置計時器狀態
    setTimer(8);
    setDisplayTimer(8);
    
    // 啟動運行狀態
    setIsTimerRunning(true);
    
    // 設置計時間隔
    timerRef.current = setInterval(() => {
      // Skip if game has ended
      if (isGameEnd.current) {
        clearTimers();
        return;
      }
      
      setTimer(prev => {
        const next = prev - 1;
        // 更新顯示時間
        setDisplayTimer(Math.max(next, 0));
        
        // 當計時到0時
        if (next <= 0) {
          // 清除計時器但保持運行狀態為true，讓動畫完成最後階段
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          // 1秒後，如果還沒有回答，則自動處理為超時
          safeSetTimeout(() => {
            if (!isAnswered && !isGameEnd.current) {
              handleAnswer(-1);
            }
          }, 1000);
        }
        
        return next <= 0 ? 0 : next;
      });
    }, 1000);
  };

  // 時間到自動答錯
  useEffect(() => {
    if (isGameEnd.current) return;
    
    if (phase === 'show-options' && displayTimer === 0 && !isAnswered) {
      handleAnswer(-1);
    }
  }, [displayTimer, phase, isAnswered]);

  const handleAnswer = (optionIndex: number) => {
    if (isGameEnd.current || isAnswered) return;
    
    clearTimers();
    setIsAnswered(true);
    
    setSelectedOptions(prev => ({ ...prev, [currentIndex]: optionIndex }));
  
    const correct = optionIndex === currentQuestion?.correctOptionIndex;
    if (correct) {
      const gained = 200 - (8 - timer - 1) * 25;
      
      const newScore = score + gained;
      setScore(newScore);
      
      console.log(`答對! 此題得分: ${gained}, 新總分: ${newScore}`);
      
      Animated.sequence([
        Animated.timing(scoreAnimRef, { 
          toValue: 1, 
          duration: 300, 
          useNativeDriver: true 
        }),
        Animated.delay(1400),
        Animated.timing(scoreAnimRef, { 
          toValue: 0, 
          duration: 300, 
          useNativeDriver: true 
        }),
      ]).start(() => {
        if (!isGameEnd.current) {
          requestAnimationFrame(() => moveNext(newScore));
        }
      });
    } else {
      console.log(`答錯! 維持總分: ${score}`);
      safeSetTimeout(() => moveNext(score), 1500);
    }
  };

  const moveNext = (currentScore: number) => {
    if (isGameEnd.current) return;
    
    console.log(`回答題數: ${answeredCount + 1} 題`);
    const nextCount = answeredCount + 1;
    
    if (nextCount >= questions.length) {
      finishGame(currentScore);
    } else {
      safeSetTimeout(() => {
        if (!isGameEnd.current) {
          setAnsweredCount(nextCount);
        }
      }, 1000);
    }
  };

  const finishGame = async (finalScore: number) => {
    isGameEnd.current = true;
    
    setPhase('game-ended');
    
    clearTimers();
    clearAllTimeouts();
    
    // 1600 分 3 顆星 1000 分 2 顆星 600 分 1 顆星
    const stars = finalScore >= 1600 ? 3 : finalScore >= 1000 ? 2 : finalScore >= 600 ? 1 : 0;
    
    console.log(`遊戲結束! 最終分數: ${finalScore}, 獲得星星: ${stars}`);
    
    try {
      const token = await tokenStorage.getToken();
      await asyncPut(user_level_api.update_level, {
        headers: { Authorization: `Bearer ${token}` },
        body: { sequence: levelId, score: finalScore, stars },
      });
    } catch (error) {
      console.error("Error updating level progress:", error);
    }
    
    setTimeout(() => {
      router.push({ 
        pathname: '/game/result', 
        params: { score: finalScore, stars } 
      });
    }, 500);
  };

  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        if (!isGameEnd.current) { // 如果遊戲尚未結束
          Alert.alert(
            "離開遊戲", 
            "您確定要退出遊戲嗎？您的進度將不會被保存。",
            [
              { text: "取消", style: "cancel", onPress: () => {} },
              { 
                text: "離開", 
                style: "destructive", 
                onPress: () => handleExit() 
              }
            ]
          );
          return true; // 防止默認返回行為
        }
        return false; // 遊戲已結束時允許返回
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove(); // 清理事件監聽器
    }, [])
  );
  
  // 添加 componentWillUnmount 處理在返回時清理資源
  useEffect(() => {
    return () => {
      // 確保在組件卸載時清理所有資源
      clearAllTimeouts();
      clearTimers();
      // 確保所有動畫都被停止
      infoFade.stopAnimation();
      questionFade.stopAnimation();
      optionsFade.stopAnimation();
      scoreAnimRef.stopAnimation();
      waterScoreVisible.stopAnimation();
    };
  }, []);

  // 修改 handleExit 函數以提供確認提示
  const handleExit = () => {
    // 設置遊戲結束標誌
    isGameEnd.current = true;
    
    // 清理計時器和超時
    clearTimers(); 
    clearAllTimeouts();
    
    // 停止所有動畫
    infoFade.stopAnimation();
    questionFade.stopAnimation();
    optionsFade.stopAnimation();
    scoreAnimRef.stopAnimation();
    waterScoreVisible.stopAnimation();
    
    // 返回上一頁
    router.replace('/game');
  };

  const getOptionStyle = (i: number) => {
    const selected = selectedOptions[currentIndex];
    if (phase !== 'show-options' || !isAnswered) return styles.option;
    if (i === currentQuestion?.correctOptionIndex) return [styles.option, styles.correctOption];
    if (i === selected) return [styles.option, styles.incorrectOption];
    return styles.option;
  };

  if (!questions.length || currentIndex >= questions.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>目前無更多題目</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleExit}
          >
            <Text style={styles.backButtonText}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  // Don't render anything if game has ended
  if (isGameEnd.current || phase === 'game-ended') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>跳轉中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ImageBackground 
      // source={require('@/assets/images/Game_Background.png')} 
      // style={styles.backgroundImage}
      // resizeMode="cover"
    >
      {/* <BlurView intensity={70} style={StyleSheet.absoluteFill} tint="dark" /> */}
      <SafeAreaView style={styles.container}>
        {/* 液體波浪分數顯示組件 */}
        <Animated.View 
          style={[
            styles.waterScoreContainer,
            {
              opacity: waterScoreVisible,
              transform: [{
                scale: waterScoreVisible.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                })
              }]
            }
          ]}
        >
          <WaterScore 
            score={score} 
            maxScore={2000} 
            size={100}
            showAnimation={true}
          />
        </Animated.View>

        {/* 計時器只在顯示選項階段可見 */}
        {phase === 'show-options' && (
          <Animated.View 
            style={[
              styles.timerWrapper, 
              { opacity: optionsFade }
            ]}
          >
            <Timer
              duration={8}
              currentTime={displayTimer}
              isRunning={isTimerRunning}
              style={{paddingVertical: 20}}
            />
          </Animated.View>
        )}

        {phase === 'show-info' && (
          <Animated.View style={[styles.infoContainer, { opacity: infoFade }]}>
            <Text style={styles.infoText}>
              {currentIndex === questions.length - 1 
                ? "最後一題" 
                : `第 ${currentIndex + 1} 題`}
            </Text>
            <Text style={styles.categoryText}>{currentQuestion.category}</Text>
          </Animated.View>
        )}

        {(phase === 'show-question' || phase === 'show-options') && (
          <Animated.View style={[styles.questionContainer, { opacity: questionFade }]}>
            <Text style={styles.questionText}>{currentQuestion.content}</Text>
          </Animated.View>
        )}

        {phase === 'show-options' && (
          <Animated.View style={[styles.optionsContainer, { opacity: optionsFade }]}>
            {currentQuestion.options.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={getOptionStyle(idx)}
                onPress={() => handleAnswer(idx)}
                disabled={isAnswered}
              >
                <Text
                  style={[
                    styles.optionText,
                    isAnswered &&
                      (idx === currentQuestion.correctOptionIndex || idx === selectedOptions[currentIndex])
                      ? styles.whiteText
                      : null
                  ]}
                >
                {opt.text}
              </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const { height, width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  scoreBar: { padding: 20 },
  centerContent: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  errorText: { 
    fontSize: 18, 
    color: '#555',
    marginBottom: 20
  },
  loadingText: {
    fontSize: 18,
    color: '#555',
  },
  backButton: {
    backgroundColor: '#4A6CFA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // 新增的水分數容器樣式
  waterScoreContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },

  timerWrapper: { 
    position: 'absolute', 
    top: 0, 
    alignSelf: 'center', 
    width: '100%'
  },

  infoContainer: { position: 'absolute', top: height / 2 - 40, width: '100%', alignItems: 'center' },
  infoText: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  categoryText: { width: 100, height: 30, fontSize: 18, backgroundColor: '#a83432', borderRadius: 10, color: 'white', marginTop: 5, textAlign: 'center'},

  questionContainer: { 
    position: 'absolute', 
    top: 160, 
    width: '90%', 
    alignSelf: 'center', 
    height: 120, 
    justifyContent: 'center',
    borderRadius: 12,
    padding: 10,
  },
  questionText: { fontSize: 20, fontWeight: '500', textAlign: 'center', color: 'white', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },

  optionsContainer: { position: 'absolute', top: 400, width: '75%', alignSelf: 'center' },
  option: { 
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    padding: 16, 
    borderRadius: 12, 
    borderColor: '#',
    marginBottom: 12, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'space-between', 
  },
  correctOption: { borderColor: '#70AA42', backgroundColor: '#70AA42'},
  incorrectOption: { borderColor: '#E74C3C', backgroundColor: '#E74C3C' },
  optionText: { fontSize: 20, flex: 1, textAlign: 'center' },
  whiteText: { color: 'white' },
});
import React, { useEffect, useState, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, SafeAreaView, Easing, ImageBackground, BackHandler, Alert } from 'react-native';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import { Question } from '@/interface/Question';
import { Timer } from '@/components/game/Timer';
import { WaterScore } from '@/components/game/WaterScore';
import { ResultModal } from '@/components/game/ResultModal';
import { useUserLevel } from '@/hooks/userLevel';
import { asyncGet } from "@/utils/fetch";
import { question_api } from "@/api/api";
import { tokenStorage } from "@/utils/tokenStorage";

type Phase = 'show-info' | 'show-question' | 'show-options' | 'transitioning' | 'game-ended';

function getRandomQuestions(allQuestions: Question[], count: number): Question[] {
  const shuffled = [...allQuestions];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, count);
}

function shuffleOptions(questions: Question[]): Question[] {
  return questions.map(question => {
    const questionCopy = { ...question };
    
    const correctOption = questionCopy.options[questionCopy.correctOptionIndex];
    
    const optionsCopy = [...questionCopy.options];
    
    for (let i = optionsCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionsCopy[i], optionsCopy[j]] = [optionsCopy[j], optionsCopy[i]];
    }
    
    const newCorrectIndex = optionsCopy.findIndex(option => 
      option.id === correctOption.id
    );
    
    return {
      ...questionCopy,
      options: optionsCopy,
      correctOptionIndex: newCorrectIndex
    };
  });
}

export default function Gameplay() {
  const params = useLocalSearchParams();
  const { updateLevelProgress, updateCompletedChapter } = useUserLevel();

  const levelId = Number(params.levelId);
  const initialQuestions = useMemo(() => {
    try { 
      return JSON.parse(params.questions as string); 
    } catch { 
      return []; 
    }
  }, [params.questions]);

  const isChallenge = params.isChallenge === 'true';
  const chapterSequence = Number(params.chapterSequence);
  const chapterName = params.chapterName as string;
  const levelBackground = params.levelBackground as string;
  
  const categoryName = useMemo(() => {
    if (chapterName) return chapterName;
    if (initialQuestions.length > 0) {
      return initialQuestions[0].category + '篇';
    }
    return '';
  }, [chapterName, initialQuestions]);

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
  
  const [showResultModal, setShowResultModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalStars, setFinalStars] = useState(0);
  const [finalMoney, setFinalMoney] = useState(0);
  
  const infoFade = useRef(new Animated.Value(0)).current;
  const questionFade = useRef(new Animated.Value(0)).current;
  const optionsFade = useRef(new Animated.Value(0)).current;
  const scoreAnimRef = useRef(new Animated.Value(0)).current;
  const waterScoreVisible = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const hasNextLevel = useMemo(() => {
    if (isChallenge) return false;
    const currentLevelInChapter = ((levelId - 1) % 5) + 1;
    return currentLevelInChapter < 5;
  }, [isChallenge, levelId]);

  const setPhaseTimeout = (callback: () => void, delay: number): NodeJS.Timeout => {
    const timeoutId = setTimeout(() => {
      if (!isGameEnd.current) {
        callback();
      }
    }, delay);
    timeoutsRef.current.push(timeoutId);
    return timeoutId;
  };

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useLayoutEffect(() => {
    if (questions.length === 0) {
      setQuestions(initialQuestions);
    }
    
    resetAllGameState();
    
    isFirstLoad.current = false;
    
    return () => {
      clearAllTimeouts();
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (isFirstLoad.current === false && questions.length > 0) {
      Animated.timing(waterScoreVisible, {
        toValue: 1,
        duration: 800,
        delay: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [questions]);
  
  useEffect(() => {
    return () => {
      clearAllTimeouts();
      clearTimers();
    };
  }, []);
  
  const resetAllGameState = () => {
    isGameEnd.current = false;
    
    setAnsweredCount(0);
    setScore(0);
    setTimer(8);
    setDisplayTimer(8);
    setIsAnswered(false);
    setIsTimerRunning(false);
    setSelectedOptions({});
    setPhase('show-info');
    setShowResultModal(false);
    
    infoFade.setValue(0);
    questionFade.setValue(0);
    optionsFade.setValue(0);
    scoreAnimRef.setValue(0);
    waterScoreVisible.setValue(0);
    
    clearTimers();
    clearAllTimeouts();
    
    setTimeout(() => {
      Animated.timing(waterScoreVisible, {
        toValue: 1,
        duration: 800,
        delay: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, 100);
  };

  const currentIndex = answeredCount;
  const currentQuestion = questions[currentIndex];

  // 處理階段動畫
  useEffect(() => {
    if (isGameEnd.current || phase === 'game-ended') return;
    
    let anim: Animated.CompositeAnimation | null = null;
    
    if (phase !== 'show-info') infoFade.setValue(0);
    if (phase !== 'show-question' && phase !== 'show-options') questionFade.setValue(0);
    if (phase !== 'show-options') optionsFade.setValue(0);
    
    if (phase === 'show-info') {
      anim = Animated.timing(infoFade, { 
        toValue: 1, 
        duration: 400, 
        delay: 50, 
        easing: Easing.out(Easing.ease), 
        useNativeDriver: true 
      });
    } else if (phase === 'show-question') {
      anim = Animated.timing(questionFade, { 
        toValue: 1, 
        duration: 400, 
        delay: 50, 
        easing: Easing.out(Easing.ease), 
        useNativeDriver: true 
      });
    } else if (phase === 'show-options') {
      anim = Animated.timing(optionsFade, { 
        toValue: 1, 
        duration: 400, 
        delay: 50, 
        easing: Easing.out(Easing.ease), 
        useNativeDriver: true 
      });
    } else if (phase === 'transitioning') {
      Animated.parallel([
        Animated.timing(infoFade, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(questionFade, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(optionsFade, { toValue: 0, duration: 200, useNativeDriver: true })
      ]).start();
      return;
    }
    
    if (anim) {
      anim.start();
    }
  }, [phase]);

  useEffect(() => {
    if (isGameEnd.current) return;
    
    if (!questions.length || currentIndex >= questions.length) return;
    
    startNewQuestion();
    
  }, [currentIndex, questions]);

  const startNewQuestion = () => {
    resetPhase();
    setPhase('show-info');
    
    const t1 = setPhaseTimeout(() => {
      if (isGameEnd.current) return;
      setPhase('show-question');
    }, 1500);
    
    const t2 = setPhaseTimeout(() => {
      if (isGameEnd.current) return;
      setPhase('show-options');
      setPhaseTimeout(() => {
        if (isGameEnd.current) return;
        startCountdown(); 
      }, 100);
    }, 2500);
  };

  const resetPhase = () => {
    clearTimers();
    
    setTimer(8);
    setDisplayTimer(8);
    setIsAnswered(false);
    setIsTimerRunning(false);
  };

  const clearTimers = () => {
    if (timerRef.current) { 
      clearInterval(timerRef.current); 
      timerRef.current = null; 
    }
    
    setIsTimerRunning(false);
  };

  const startCountdown = () => {
    if (isGameEnd.current) return;
    setTimer(8);
    setDisplayTimer(8);
    
    setIsTimerRunning(true);
    
    timerRef.current = setInterval(() => {
      if (isGameEnd.current) {
        clearTimers();
        return;
      }
      
      setTimer(prev => {
        const next = prev - 1;
        setDisplayTimer(Math.max(next, 0));
        
        if (next <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          setPhaseTimeout(() => {
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
    console.log(currentQuestion?.correctOptionIndex);
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
          moveNext(newScore);
        }
      });
    } else {
      setPhaseTimeout(() => moveNext(score), 1500);
    }
  };

  const moveNext = (currentScore: number) => {
    if (isGameEnd.current) return;
    
    const nextCount = answeredCount + 1;
    
    if (nextCount >= questions.length) {
      finishGame(currentScore);
      return;
    }

    setPhase('transitioning');
    
    setPhaseTimeout(() => {
      if (!isGameEnd.current) {
        setAnsweredCount(nextCount);
      }
    }, 0);
  };
  
  const caculateMoney = (score: number) => {
    return Math.floor(score / 200) * 10;  
  }

  const finishGame = async (gameScore: number) => {
    isGameEnd.current = true;
    
    setPhase('game-ended');
    
    clearTimers();
    clearAllTimeouts();
    
    try {
      const stars = gameScore >= 1600 ? 3 : gameScore >= 1000 ? 2 : gameScore >= 600 ? 1 : 0;
      const money = caculateMoney(gameScore);

      await (isChallenge 
        ? updateCompletedChapter(chapterSequence, gameScore, money)
        : updateLevelProgress(levelId, gameScore)
      );

      setFinalScore(gameScore);
      setFinalStars(stars);
      setFinalMoney(money);
      
      setTimeout(() => {
        setShowResultModal(true);
      }, 500);

    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleBackToMenu = () => {
    setShowResultModal(false);
    router.replace('/game');
  };

  const handlePlayAgain = async () => {
    setShowResultModal(false);
    
    if (isChallenge) {
      try {
        const response = await asyncGet(`${question_api.get_question_by_category}${categoryName.slice(0, -2)}`, {
          headers: {
            "Authorization": `Bearer ${await tokenStorage.getToken()}`
          }
        });
        
        if (response.status === 200) {
          const allQuestions = response.body.map((q: any) => {
            const correctOptionIndex = q.options.findIndex(
              (option: any) => option.id === q.correct_answer
            );
            
            return {
              id: q._id,
              content: q.content,
              category: q.category,
              options: q.options.map((opt: any) => ({
                id: opt.id,
                text: opt.text
              })),
              correctOptionIndex: correctOptionIndex
            };
          });
          
          const selectedQuestions = getRandomQuestions(allQuestions, 10);
          const gameQuestions = shuffleOptions(selectedQuestions);
          
          resetAllGameState();
          setQuestions(gameQuestions);
        }
      } catch (error) {
        console.error("重新獲取題目失敗:", error);
        resetAllGameState();
      }
    } else {
      try {
        const response = await asyncGet(`${question_api.get_question_by_category}${categoryName.slice(0, -2)}`, {
          headers: {
            "Authorization": `Bearer ${await tokenStorage.getToken()}`
          }
        });
        
        if (response.status === 200) {
          const allLevelQuestions = extractQuestions(response.body, levelId);
          const selectedQuestions = getRandomQuestions(allLevelQuestions, 10);
          const gameQuestions = shuffleOptions(selectedQuestions);
          
          resetAllGameState();
          setQuestions(gameQuestions);
        }
      } catch (error) {
        console.error("重新獲取題目失敗:", error);
        resetAllGameState();
      }
    }
  };

  // 提取關卡問題的函數
  const extractQuestions = (questions: any[], levelSequence: number): Question[] => {
    const normalizedSequence = ((levelSequence - 1) % 5) + 1;
    const startIndex = (normalizedSequence - 1) * 20;
    const endIndex = startIndex + 20;
    
    const levelQuestions = questions.slice(startIndex, endIndex);
    
    return levelQuestions.map(q => {
      const correctOptionIndex = q.options.findIndex(
        (option: any) => option.id === q.correct_answer
      );
      
      return {
        id: q._id,
        content: q.content,
        category: q.category,
        options: q.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text
        })),
        correctOptionIndex: correctOptionIndex
      };
    });
  };

  const handleNextLevel = async () => {
    if (isChallenge) return;
    
    try {
      const nextLevelId = levelId + 1;
      
      if (!categoryName) {
        console.error("無法獲取章節名稱");
        Alert.alert("錯誤", "無法獲取章節信息，請返回重新選擇關卡。");
        return;
      }

      const response = await asyncGet(`${question_api.get_question_by_category}${categoryName.slice(0, -2)}`, {
        headers: {
          "Authorization": `Bearer ${await tokenStorage.getToken()}`
        }
      });
      
      if (response.status === 200) {
        const allLevelQuestions = extractQuestions(response.body, nextLevelId);
        const selectedQuestions = getRandomQuestions(allLevelQuestions, 10);
        const gameQuestions = shuffleOptions(selectedQuestions);
        
        setShowResultModal(false);
        
        router.replace({
          pathname: '/game/gameplay',
          params: {
            isChallenge: 'false',
            levelId: nextLevelId,
            chapterName: categoryName,
            levelBackground: levelBackground,
            questions: JSON.stringify(gameQuestions),
          }
        });
      } else {
        console.error("獲取下一關問題失敗:", response.message);
        Alert.alert("錯誤", "無法載入下一關，請稍後再試。");
      }
    } catch (error) {
      console.error("載入下一關時發生錯誤:", error);
      Alert.alert("錯誤", "載入下一關失敗，請檢查網路連接後再試。");
    }
  };

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (!isGameEnd.current && !showResultModal) {
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
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }, [showResultModal])
  );
  
  useEffect(() => {
    return () => {
      clearAllTimeouts();
      clearTimers();
      infoFade.stopAnimation();
      questionFade.stopAnimation();
      optionsFade.stopAnimation();
      scoreAnimRef.stopAnimation();
      waterScoreVisible.stopAnimation();
    };
  }, []);

  const handleExit = () => {
    isGameEnd.current = true;
    
    clearTimers(); 
    clearAllTimeouts();
    
    infoFade.stopAnimation();
    questionFade.stopAnimation();
    optionsFade.stopAnimation();
    scoreAnimRef.stopAnimation();
    waterScoreVisible.stopAnimation();
    
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

  return (
    <SafeAreaView style={styles.container}>
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

      {phase === 'show-info' && currentQuestion && (
        <Animated.View style={[styles.infoContainer, { opacity: infoFade }]}>
          <Text style={styles.infoText}>
            {currentIndex === questions.length - 1 
              ? "最後一題" 
              : `第 ${currentIndex + 1} 題`}
          </Text>
          <Text style={styles.categoryText}>{currentQuestion.category}</Text>
        </Animated.View>
      )}

      {(phase === 'show-question' || phase === 'show-options') && currentQuestion && (
        <Animated.View style={[styles.questionContainer, { opacity: questionFade }]}>
          <Text style={styles.questionText}>{currentQuestion.content}</Text>
        </Animated.View>
      )}

      {phase === 'show-options' && currentQuestion && (
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

      <ResultModal
        visible={showResultModal}
        isChallenge={isChallenge}
        score={finalScore}
        stars={finalStars}
        money={finalMoney}
        currentLevelId={levelId}
        hasNextLevel={hasNextLevel}
        onPlayAgain={handlePlayAgain}
        onBackToMenu={handleBackToMenu}
        onNextLevel={handleNextLevel}
      />
    </SafeAreaView>
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
  scoreBar: { 
    padding: 20
  },
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
  infoContainer: { 
    position: 'absolute', 
    top: height / 2 - 40, 
    width: '100%', 
    alignItems: 'center'
  },
  infoText: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: 'white'
  },
  categoryText: { 
    width: 100, 
    height: 30, 
    fontSize: 18, 
    backgroundColor: '#a83432', 
    borderRadius: 10, 
    color: 'white', 
    marginTop: 5, 
    textAlign: 'center'
  },
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
  questionText: { 
    fontSize: 20, 
    fontWeight: '500', 
    textAlign: 'center', 
    color: 'white', 
    textShadowColor: 'rgba(0, 0, 0, 0.75)', 
    textShadowOffset: { width: 1, height: 1 }, 
    textShadowRadius: 3
  },
  optionsContainer: { 
    position: 'absolute', 
    top: 400, 
    width: '75%', 
    alignSelf: 'center'
  },
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
  correctOption: { 
    borderColor: '#70AA42', 
    backgroundColor: '#70AA42'
  },
  incorrectOption: { 
    borderColor: '#E74C3C', 
    backgroundColor: '#E74C3C'
  },
  optionText: { 
    fontSize: 20, 
    flex: 1, 
    textAlign: 'center'
  },
  whiteText: { 
    color: 'white' 
  },
});
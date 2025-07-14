import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image, ImageBackground } from 'react-native';
import Toast from '@/components/Toast';
import dailyTips from '@/assets/data/daily_tips.json';
import { router } from 'expo-router';
import Headers from '@/components/Headers';
import { useUser } from '@/hooks/user';

export default function Index() {
  const [showToast, setShowToast] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info'
  });
  const [checkInStatus, setCheckInStatus] = useState<'success' | 'already' | 'error' | ''>('');
  const [countdown, setCountdown] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<any>(null);
  const countdownTimer = useRef<NodeJS.Timeout>();

  const { 
    fetchUserProfile, 
    getUsername, 
    getMoney, 
    dailyCheckIn, 
    checkDailyCheckInStatus 
  } = useUser();

  useEffect(() => {
    return () => {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const initializeIndex = async () => {
      try {
        await Promise.all([
          fetchUserProfile(),
          fetchUserCheckInStatus()
        ]);
      } catch (error) {
        console.error('Failed to initialize index:', error);
      }
    };
    
    initializeIndex();
  }, [fetchUserProfile]);

  const showToastMessage = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }

    setCurrentTipIndex((prevIndex) => 
      prevIndex >= dailyTips.tips.length - 1 ? 0 : prevIndex + 1
    );

    setShowToast(true);
    
    const animationSequence = Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]);

    animationRef.current = animationSequence;

    animationSequence.start(() => {
      setShowToast(false);
      animationRef.current = null;
    });
  };
  
  const fetchUserCheckInStatus = async () => {
    try {
      const response = await checkDailyCheckInStatus();
      switch (response.hasCheckedIn) {
        case true:
          setCheckInStatus('already');
          startCountdown();
          break;
        case false:
          setCheckInStatus('');
          break;
        default:
          setCheckInStatus('error');
          break;
      }
    } catch (error) {
      console.error('Failed to fetch check-in status:', error);
      setCheckInStatus('error');
      setNotification({
        visible: true,
        message: '無法取得簽到狀態，請檢查網路連線',
        type: 'error'
      });
    }
  };

  const calculateTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const startCountdown = () => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
    }

    countdownTimer.current = setInterval(() => {
      setCountdown(calculateTimeUntilMidnight());
    }, 1000);
  };

  const fetchDailyCheckIn = async () => {
    try {
      const response = await dailyCheckIn();

      if (response.success) {
        setCheckInStatus('already');
        setNotification({
          visible: true,
          message: response.message,
          type: 'success'
        });
        startCountdown();
        await fetchUserProfile();
      } else {
        if (response.alreadyCheckedIn) {
          setCheckInStatus('already');
          startCountdown();
          setNotification({
            visible: true,
            message: response.message,
            type: 'info'
          });
        } else {
          setCheckInStatus('error');
          setNotification({
            visible: true,
            message: response.message,
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Daily check-in failed:', error);
      setCheckInStatus('error');
      setNotification({
        visible: true,
        message: '簽到失敗，請檢查網路連線',
        type: 'error'
      });
    }
  };
  
  const handleDogPress = () => {
    router.replace('/game')
  }
  
  return (
    <View style={styles.container}>
      <Headers router={router} username={getUsername()} money={getMoney()} />
      
      <TouchableOpacity 
        style={styles.buildingArea}
        onPress={showToastMessage}
      >
        <ImageBackground
          source={{uri: "https://res.cloudinary.com/didzpclp3/image/upload/v1747209514/%E6%A9%98%E7%BA%8C%E5%88%86%E9%A1%9E/preview.png"}}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.dogButton} onPress={handleDogPress}>
        <Image source={require("@/assets/images/dog.png")} style={styles.dogImage} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.floatingDailySection}
        onPress={fetchDailyCheckIn}
      >
        <View style={styles.checkInContainer}>
          <Ionicons 
            name={checkInStatus === 'already' ? "checkmark-circle" : "checkmark-circle-outline"} 
            size={32} 
            color={checkInStatus === 'already' ? "#4CAF50" : "black"} 
          />
          <View>
            <Text style={styles.checkInText}>每日簽到</Text>
            {checkInStatus === 'already' && countdown && (
              <Text style={styles.countdownText}>{countdown}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <Animated.View 
        style={[
          styles.dailyKnowledgeContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })
              }
            ]
          }
        ]}
      >
        <View style={styles.dailyContent}>
          <Text style={styles.dailyText}>{dailyTips.tips[currentTipIndex]}</Text>
        </View>
      </Animated.View>
      
      <Toast
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onHide={() => setNotification(prev => ({ ...prev, visible: false }))}
        style={styles.toast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  toast: {
    zIndex: 100,
    elevation: 10,
  },
  dogButton: {
    position: 'absolute', 
    zIndex: 10,
    elevation: 4,
    bottom: 100,
    right: 100,
  },
  dogImage: {
    width: 150,
    height: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 30,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B7791F',
  },
  smallText: {
    fontSize: 12,
    color: '#4A5568',
    marginTop: 2,
    fontWeight: '500',
  },
  buildingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    zIndex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  buildingText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D3748',
  },
  floatingDailySection: {
    position: 'absolute',
    top: '15%',
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20,
  },
  dailyKnowledgeContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 50,
    elevation: 6,
  },
  dailyContent: {
    backgroundColor: '#E5E5E5',
    padding: 16,
    height: 150,
    borderRadius: 8,
    justifyContent: 'center',
  },
  dailyText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2D3748',
    lineHeight: 26,
  },
  checkInContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkInText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3748',
  },
  countdownText: {
    fontSize: 13,
    color: '#718096',
    marginTop: 4,
    fontWeight: '400',
  }
});
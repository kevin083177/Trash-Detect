import { user_api } from '@/api/api';
import { asyncGet, asyncPost } from '@/utils/fetch';
import { tokenStorage } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image, ImageBackground } from 'react-native';
import Toast from '@/components/Toast';
import dailyTips from '@/assets/data/daily_tips.json';
import { router } from 'expo-router';
import Headers from '@/components/Headers';

export default function Index() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [money, setMoney] = useState<number>(0);
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
  
  useEffect(() => {
    const getToken = async () => {
      const storedToken = await tokenStorage.getToken();
      setToken(storedToken);
    };
    getToken();
  }, []);

  useEffect(() => {
    return () => {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
      }
    };
  }, []);

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

  const fetchUserProfile = async () => {
    try {
      const user = await asyncGet(user_api.get_user, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (user) {
        setUsername(user.body.username);
        setMoney(user.body.money);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setNotification({
        visible: true,
        message: '無法取得資料，請檢查網路連線',
        type: 'error'
      });
    }
  }
  
  const fetchUserCheckInStatus = async () => {
    const response = await asyncGet(user_api.daily_check_in_status, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })
    switch (response.body.hasCheckedIn) {
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
  }

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchUserProfile();
        fetchUserCheckInStatus();
      }
    }, [token])
  );

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
      const response = await asyncPost(user_api.daily_check_in, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      switch (response.status) {
        case 200:
          setCheckInStatus('already');
          setNotification({
            visible: true,
            message: '簽到成功！',
            type: 'success'
          });
          startCountdown();
          fetchUserProfile();
          break;
        case 400:
          setCheckInStatus('already');
          startCountdown();
          setNotification({
            visible: true,
            message: `今天已經簽到過了！`,
            type: 'info'
          });
          break;
        case 500:
          setCheckInStatus('error');
          setNotification({
            visible: true,
            message: '伺服器異常，請稍後再試',
            type: 'error'
          });
          break;
        default:
          setCheckInStatus('error');
          setNotification({
            visible: true,
            message: '未知錯誤，請稍後再試',
            type: 'error'
          });
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
      <Headers router={router} username={username} money={money} />
      
      {/* Background Building Area - 最底層 (zIndex: 1) */}
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

      {/* Dog Image - 中間層 (zIndex: 10) */}
      <TouchableOpacity style={styles.dogButton} onPress={handleDogPress}>
        <Image source={require("@/assets/images/dog.png")} style={styles.dogImage} />
      </TouchableOpacity>

      {/* Floating Daily Check-in Section - 中間偏上層 (zIndex: 20) */}
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

      {/* Daily Knowledge Section - 次高層 (zIndex: 50) */}
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
      
      {/* Toast - 最高層 (zIndex: 100) */}
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
  // 新增 toast 樣式，設置最高層級
  toast: {
    zIndex: 100,
    elevation: 10,
  },
  // 修改 dog 樣式，設置中間層級
  dogButton: {
    position: 'absolute', 
    zIndex: 10, // 中間層級
    elevation: 4, // Android需要
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
    zIndex: 30, // 頭部應該在較高層級
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
    color: '#B7791F', // 金幣數字顏色
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
    elevation: 1, // 最低層級
    zIndex: 1, // 最低層級
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
  floatingDailySection: { // 每日簽到
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
    zIndex: 20, // 中間層級，比狗高一點
  },
  dailyKnowledgeContainer: { // 小知識
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 50, // 較高層級，但低於toast
    elevation: 6, // Android需要
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
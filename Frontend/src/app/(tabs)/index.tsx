import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Headers from '@/components/Headers';
import { useUser } from '@/hooks/user';
import { loadRoom, RoomData, ItemTransform } from '@/utils/roomStorage';
import { ProductCategory } from '@/interface/Product';

const { width, height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 62;
const HEADERS_HEIGHT = 50;

export default function Index() {
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
  const countdownTimer = useRef<NodeJS.Timeout>();

  const [roomData, setRoomData] = useState<RoomData>({
    selectedItems: {},
    itemTransforms: {}
  });

  const { 
    fetchUserProfile, 
    getUsername, 
    getMoney, 
    dailyCheckIn, 
    checkDailyCheckInStatus 
  } = useUser();

  const loadRoomData = async () => {
    try {
      const data = await loadRoom();
      setRoomData(data);
    } catch (error) {
      console.error('載入房間數據失敗:', error);
    }
  };

  const getItemTransform = (category: ProductCategory): ItemTransform => {
    return roomData.itemTransforms[category] as ItemTransform;
  };

  const renderRoomItems = () => {
    return Object.entries(roomData.selectedItems).map(([category, item]) => {
      if (!item || category === 'wallpaper' || category === 'box') return null;

      const categoryKey = category as ProductCategory;
      const transform = getItemTransform(categoryKey);

      return (
        <View
          key={categoryKey}
          style={[
            styles.roomItem,
            {
              left: transform.position.x - 30,
              top: transform.position.y - 30,
              transform: [
                { scale: transform.scale },
                { rotate: `${transform.rotation}deg` }
              ],
            }
          ]}
        >
          <Image
            source={{ uri: item.image?.url }}
            style={styles.roomItemImage}
            resizeMode="contain"
          />
        </View>
      );
    });
  };

  useEffect(() => {
    return () => {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const initialize = async () => {
        try {
          await Promise.all([
            fetchUserProfile(),
            fetchUserCheckInStatus(),
            loadRoomData()
          ]);
        } catch (error) {
          console.error('Failed to initialize index:', error);
        }
      };
      
      initialize();
    }, [fetchUserProfile])
  );
  
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
  
  return (
    <View style={styles.container}>
      <Headers router={router} username={getUsername()} money={getMoney()} />
      
      <View style={[styles.buildingArea, { height: height - HEADERS_HEIGHT - TAB_BAR_HEIGHT }]}>
        <ImageBackground
          source={{ uri: roomData.selectedItems.wallpaper?.image?.url }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          {renderRoomItems()}
        </ImageBackground>
      </View>

      <TouchableOpacity style={styles.dogButton} onPress={() => router.replace('/game')}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headersContainer: {
    backgroundColor: 'white',
    zIndex: 100,
  },
  dogButton: {
    position: 'absolute', 
    zIndex: 10,
    elevation: 4,
    bottom: 100,
  },
  dogImage: {
    width: 150,
    height: 150,
  },
  buildingArea: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  roomItem: {
    position: 'absolute',
    width: 60,
    height: 60,
    zIndex: 5,
  },
  roomItemImage: {
    width: 60,
    height: 60,
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
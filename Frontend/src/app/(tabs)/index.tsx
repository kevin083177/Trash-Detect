import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '@/hooks/user';
import { loadRoom, RoomData, hasRoom, ItemTransform, loadDefaultDecorations } from '@/utils/roomStorage';
import { ITEM_Z_INDEX, ProductCategory } from '@/interface/Product';
import { ImageSize } from '@/interface/Image';
import { tokenStorage } from '@/utils/tokenStorage';
import { useTheme } from '@/hooks/theme';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 50;

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

  const [imageSizes, setImageSizes] = useState<Partial<Record<ProductCategory, ImageSize>>>({});

  const { 
    fetchUserProfile, 
    dailyCheckIn, 
    checkDailyCheckInStatus 
  } = useUser();

  const { isDark } = useTheme();

  const loadRoomData = async () => {
    try {
      const room = await hasRoom();
      if (room) {
        const loadedRoom = await loadRoom();
        setRoomData(loadedRoom);
      } else {
        const defaultRoom = await loadDefaultDecorations(await tokenStorage.getToken() as string, width, height);
        setRoomData(defaultRoom);
      }
    } catch (error) {
      console.error('載入房間數據失敗:', error);
    }
  };

  useEffect(() => {
    const loadImageSizes = async () => {
      const newImageSizes: Partial<Record<ProductCategory, ImageSize>> = {};
      
      const promises = Object.entries(roomData.selectedItems).map(([category, item]) => {
        if (!item || category === 'wallpaper' || category === 'box' || !item.image?.url) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
          Image.getSize(
            item.image!.url,
            (imgWidth, imgHeight) => {
              const maxSize = 80;
              const ratio = Math.min(maxSize / imgWidth, maxSize / imgHeight);
              const displayWidth = imgWidth * ratio;
              const displayHeight = imgHeight * ratio;
              
              newImageSizes[category as ProductCategory] = {
                width: Math.round(displayWidth),
                height: Math.round(displayHeight)
              };
              resolve();
            },
            (error) => {
              console.log(`Failed to get image size for ${category}:`, error);
              newImageSizes[category as ProductCategory] = {
                width: 60,
                height: 60
              };
              resolve();
            }
          );
        });
      });

      await Promise.all(promises);
      setImageSizes(newImageSizes);
    };

    if (Object.keys(roomData.selectedItems).length > 0) {
      loadImageSizes();
    }
  }, [roomData.selectedItems]);

  const getItemSize = (category: ProductCategory): ImageSize => {
    return imageSizes[category] || { width: 60, height: 60 };
  };

  const renderRoomItems = () => {
    return Object.entries(roomData.selectedItems).map(([category, item]) => {
      if (!item || category === 'wallpaper' || category === 'box') return null;

      const categoryKey = category as ProductCategory;
      const transform = roomData.itemTransforms[categoryKey] as ItemTransform;
      const imageSize = getItemSize(categoryKey);
      const containerWidth = imageSize.width;
      const containerHeight = imageSize.height;
      const zIndex = transform.zIndex ?? ITEM_Z_INDEX[categoryKey];
      
      if (!transform || !transform.position) {
        return null;
      }

      return (
        <View
          key={categoryKey}
          style={[
            styles.roomItem,
            {
              left: transform.position.x - containerWidth / 2,
              top: transform.position.y - containerHeight / 2,
              width: containerWidth,
              height: containerHeight,
              transform: [
                { scale: transform.scale || 1 },
                { rotate: `${transform.rotation || 0}deg` }
              ],
              zIndex: zIndex,
            }
          ]}
        >
          <View style={[
            styles.imageWrapper,
            {
              width: containerWidth,
              height: containerHeight,
            }
          ]}>
            <Image
              source={{ uri: item.image?.url }}
              style={[
                {
                  width: imageSize.width,
                  height: imageSize.height,
                }
              ]}
              resizeMode="contain"
            />
          </View>
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
    <View style={[
      styles.container,
      isDark ? { backgroundColor: '#1C1C1E' } : { backgroundColor: '#fffcf6' }
    ]}>
      <TouchableOpacity style={[styles.iconContainer, {top: 20, right: 20}]} onPress={() => router.push('/backpack')}>
        <Image
          style={styles.icon}
          source={require("@/assets/icons/room.png")}
          resizeMode='contain'
        />
        <Text style={styles.iconText}>家具布置</Text>
      </TouchableOpacity>
      <View style={[styles.buildingArea, { height: height - TAB_BAR_HEIGHT }]}>
        <ImageBackground
          source={{ uri: roomData.selectedItems.wallpaper?.image?.url }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          {renderRoomItems()}
        </ImageBackground>
      </View>

      <TouchableOpacity style={styles.dogButton} onPress={() => null}>
        <Image source={require("@/assets/images/dog.png")} style={styles.dogImage} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.iconContainer, { top: 120, right: 20 }]}
        onPress={fetchDailyCheckIn}
      >
        <Image
          style={styles.icon}
          source={require("@/assets/icons/checkIn.png")}
          resizeMode="contain"
        />
        {checkInStatus === 'already' && countdown ? (
          <Text style={styles.iconText}>{countdown}</Text>
        ) : (
          <Text style={styles.iconText}>可簽到</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconContainer: {
    position: 'absolute',
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    width: 80,
    height: 80,
    borderRadius: 70,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 35,
    height: 35,
  },
  iconText: {
    color: '#ffffff',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  dogButton: {
    position: 'absolute', 
    zIndex: 10,
    elevation: 4,
    left: width / 2,
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
    zIndex: 1
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  roomItem: {
    position: 'absolute',
    zIndex: 5,
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
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
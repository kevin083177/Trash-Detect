import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { tokenStorage } from '@/utils/tokenStorage';
import { router } from 'expo-router';
import { useUser } from '@/hooks/user';
import { useAuth } from '@/hooks/auth';
import MenuButton from '@/components/profile/MenuButton';
import RecyclePieChart from '@/components/profile/RecyclePieChart';
import { RecycleValues } from '@/interface/Recycle';
import { clearRoom } from '@/utils/roomStorage';
import { asyncGet } from '@/utils/fetch';
import { feedback_api } from '@/api/api';
import * as ImagePicker from 'expo-image-picker';

export default function Profile() {
  const [recyclingData, setRecyclingData] = useState<RecycleValues>();
  const [token, setToken] = useState<string | null>(null);
  const [isCheckingFeedback, setIsCheckingFeedback] = useState<boolean>(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);

  const { 
    user, 
    fetchUserProfile, 
    clearUser, 
    getUsername, 
    getTrashStats,
    updateProfile
  } = useUser();

  const { logout } = useAuth();

  useEffect(() => {
    const getToken = async () => {
      const storedToken = await tokenStorage.getToken();
      setToken(storedToken);
    };
    getToken();
  }, []);

  const transformTrashStats = useCallback(() => {
    const trashStatsData = getTrashStats();
    const trashStats = {
      plastic: trashStatsData.plastic,
      cans: trashStatsData.cans,
      bottles: trashStatsData.bottles,
      containers: trashStatsData.containers,
      paper: trashStatsData.paper
    }
    setRecyclingData(trashStats);
  }, [getTrashStats]);

  const handleLogout = () => {
    Alert.alert(
      '登出確認',
      '確定要登出嗎？',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '確定',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              await clearRoom();
              clearUser();
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('錯誤', '登出失敗，請稍後再試');
            }
          }
        }
      ],
      { cancelable: true }
    );
  }

  const handleSettingsPress = () => {
    router.push('/(tabs)/profile/settings');
  };

  const handleFeedbackPress = async () => {
    if (!token || isCheckingFeedback) return;

    try {
      setIsCheckingFeedback(true);
      
      const response = await asyncGet(feedback_api.get_user_feedbacks, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response && response.body) {
        const feedbacks = response.body;
        
        if (feedbacks.length === 0) {
          router.push('/(tabs)/profile/create');
        } else {
          router.push('/(tabs)/profile/feedback');
        }
      } else {
        router.push('/(tabs)/profile/feedback');
      }
    } catch (error) {
      console.error('Error checking feedback:', error);
      router.push('/(tabs)/profile/feedback');
    } finally {
      setIsCheckingFeedback(false);
    }
  }

  const handleProfileImagePress = async () => {
    if (isUpdatingProfile) return;

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('權限被拒絕', '需要相簿權限才能選擇圖片');
        return;
      }
      pickImageFromLibrary();
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('錯誤', '無法獲取權限');
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from library:', error);
      Alert.alert('錯誤', '選擇圖片時發生錯誤');
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      setIsUpdatingProfile(true);
      
      const result = await updateProfile(imageUri);
      
      if (result) {
        Alert.alert('成功', result.message);
        await fetchUserProfile();
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      Alert.alert('錯誤', '上傳頭像時發生錯誤');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  useEffect(() => {
    if (user) {
      transformTrashStats();
    }
  }, [user, transformTrashStats]);

  const getListData = () => {
    return [
      { id: 'user', type: 'user' },
      { id: 'stats', type: 'stats' },
      { 
        id: 'feedback', 
        type: 'menu', 
        icon: 'chatbubbles-outline', 
        title: '意見回饋中心', 
        color: '#007AFF', 
        onPress: handleFeedbackPress,
      },
      { id: 'settings', type: 'menu', icon: 'settings-outline', title: '個人設定', color: '#323436ff', onPress: handleSettingsPress },
      { id: 'logout', type: 'menu', icon: 'log-out-outline', title: '登出', color: '#ff0000ff', onPress: handleLogout },
    ];
  };

  const renderItem = ({ item }: { item: any }) => {
    switch (item.type) {
      case 'user':
        return (
           <View style={styles.userContainer}>
            <TouchableOpacity
              style={styles.userIconContainer}
              onPress={handleProfileImagePress}
              disabled={isUpdatingProfile}
              activeOpacity={1}
            >
              {user?.profile ? (
                <Image
                  source={{ 
                    uri: typeof user.profile === 'string' ? user.profile : user.profile.url 
                  }}
                  style={styles.profileImage}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log('Profile image load error:', error);
                  }}
                />
              ) : ( 
                <Ionicons name="person-outline" size={60} color="#666" />
              )}
              
              <View style={styles.editIconContainer}>
                <Ionicons 
                  name="pencil" 
                  size={16} 
                  color="#666" 
                />
              </View>
              
              {isUpdatingProfile && (
                <View style={styles.loadingOverlay}>
                  <View style={styles.loadingIndicator} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.userName}>
              <Text style={{fontSize: 23, fontWeight: 'bold'}}>
                {getUsername()}
              </Text>
            </View>
          </View>
        );
      
      case 'stats':
        return recyclingData ? (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>回收統計</Text>
            <RecyclePieChart data={recyclingData} size={220} />
          </View>
        ) : null;
      
      case 'menu':
        return (
          <MenuButton 
            icon={item.icon} 
            title={item.title} 
            color={item.color} 
            onPress={item.onPress}
          />
        );
      
      default:
        return null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchUserProfile();
      }
    }, [token, fetchUserProfile])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={getListData()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  userContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  userIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 100,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 100,
  },
  editIconContainer: {
    position: 'absolute',
    top: 2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#888',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderTopColor: 'transparent',
  },
  userName: {
    flex: 1,
    fontSize: 16,
  },
  statsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
});
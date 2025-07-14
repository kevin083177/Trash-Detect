import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecyclingBar, RecyclingBarProps } from '@/components/profile/RecyclingBar';
import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { tokenStorage } from '@/utils/tokenStorage';
import { router } from 'expo-router';
import { useUser } from '@/hooks/user';
import { useAuth } from '@/hooks/auth';
import MenuButton from '@/components/profile/MenuButton';

export default function Profile() {
  const [recyclingData, setRecyclingData] = useState<RecyclingBarProps[]>([]);
  const [token, setToken] = useState<string | null>(null);
  
  const { 
    user, 
    fetchUserProfile, 
    clearUser, 
    getUsername, 
    getTrashStats 
  } = useUser();

  const { logout } = useAuth();

  useEffect(() => {
    const getToken = async () => {
      const storedToken = await tokenStorage.getToken();
      setToken(storedToken);
    };
    getToken();
  }, []);

  const transformTrashStatsToRecyclingData = useCallback(() => {
    const trashStats = getTrashStats();
    const transformedData: RecyclingBarProps[] = [
      { label: '塑膠', value: trashStats.plastic, color: '#F44336' },
      { label: '紙類', value: trashStats.paper, color: '#4CAF50' },
      { label: '鐵鋁罐', value: trashStats.cans, color: '#9E9E9E' },
      { label: '寶特瓶', value: trashStats.bottles, color: '#673AB7' },
      { label: '紙容器', value: trashStats.containers, color: '#2196F3' },
    ];
    setRecyclingData(transformedData);
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

  const handleFeedbackPress = () => {
    router.push('/(tabs)/profile/feedback');
  }

  useEffect(() => {
    if (user) {
      transformTrashStatsToRecyclingData();
    }
  }, [user, transformTrashStatsToRecyclingData]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchUserProfile();
      }
    }, [token, fetchUserProfile])
  );

  return (
    <View style={styles.container}>
      <View style={styles.userContainer}>
        <View style={styles.userIconContainer}>
          <Ionicons name="person-outline" size={60} color="#666" />
        </View>
        <View style={styles.userName}>
          <Text style={{fontSize: 23, fontWeight: 'bold', marginBottom: 8}}>
            {getUsername()}
          </Text>
          <Text style={{fontSize: 14}}>垃圾回收小達人</Text>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>回收統計</Text>
        {recyclingData.map((item, index) => (
          <RecyclingBar
            key={index}
            label={item.label}
            value={item.value}
            color={item.color}
          />
        ))}
      </View>

      <MenuButton icon='chatbubbles-outline' title='錯誤回報與改善建議' color='#007AFF' onPress={handleFeedbackPress}/>
      <MenuButton icon='settings-outline' title='個人設定' color='#323436ff' onPress={handleSettingsPress}/>
      <MenuButton icon='log-out-outline' title='登出' color='#ff0000ff' onPress={handleLogout}/>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  userContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  userIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    flexDirection: 'column'
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
  logoutContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
});
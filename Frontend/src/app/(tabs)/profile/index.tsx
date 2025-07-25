import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
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

export default function Profile() {
  const [recyclingData, setRecyclingData] = useState<RecycleValues>();
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

  const handleFeedbackPress = () => {
    router.push('/(tabs)/profile/feedback');
  }

  useEffect(() => {
    if (user) {
      transformTrashStats();
    }
  }, [user, transformTrashStats]);

  const getListData = () => {
    return [
      { id: 'user', type: 'user' },
      { id: 'stats', type: 'stats' },
      { id: 'feedback', type: 'menu', icon: 'chatbubbles-outline', title: '錯誤回報與改善建議', color: '#007AFF', onPress: handleFeedbackPress },
      { id: 'settings', type: 'menu', icon: 'settings-outline', title: '個人設定', color: '#323436ff', onPress: handleSettingsPress },
      { id: 'logout', type: 'menu', icon: 'log-out-outline', title: '登出', color: '#ff0000ff', onPress: handleLogout },
    ];
  };

  const renderItem = ({ item }: { item: any }) => {
    switch (item.type) {
      case 'user':
        return (
          <View style={styles.userContainer}>
            <View style={styles.userIconContainer}>
              <Ionicons name="person-outline" size={60} color="#666" />
            </View>
            <View style={styles.userName}>
              <Text style={{fontSize: 23, fontWeight: 'bold', marginBottom: 8}}>
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
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
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
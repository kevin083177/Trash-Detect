import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RecyclingBar from '@/components/profile/RecyclingBar';
import { useState, useCallback, useEffect } from 'react';
import { asyncGet, asyncPost } from '@/utils/fetch';
import { auth_api, user_api } from '@/api/api';
import { useFocusEffect } from '@react-navigation/native';
import { tokenStorage } from '@/utils/storage';
import { useAuth } from '@/hooks/auth';
import LoadingModal from '@/components/LoadingModal';

interface RecyclingItem {
  label: string;
  value: number;
  color: string;
}

export default function Profile() {
  const [recyclingData, setRecyclingData] = useState<RecyclingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const { setUser } = useAuth();
  // get token
  useEffect(() => {
    const getToken = async () => {
      const storedToken = await tokenStorage.getToken();
      setToken(storedToken);
    };
    getToken();
  }, []);

  const fetchRecyclingData = async () => {
    try {
        setIsLoading(true);
        
        // const storage = await tokenStorage.getUserInfo();
        // console.log(storage);
        // console.log('Fetching from URL:', user_api.get_record);
        
        const response = await asyncGet(user_api.get_record, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        // console.log('API Response:', response);

        if (response) {
            const transformedData: RecyclingItem[] = [
                { label: '塑膠', value: response.body.plastic, color: '#F44336' },
                { label: '紙類', value: response.body.paper, color: '#4CAF50' },
                { label: '鐵鋁罐', value: response.body.cans, color: '#9E9E9E' },
                { label: '寶特瓶', value: response.body.bottles, color: '#673AB7' },
                { label: '紙容器', value: response.body.containers, color: '#2196F3' },
            ];
            setRecyclingData(transformedData);
        } else {
            console.error('Invalid response format:', response);
            Alert.alert('錯誤', '資料格式不正確');
        }
    } catch (error) {
        console.error('Failed to fetch recycling data:', error);
        Alert.alert('錯誤', '無法取得資料，請檢查網路連線');
    } finally {
        setIsLoading(false);
    }
  };
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);

      const response = await asyncGet(user_api.get_user, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response)
        setUsername(response.body.username);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      Alert.alert('錯誤', '無法取得資料，請檢查網路連線');
    } finally {
      setIsLoading(false);
    }
  }
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
              await asyncPost(auth_api.logout, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              await tokenStorage.clearAll();
              setUser(null); // 會自動執行畫面跳轉
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

  // 當畫面取得焦點時 取得record, user 資料
  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchRecyclingData();
        fetchUserProfile();
      }
    }, [token])
  );
  return (
    <View style={styles.container}>
      <LoadingModal visible={isLoading} text='正在讀取資料中...' />
      <View style={styles.userContainer}>
        <View style={styles.userIconContainer}>
          <Ionicons name="person-outline" size={60} color="#666" />
        </View>
        <View style={styles.userName}>
          <Text style={{fontSize: 23, fontWeight: 'bold', marginBottom: 8}}>{username}</Text>
          <Text style={{fontSize: 14}}>垃圾回收小達人</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={30} color="#666" style={styles.settings} />
        </TouchableOpacity>
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
        <TouchableOpacity style={styles.logoutContainer} onPress={() => handleLogout()}>
          <Ionicons name="log-out-outline" size={24} color="red" />
          <Text style={styles.logoutText}>登出</Text>
        </TouchableOpacity>
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
  settings: {
    marginLeft: 'auto',
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
  logoutText: {
      marginLeft: 8,
      fontSize: 14,
      color: 'red',
  },
});
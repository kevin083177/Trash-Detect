import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RecyclingBar from '@/components/profile/RecyclingBar';

export default function profile() {
  /* api connect */
  const recyclingData = [
    { label: '紙類', value: 3, color: '#4CAF50' },
    { label: '塑膠', value: 123, color: '#F44336' },
    { label: '紙容器', value: 45, color: '#2196F3' },
    { label: '鐵鋁罐', value: 605, color: '#9E9E9E' },
    { label: '寶特瓶', value: 733, color: '#673AB7' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.userContainer}>
        <View style={styles.userIconContainer}>
          <Ionicons name="person-outline" size={60} color="#666" />
        </View>
        <View style={styles.userName}>
          <Text style={{fontSize: 23, fontWeight: 700, marginBottom: 8}}>英文16中文10</Text>
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
  }
});
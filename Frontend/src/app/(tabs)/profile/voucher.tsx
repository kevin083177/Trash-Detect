import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, Alert, RefreshControl, Dimensions, TouchableWithoutFeedback} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVoucher } from '@/hooks/voucher';
import { Voucher, VoucherType} from '@/interface/Voucher';
import VoucherDetailModal from '@/components/profile/VoucherDetailModal';

const { width } = Dimensions.get('window');

interface GroupedVoucher {
  voucherType: VoucherType;
  vouchers: Voucher[];
  counts: {
    unused: number;
    used: number;
    expired: number;
  };
}

export default function VoucherManagement(): ReactNode {
  const [activeTab, setActiveTab] = useState<'unused' | 'completed'>('unused');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<GroupedVoucher | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const { userVouchers, loading, fetchUserVouchers } = useVoucher();

  useEffect(() => {
    fetchUserVouchers();
  }, [fetchUserVouchers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchUserVouchers();
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert('刷新失敗', '請檢查網絡連接後重試');
    } finally {
      setRefreshing(false);
    }
  }, [fetchUserVouchers]);

  const handleEmptyPress = () => {
    router.dismissAll();
    router.replace('/(tabs)/shop');
  }

  const groupVouchersByType = useCallback((vouchers: Voucher[]): GroupedVoucher[] => {
    const grouped: { [key: string]: GroupedVoucher } = {};

    vouchers.forEach(voucher => {
      const typeId = voucher.voucher_type.name;
      
      if (!grouped[typeId]) {
        grouped[typeId] = {
          voucherType: voucher.voucher_type,
          vouchers: [],
          counts: {
            unused: 0,
            used: 0,
            expired: 0
          }
        };
      }

      grouped[typeId].vouchers.push(voucher);
      
      if (voucher.status === 'active') {
        grouped[typeId].counts.unused++;
      } else if (voucher.status === 'used') {
        grouped[typeId].counts.used++;
      } else if (voucher.status === 'expired') {
        grouped[typeId].counts.expired++;
      }
    });

    return Object.values(grouped);
  }, []);

  const filteredVouchers = useCallback(() => {
    const groupedVouchers = groupVouchersByType(userVouchers);
    
    if (activeTab === 'unused') {
      return groupedVouchers.filter(group => group.counts.unused > 0);
    } else {
      return groupedVouchers.filter(group => 
        (group.counts.used > 0 || group.counts.expired > 0) && group.counts.unused === 0
      );
    }
  }, [userVouchers, activeTab, groupVouchersByType]);

  const handleVoucherPress = (groupedVoucher: GroupedVoucher) => {
    setSelectedVoucher(groupedVoucher);
    setDetailModalVisible(true);
  };

  const renderVoucherItem = ({ item }: { item: GroupedVoucher }) => (
    <TouchableWithoutFeedback onPress={() => handleVoucherPress(item)}>
      <View style={styles.voucherCard}>
        <View style={styles.voucherInfo}>
          <Image
            source={{ uri: item.voucherType.image.url }}
            style={styles.voucherImage}
            resizeMode="contain"
          />
          <View style={styles.voucherTextContainer}>
            <Text style={styles.voucherCode}>
              {item.vouchers[0].voucher_type_id.slice(-10)}
            </Text>
            <Text style={styles.voucherTitle}>{item.voucherType.name}</Text>
            <Text style={styles.voucherExpiry}>
              兌換期限：每張票券自購買日起 90 天
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusNumber}>{item.counts.unused}</Text>
            <Text style={styles.statusLabel}>未兌換</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusNumber}>{item.counts.used}</Text>
            <Text style={styles.statusLabel}>已兌換</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusNumber}>{item.counts.expired}</Text>
            <Text style={styles.statusLabel}>已過期</Text>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'unused' && styles.activeTab]}
        onPress={() => setActiveTab('unused')}
      >
        <Text style={[styles.tabText, activeTab === 'unused' && styles.activeTabText]}>
          未使用
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
        onPress={() => setActiveTab('completed')}
      >
        <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
          兌換完畢
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>電子票券管理</Text>
        <View style={styles.placeholder} />
      </View>

      {renderTabBar()}

      <FlatList
        data={filteredVouchers()}
        renderItem={renderVoucherItem}
        keyExtractor={(item, index) => `${item.voucherType.name}-${index}`}
        contentContainerStyle={[
          styles.listContainer,
          filteredVouchers().length === 0 && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            <Ionicons style={styles.emptyIcon} name="ticket" size={40}></Ionicons>
            <Text style={styles.emptyText}>目前沒有任何票券</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={handleEmptyPress}
            >
              <Text style={styles.shopButtonText}>前往商城</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <VoucherDetailModal
        visible={detailModalVisible}
        groupedVoucher={selectedVoucher}
        onClose={() => setDetailModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voucherInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  voucherImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  voucherTextContainer: {
    flex: 1,
  },
  voucherCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  voucherExpiry: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    color: '#888',
    marginBottom: 12
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
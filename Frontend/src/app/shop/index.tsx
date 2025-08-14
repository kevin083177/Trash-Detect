import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, SafeAreaView, Alert, RefreshControl } from 'react-native';
import Headers from '@/components/Headers';
import { router } from 'expo-router';
import LoadingModal from '@/components/LoadingModal';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/interface/Product';
import ProductDetail from '@/components/shop/ProductDetail';
import ConfirmModal from '@/components/shop/ConfirmModal';
import { useProduct } from '@/hooks/product';
import { useUser } from '@/hooks/user';

const { width } = Dimensions.get('window');

export default function Shop(): ReactNode {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [purchaseConfirmText, setPurchaseConfirmText] = useState('');
  
  const [refreshing, setRefreshing] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'virtual' | 'physical'>('virtual');

  const {
    themes,
    themeProducts,
    themeLoading,
    loading: productLoading,
    fetchThemes,
    fetchPurchasedProducts,
    purchaseProduct,
    refreshAll: refreshProducts,
    isProductPurchased,
    hasEnoughMoney,
  } = useProduct();

  const { fetchUserProfile, getUsername, getMoney } = useUser();

  const handleThemePress = (theme: string) => {
    router.push(`/shop/theme?theme=${encodeURIComponent(theme)}`);
  };
  
  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };
  
  const initiateProductPurchase = () => {
    if (!selectedProduct) return;
    
    setPurchaseConfirmText(`確定要購買 ${selectedProduct.name} 嗎？`);
    setConfirmModalVisible(true);
  };
  
  const handleBuyProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const success = await purchaseProduct(selectedProduct._id);
      
      if (success) {
        Alert.alert("成功", "購買成功！");
        await fetchUserProfile();
        await fetchPurchasedProducts();
      } else {
        Alert.alert("失敗", "購買失敗");
      }
      
      setConfirmModalVisible(false);
      setDetailModalVisible(false);
    } catch (error) {
      console.error("Error buying product:", error);
      Alert.alert("錯誤", "購買失敗");
      setConfirmModalVisible(false);
    }
  };

  const handleCancelPurchase = () => {
    setConfirmModalVisible(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      await Promise.all([
        fetchUserProfile(),
        refreshProducts()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert('刷新失敗', '請檢查網絡連接後重試');
    } finally {
      setRefreshing(false);
    }
  }, [fetchUserProfile, refreshProducts]);

  useEffect(() => {
    const initializeShop = async () => {
      try {
        await Promise.all([
          fetchThemes(),
          fetchUserProfile(),
          fetchPurchasedProducts()
        ]);
      } catch (error) {
        console.error('Failed to initialize shop:', error);
      }
    };
    
    initializeShop();
  }, [fetchThemes, fetchUserProfile, fetchPurchasedProducts]);

  const renderProductItem = ({ item, index }: { item: Product, index: number }) => {
    const purchased = isProductPurchased(item._id);
    
    return (
      <TouchableOpacity 
        style={styles.productCard} 
        onPress={() => handleProductPress(item)}
      >
        <Image 
          source={{ uri: item.image?.url }}
          style={[
            styles.productImage,
            purchased && styles.purchasedProductImage
          ]}
          resizeMode="contain"
        />
        <Text 
          style={[
            styles.productText,
            purchased && styles.purchasedProductText
          ]} 
          numberOfLines={1}
        >
          {item.name}
        </Text>
        
        {purchased ? (
          <View style={styles.purchasedContainer}>
            <Text style={styles.purchasedText}>已購買</Text>
          </View>
        ) : (
          <View style={styles.coinContainer}>
            <Ionicons name="logo-usd" size={20} color="#FFD700" />
            <Text style={styles.coinText}>{item.price}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  const renderThemeSection = ({ item, index }: { item: string; index: number }) => {
    const products = themeProducts[item] || [];
    const isThemeLoading = themeLoading[item] || false;
    const typeOrder = ['wallpaper', 'box', 'table', 'carpet', 'bookshelf', 'lamp', 'pendant', 'calendar'];

    const sortedProducts = [...products].sort((a, b) => {
      const aPurchased = isProductPurchased(a._id);
      const bPurchased = isProductPurchased(b._id);
      
      if (aPurchased && !bPurchased) {
        return 1;
      } else if (!aPurchased && bPurchased) {
        return -1;
      } else {
        const aTypeIndex = typeOrder.indexOf(a.type);
        const bTypeIndex = typeOrder.indexOf(b.type);
        
        if (aTypeIndex !== -1 && bTypeIndex !== -1) {
          return aTypeIndex - bTypeIndex;
        }

        return 0;
      }
    });
    
    return (
      <View style={styles.themeSection}>
        <View style={styles.themeHeader}>
          <Text style={styles.themeTitle}>{item}</Text>
          <TouchableOpacity onPress={() => handleThemePress(item)}>
            <Text style={styles.previewText}>預覽 &gt;</Text>
          </TouchableOpacity>
        </View>
        
        {isThemeLoading ? (
          <View style={styles.noProductsContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        ) : products.length === 0 ? (
          <View style={styles.noProductsContainer}>
            <Text style={styles.noProductsText}>暫無產品</Text>
          </View>
        ) : (
          <FlatList
            data={sortedProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productList}
          />
        )}
      </View>
    );
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={styles.tab}
        onPress={() => setActiveTab('virtual')}
      >
        <Text style={[styles.tabText, activeTab === 'virtual' && styles.activeTabText]}>
          虛擬商品
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tab}
        onPress={() => setActiveTab('physical')}
      >
        <Text style={[styles.tabText, activeTab === 'physical' && styles.activeTabText]}>
          實體兌換
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderVirtualContent = () => (
    <FlatList
      data={themes}
      renderItem={renderThemeSection}
      keyExtractor={(item, index) => `theme-${index}`}
      contentContainerStyle={styles.mainContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        /> 
      }
    />
  );

  const renderPhysicalContent = () => (
    <View style={styles.physicalContainer}>
      <View style={styles.physicalContent}>
        <Ionicons name="gift-outline" size={80} color="#999" style={styles.physicalIcon} />
        <Text style={styles.physicalTitle}>實體兌換</Text>
        <Text style={styles.physicalDescription}>
          使用您的金幣兌換實體商品{'\n'}
          更多商品即將上線
        </Text>
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonText}>敬請期待</Text>
        </View>
      </View>
    </View>
  );

  if (productLoading) {
    return (
      <LoadingModal visible={productLoading} text='商店讀取中' />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Headers 
        username={getUsername()} 
        money={getMoney()} 
        router={router} 
        showShop={false} 
        showBackpack={false} 
        showBackButton={true}
      />
      
      {renderTabBar()}
      
      {activeTab === 'virtual' ? renderVirtualContent() : renderPhysicalContent()}
      
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          visible={detailModalVisible}
          purchased={isProductPurchased(selectedProduct._id)}
          canAfford={hasEnoughMoney(selectedProduct.price, getMoney())}
          onClose={() => setDetailModalVisible(false)}
          onBuy={initiateProductPurchase}
        />
      )}
      
      <ConfirmModal
        visible={confirmModalVisible}
        text={purchaseConfirmText}
        confirm={handleBuyProduct}
        cancel={handleCancelPurchase}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    paddingBottom: 4,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
    borderBottomColor: '#007AFF',
    borderBottomWidth: 2,
  },
  physicalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  physicalContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  physicalIcon: {
    marginBottom: 20,
  },
  physicalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  physicalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  comingSoonContainer: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  mainContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  themeSection: {
    marginHorizontal: 12,
    marginBottom: 16,
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  themeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  previewText: {
    fontSize: 14,
    color: '#999',
  },
  productList: {
    gap: 12,
    paddingHorizontal: 12
  },
  productCard: {
    width: (width - 64) / 3,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '90%',
    aspectRatio: 1,
    marginBottom: 8,
  },
  purchasedProductImage: {
    opacity: 0.5,
  },
  productText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
    width: '90%',
  },
  purchasedProductText: {
    color: '#888',
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    borderRadius: 16,
  },
  coinText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B7791F',
  },
  purchasedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    borderRadius: 16,
  },
  purchasedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },
  noProductsContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  noProductsText: {
    color: '#999',
    fontSize: 14,
  }
});
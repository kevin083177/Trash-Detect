import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TouchableWithoutFeedback, Dimensions, SafeAreaView, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Product } from '@/interface/Product';
import { VoucherType } from '@/interface/Voucher';
import ProductDetail from '@/components/shop/ProductDetail';
import VoucherModal from '@/components/shop/VoucherModal';
import ConfirmModal from '@/components/shop/ConfirmModal';
import ThemePreview from '@/components/shop/ThemePreview';
import { useProduct } from '@/hooks/product';
import { useUser } from '@/hooks/user';
import { useVoucher } from '@/hooks/voucher';
import { Coin } from '@/components/Coin';

const { width } = Dimensions.get('window');

export default function Shop(): ReactNode {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherType | null>(null);
  const [voucherModalVisible, setVoucherModalVisible] = useState(false);
  
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [purchaseConfirmText, setPurchaseConfirmText] = useState('');
  
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  
  const [refreshing, setRefreshing] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'virtual' | 'physical'>('virtual');

  const {
    themes,
    themeProducts,
    themeLoading,
    fetchThemes,
    fetchPurchasedProducts,
    purchaseProduct,
    refreshAll: refreshProducts,
    isProductPurchased,
    hasEnoughMoney,
  } = useProduct();

  const { fetchUserProfile, getMoney } = useUser();

  const {
    voucherTypes,
    loading: voucherLoading,
    fetchVoucherTypes,
    redeem: redeemVoucher,
    refreshAll: refreshVouchers,
    hasEnoughMoney: hasEnoughMoneyForVoucher,
    canRedeem,
  } = useVoucher();

  const handleThemePress = (theme: string) => {
    setSelectedTheme(theme);
    setThemeModalVisible(true);
  };

  const handleCloseThemeModal = () => {
    setThemeModalVisible(false);
    setSelectedTheme(null);
  };
  
  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  const handleVoucherPress = (voucher: VoucherType) => {
    setSelectedVoucher(voucher);
    setVoucherModalVisible(true);
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

  const handleRedeemVoucher = async (count: number) => {
    if (!selectedVoucher) return;
    
    try {
      const result = await redeemVoucher(selectedVoucher._id, count);
      
      if (result.success) {
        Alert.alert("成功", result.message || "兌換成功！");
        await fetchUserProfile();
        await fetchVoucherTypes();
      } else {
        Alert.alert("失敗", result.message || "兌換失敗");
      }
      
      setVoucherModalVisible(false);
    } catch (error) {
      console.error("Error redeeming voucher:", error);
      Alert.alert("錯誤", "兌換失敗");
    }
  };

  const handleCancelPurchase = () => {
    setConfirmModalVisible(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      await fetchUserProfile();
      activeTab === 'virtual' ? await refreshProducts() : refreshVouchers();
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert('刷新失敗', '請檢查網絡連接後重試');
    } finally {
      setRefreshing(false);
    }
  }, [fetchUserProfile, refreshProducts, refreshVouchers, activeTab]);

  useEffect(() => {
    const initializeShop = async () => {
      try {
        await Promise.all([
          fetchThemes(),
          fetchUserProfile(),
          fetchPurchasedProducts(),
          fetchVoucherTypes(),
        ]);
      } catch (error) {
        console.error('Failed to initialize shop:', error);
      }
    };
    
    initializeShop();
  }, [fetchThemes, fetchUserProfile, fetchPurchasedProducts, fetchVoucherTypes]);

  const renderProductItem = ({ item, index }: { item: Product, index: number }) => {
    const purchased = isProductPurchased(item._id);
    
    return (
      <TouchableOpacity 
        style={[styles.productCard, purchased && styles.purchasedCard]} 
        onPress={() => handleProductPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.productImageContainer}>
          <Image 
            source={{ uri: item.image?.url }}
            style={[
              styles.productImage,
              purchased && styles.purchasedProductImage
            ]}
            resizeMode="contain"
          />
          {purchased && (
            <View style={styles.purchasedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text 
            style={[
              styles.productText,
              purchased && styles.purchasedProductText
            ]} 
            numberOfLines={1}
          >
            {item.name}
          </Text>
          
          <View style={styles.productPriceRow}>
            {purchased ? (
              <Text style={styles.purchasedLabel}>已擁有</Text>
            ) : (
              <View style={styles.priceContainer}>
                <Coin size="small" value={item.price} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderVoucherItem = ({ item, index }: { item: VoucherType, index: number }) => {
    return (
      <View style={styles.voucherCardWrapper}>
        <TouchableWithoutFeedback onPress={() => handleVoucherPress(item)}>
          <View style={styles.voucherCard}>
            <View style={styles.voucherImageContainer}>
              {item.image.url && (
                <Image 
                  source={{ uri: item.image.url }}
                  style={styles.voucherImage}
                  resizeMode="contain"
                />
              )}
            </View>
            
            <Text style={styles.voucherName} numberOfLines={1}>
              {item.name}
            </Text>
            
            <View style={styles.voucherFooter}>
              <View style={styles.voucherPriceContainer}>
                <Coin size="small" value={item.price}/>
              </View>
              <Text style={styles.voucherQuantity}>剩餘 {item.quantity}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  const renderVoucherFooter = () => {
    if (voucherTypes.length === 0) return null;
    
    return (
      <View style={styles.voucherFooterContainer}>
        <Text style={styles.voucherFooterText}>－ 沒有更多商品了 －</Text>
      </View>
    );
  };
  
  const renderThemeSection = ({ item, index }: { item: string; index: number }) => {
    const products = themeProducts[item] || [];
    const isThemeLoading = themeLoading[item] || false;
    const typeOrder = ['wallpaper', 'table', 'carpet', 'bookshelf', 'lamp', 'pendant', 'calendar'];

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
          <View style={styles.themeTitleContainer}>
            <Text style={styles.themeTitle}>{item}</Text>
          </View>
          <TouchableOpacity onPress={() => handleThemePress(item)} style={styles.previewButton}>
            <Text style={styles.previewText}>預覽</Text>
            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
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

  const renderPhysicalContent = () => {
    if (voucherLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={voucherTypes}
        key={2}
        renderItem={renderVoucherItem}
        keyExtractor={(item, index) => `voucher-${index}`}
        numColumns={2}
        contentContainerStyle={styles.voucherList}
        ListFooterComponent={renderVoucherFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
          <Coin size="medium" value={getMoney()} />
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('virtual')}
        >
          <Text style={[styles.tabText, activeTab === 'virtual' && styles.activeTabText]}>
            家具
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('physical')}
        >
          <Text style={[styles.tabText, activeTab === 'physical' && styles.activeTabText]}>
            電子票券
          </Text>
        </TouchableOpacity>
      </View>
      
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

      {selectedVoucher && (
        <VoucherModal
          voucher={selectedVoucher}
          visible={voucherModalVisible}
          canAfford={hasEnoughMoneyForVoucher(selectedVoucher.price, getMoney())}
          canRedeem={canRedeem(selectedVoucher)}
          userCoins={getMoney()}
          onClose={() => setVoucherModalVisible(false)}
          onRedeem={handleRedeemVoucher}
        />
      )}

      <ThemePreview
        visible={themeModalVisible}
        theme={selectedTheme}
        onClose={handleCloseThemeModal}
      />
      
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
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: '50%',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  mainContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  themeSection: {
    marginHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  themeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeIcon: {
    fontSize: 20,
  },
  themeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewText: {
    fontSize: 14,
    color: '#007AFF',
  },
  productList: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
  },
  productCard: {
    width: (width - 64) / 3,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
    borderColor: 'transparent',
  },
  purchasedCard: {
    borderColor: '#E8F5E9',
    backgroundColor: '#FAFAFA',
  },
  productImageContainer: {
    position: 'relative',
    aspectRatio: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  productImage: {
    width: '90%',
    height: '90%',
  },
  purchasedProductImage: {
    opacity: 0.5,
  },
  purchasedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productInfo: {
    padding: 8,
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  productText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  purchasedProductText: {
    color: '#888',
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  purchasedLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },
  noProductsContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noProductsText: {
    color: '#999',
    fontSize: 14,
  },
  voucherList: {
    paddingVertical: 8,
    paddingBottom: 32,
  },
  voucherCardWrapper: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  voucherImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  voucherImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  voucherName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'left',
    marginBottom: 12,
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voucherPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voucherQuantity: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  voucherFooterContainer: {
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
  },
  voucherFooterText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '400',
  },
});
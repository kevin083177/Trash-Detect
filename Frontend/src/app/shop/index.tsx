import { user_api } from '@/api/api';
import { asyncGet } from '@/utils/fetch';
import { tokenStorage } from '@/utils/tokenStorage';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, SafeAreaView, Alert, RefreshControl } from 'react-native';
import Headers from '@/components/Headers';
import { router, useFocusEffect } from 'expo-router';
import LoadingModal from '@/components/LoadingModal';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/interface/Product';
import ProductDetail from '@/components/shop/ProductDetail';
import ConfirmModal from '@/components/shop/ConfirmModal';
import { useProduct } from '@/hooks/product';

const { width } = Dimensions.get('window');

export default function Shop(): ReactNode {
  const [token, setToken] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [money, setMoney] = useState<number>(0);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [purchaseConfirmText, setPurchaseConfirmText] = useState('');
  
  const [refreshing, setRefreshing] = useState(false);

  const {
    themes,
    themeProducts,
    themeLoading,
    loading: productLoading,
    fetchThemes,
    purchaseProduct,
    refreshAll: refreshProducts,
    isProductPurchased,
    hasEnoughMoney,
  } = useProduct();

  const fetchUserProfile = async () => {
    if (!token) return;
    
    try {
      const response = await asyncGet(user_api.get_user, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });
      
      if (response) {
        setUsername(response.body.username);
        setMoney(response.body.money);
      }
      else {
        Alert.alert("錯誤", "無法連接至伺服器");
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleThemePress = (theme: string) => {
    router.push(`/shop/theme?theme=${encodeURIComponent(theme)}`);
  };
  
  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };
  
  const initiateProductPurchase = () => {
    if (!selectedProduct) return;
    
    // 顯示確認彈窗
    setPurchaseConfirmText(`確定要購買 ${selectedProduct.name} 嗎？`);
    setConfirmModalVisible(true);
  };
  
  // 實際執行購買的函數
  const handleBuyProduct = async () => {
    if (!selectedProduct || !token) return;
    
    try {
      const success = await purchaseProduct(selectedProduct._id);
      
      if (success) {
        Alert.alert("成功", "購買成功！");
        fetchUserProfile();
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
  }, [token, refreshProducts]);

  useEffect(() => {
    const getToken = async () => {
      try {
        const storedToken = await tokenStorage.getToken();
        setToken(storedToken as string);
      } catch (error) {
        console.error('Error getting token:', error);
      }
    };
    
    getToken();
  }, []);
  
  useEffect(() => {
    if (token) {
      fetchThemes();
    }
  }, [token, fetchThemes]);
  
  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchUserProfile();
      }
    }, [token])
  );

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
            <ActivityIndicator size="small" color="#2196F3" />
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

  if (productLoading) {
    return (
      <LoadingModal visible={productLoading} text='商店讀取中' />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Headers username={username} money={money} router={router} showShop={false} showBackpack={false} showBackButton={true}/>
      
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
      
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          visible={detailModalVisible}
          purchased={isProductPurchased(selectedProduct._id)}
          canAfford={hasEnoughMoney(selectedProduct.price, money)}
          onClose={() => setDetailModalVisible(false)}
          onBuy={initiateProductPurchase}
        />
      )}
      
      {/* 確認購買的彈窗 */}
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
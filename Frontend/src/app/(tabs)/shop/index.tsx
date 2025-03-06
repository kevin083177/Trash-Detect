import { product_api, purchase_api, user_api } from '@/api/api';
import { asyncGet, asyncPost } from '@/utils/fetch';
import { tokenStorage } from '@/utils/storage';
import React, { ReactNode, useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, SafeAreaView, Alert } from 'react-native';
import Headers from '@/components/Headers';
import { router } from 'expo-router';
import LoadingModal from '@/components/LoadingModal';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/interface/Product';
import ProductDetail from '@/components/shop/ProductDetail';
import ConfirmModal from '@/components/shop/ConfirmModal';

const { width } = Dimensions.get('window');

export default function Shop(): ReactNode {
  const [themes, setThemes] = useState<string[]>([]);
  const [token, setToken] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [money, setMoney] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  const [themeProducts, setThemeProducts] = useState<Record<string, Product[]>>({});
  const [themeLoading, setThemeLoading] = useState<Record<string, boolean>>({});
  
  // State for product detail modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // State for confirm purchase modal
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [purchaseConfirmText, setPurchaseConfirmText] = useState('');
  
  // 儲存已購買產品的 ID
  const [purchasedProductIds, setPurchasedProductIds] = useState<string[]>([]);
  
  const fetchUserProfile = async () => {
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
  };
  
  // 獲取已購買的產品
  const fetchPurchasedProducts = async () => {
    if (!token) return;
    
    try {
      const response = await asyncGet(purchase_api.get_purchase, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response && response.body) {
        // 假設 response.body 是包含產品 ID 的陣列
        const purchasedIds = response.body.product.map((item: any) => item._id);
        // console.log(purchasedIds);
        setPurchasedProductIds(purchasedIds);
      }
    } catch (error) {
      console.error('Error fetching purchased products:', error);
    }
  };
  
  const fetchThemes = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await asyncGet(product_api.get_all_theme, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response && response.body) {
        const fetchedThemes = response.body;
        setThemes(fetchedThemes);
        
        // 初始化所有主題的載入狀態
        const loadingState: Record<string, boolean> = {};
        fetchedThemes.forEach((theme: string) => {
          loadingState[theme] = true;
        });
        setThemeLoading(loadingState);
        
        // 為每個主題獲取產品
        fetchedThemes.forEach((theme: string) => {
          fetchProductsByTheme(theme);
        });
      }
    } catch (error) {
      console.error('Error fetching themes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 為特定主題獲取產品
  const fetchProductsByTheme = async (theme: string) => {
    if (!token) return;
    
    try {
      // 直接使用 API 呼叫來獲取產品
      const response = await asyncGet(`${product_api.get_product_by_folder}/${encodeURIComponent(theme)}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response && response.body) {
        // 更新主題產品映射
        setThemeProducts(prev => ({
          ...prev,
          [theme]: response.body
        }));
      }
    } catch (error) {
      console.error(`Error fetching products for theme ${theme}:`, error);
    } finally {
      // 更新此主題的載入狀態
      setThemeLoading(prev => ({
        ...prev,
        [theme]: false
      }));
    }
  };

  const handleThemePress = (theme: string) => {
    router.push(`/shop/theme?theme=${encodeURIComponent(theme)}`);
  };
  
  // Handler for product press
  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };
  
  // 啟動購買流程，顯示確認彈窗
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
      const response = await asyncPost(purchase_api.purchase, {
        headers: {
          'Authorization': `Bearer ${token}`
        }, 
        body: {
          'product_id': selectedProduct._id,
          'payment_type': "money"
        }
      });
      
      if(response.status === 200) {
        Alert.alert("成功", "購買成功！");
        // 更新錢包餘額
        fetchUserProfile();
        // 重新獲取已購買產品列表
        fetchPurchasedProducts();
      }
      
      setConfirmModalVisible(false);
      setDetailModalVisible(false);
    } catch (error) {
      console.error("Error buying product:", error);
      Alert.alert("錯誤", "購買失敗");
      setConfirmModalVisible(false);
    }
  };

  // 取消購買
  const handleCancelPurchase = () => {
    setConfirmModalVisible(false);
  };

  // 檢查產品是否已購買
  const isProductPurchased = (productId: string) => {
    return purchasedProductIds.includes(productId);
  };

  // 檢查餘額是否足夠
  const hasEnoughMoney = (productPrice: number) => {
    return money >= productPrice;
  };

  useEffect(() => {
    const getTokenAndFetchThemes = async () => {
      try {
        const storedToken = await tokenStorage.getToken();
        setToken(storedToken as string);
      } catch (error) {
        console.error('Error getting token:', error);
        setLoading(false);
      }
    };
    
    getTokenAndFetchThemes();
  }, []);
  
  useEffect(() => {
    if (token) {
      fetchThemes();
      fetchUserProfile();
      fetchPurchasedProducts();
    }
  }, [token]);

  const renderProductItem = ({ item, index }: { item: Product, index: number }) => {
    const purchased = isProductPurchased(item._id);
    
    return (
      <TouchableOpacity 
        style={styles.productCard} 
        onPress={() => handleProductPress(item)}
      >
        <Image 
          source={{ uri: item.image?.thumbnail_url }}
          style={[
            styles.productImage,
            purchased && styles.purchasedProductImage
          ]}
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
    
    // 排序產品，將已購買的產品放到最後
    const sortedProducts = [...products].sort((a, b) => {
      const aPurchased = isProductPurchased(a._id);
      const bPurchased = isProductPurchased(b._id);
      
      if (aPurchased && !bPurchased) {
        return 1; // a 已購買，b 未購買，a 排在後面
      } else if (!aPurchased && bPurchased) {
        return -1; // a 未購買，b 已購買，a 排在前面
      } else {
        return 0; // 兩者狀態相同，保持原排序
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

  if (loading) {
    return (
      <LoadingModal visible={loading} text='商店讀取中' />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Headers username={username} money={money} router={router} showShop={false} />
      
      <FlatList
        data={themes}
        renderItem={renderThemeSection}
        keyExtractor={(item, index) => `theme-${index}`}
        contentContainerStyle={styles.mainContent}
      />
      
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          visible={detailModalVisible}
          purchased={isProductPurchased(selectedProduct._id)}
          canAfford={hasEnoughMoney(selectedProduct.price)}
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
    paddingHorizontal: 16,
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
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFCCBC',
    borderRadius: 8,
    marginBottom: 6,
  },
  purchasedProductImage: {
    opacity: 0.5,
  },
  productText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
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
  // 已購買產品的標示
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
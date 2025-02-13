import React, { ReactNode, useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Product, useProducts } from '@/hooks/product';

const THEMES = ['主題1', '主題2', '主題3', '主題4', '主題5'];
const { width } = Dimensions.get('window');

export default function ProductListScreen(): ReactNode {
  const { products, loading, error, fetchProducts } = useProducts();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const onRefresh = React.useCallback(() => {
    if (!selectedTheme) return;
    setRefreshing(true);
    fetchProducts(selectedTheme)
      .finally(() => setRefreshing(false));
  }, [selectedTheme]);

  const handleThemeSelect = async (theme: string) => {
    setSelectedTheme(theme);
    try {
      await fetchProducts(theme);
    } catch (err) {
      // 錯誤已經在 useProducts 中被處理，這裡不需要額外處理
      // 但我們確保即使發生錯誤，用戶仍然可以切換主題
    }
  };

  const renderThemeButtons = () => (
    <View style={styles.themeWrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.themeContainer}
      >
        {THEMES.map((theme) => (
          <TouchableOpacity
            key={theme}
            style={[
              styles.themeButton,
              selectedTheme === theme && styles.selectedThemeButton
            ]}
            onPress={() => handleThemeSelect(theme)}
          >
            <Text style={[
              styles.themeButtonText,
              selectedTheme === theme && styles.selectedThemeButtonText
            ]}>
              {theme}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => selectedTheme && handleThemeSelect(selectedTheme)}
          >
            <Text style={styles.retryText}>重試</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!selectedTheme) {
      return (
        <View style={styles.noSelectionContainer}>
          <Text style={styles.noSelectionText}>請選擇一個主題</Text>
        </View>
      );
    }

    if (products.length === 0) {
      return (
        <View style={styles.noSelectionContainer}>
          <Text style={styles.noSelectionText}>此主題目前沒有商品</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { marginTop: 12 }]}
            onPress={onRefresh}
          >
            <Text style={styles.retryText}>重新整理</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={products}
        renderItem={({ item }: { item: Product }) => (
          <TouchableOpacity style={styles.productCard}>
            <Image
              source={{ uri: item.image.thumbnail_url }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>
                {item.price === 0 ? '免費' : `NT$ ${item.price}`}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.container}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  };

  return (
    <View style={styles.mainContainer}>
      {renderThemeButtons()}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  themeWrapper: {
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  themeContainer: {
    padding: 12,
  },
  themeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: (width - 100) / 3, // 確保每個按鈕有最小寬度
    alignItems: 'center',
  },
  selectedThemeButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  themeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  selectedThemeButtonText: {
    color: 'white',
  },
  noSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  noSelectionText: {
    fontSize: 16,
    color: '#666',
  },
  container: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden', // 確保圖片不會超出圓角
  },
  productImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e53935',
  },
  error: {
    color: '#e53935',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
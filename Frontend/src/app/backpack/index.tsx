import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Product, ProductCategory } from '@/interface/Product';
import CategorySelector from '@/components/backpack/CategorySelector';
import ProductSection from '@/components/backpack/ProductSection';
import RoomPreview from '@/components/backpack/RoomPreview';
import LoadingModal from '@/components/LoadingModal';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useProduct } from '@/hooks/product';

export default function Backpack() {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('wallpaper');
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);

  const [selectedRoomItems, setSelectedRoomItems] = useState<Partial<Record<ProductCategory, Product>>>({});

  const {
    purchasedProductsByType,
    fetchPurchasedProductsByType,
    loading: productLoading
  } = useProduct();

  useFocusEffect(
    useCallback(() => {
      fetchPurchasedProductsByType();
    }, [fetchPurchasedProductsByType])
  );

  const handleCategoryChange = (category: ProductCategory) => {
    if (editingCategory) {
      setEditingCategory(null);
    }
    setSelectedCategory(category);
  };

  // 處理商品選擇
  const handleProductSelect = (product: Product) => {
    const category = product.type as ProductCategory;
    
    if (editingCategory && editingCategory !== category) {
      Alert.alert(
        '提示',
        '目前正在編輯其他商品，請先完成編輯或取消後再選擇新商品',
        [{ text: '確定' }]
      );
      return;
    }
    
    // 添加商品到首頁
    setSelectedRoomItems(prev => ({
      ...prev,
      [category]: product
    }));

    // wallpaper 和 box 不需要編輯
    if (category !== 'wallpaper' && category !== 'box') {
      setEditingCategory(category);
    }
  };

  const handleRemoveFromRoom = (category: ProductCategory) => {
    if (editingCategory) {
      setEditingCategory(null);
    }
    
    setSelectedRoomItems(prev => {
      const newItems = { ...prev };
      delete newItems[category];
      return newItems;
    });
  };

  const handleStartEdit = (category: ProductCategory | null) => {
    setEditingCategory(category);
  };

  const getCurrentSelectedProduct = () => {
    return selectedRoomItems[selectedCategory] || null;
  };

  return (
    <View style={styles.container}>
      <LoadingModal visible={loading || productLoading} text="載入中..." />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.back} 
          onPress={() => {
            if (editingCategory) {
              Alert.alert(
                '提示',
                '正在編輯商品，是否要離開？',
                [
                  { text: '取消', style: 'cancel' },
                  { 
                    text: '離開', 
                    style: 'destructive',
                    onPress: () => router.back()
                  }
                ]
              );
            } else {
              router.back();
            }
          }}
        >
          <Ionicons name='arrow-back' size={20} color={"white"}></Ionicons>
        </TouchableOpacity>
        <Text style={styles.title}>房間預覽</Text>
        {editingCategory && (
          <View style={styles.editingIndicator}>
            <Text style={styles.editingText}>編輯中</Text>
          </View>
        )}
      </View>

      {/* 房間預覽區域 */}
      <RoomPreview
        selectedItems={selectedRoomItems}
        onItemPress={handleRemoveFromRoom}
        editingCategory={editingCategory}
        onStartEdit={handleStartEdit}
      />

      {/* 類別選擇器 */}
      <CategorySelector
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* 商品網格 */}
      <View style={styles.productSection}>
        <ScrollView horizontal={true}>
          <ProductSection
            products={Array.isArray(purchasedProductsByType[selectedCategory]) ? purchasedProductsByType[selectedCategory] : []}
            onProductPress={handleProductSelect}
            selectedProduct={getCurrentSelectedProduct()}
          />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 15,
    left: 10,
    flexDirection: "row",
    zIndex: 10,
    gap: 8,
    alignItems: 'center',
  },
  back: {
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 50,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 50,
  },
  editingIndicator: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productSection: {
    flex: 1,
  },
});
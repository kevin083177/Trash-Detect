import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Product, ProductCategory } from '@/interface/Product';
import CategorySelector from '@/components/backpack/CategorySelector';
import ProductSection from '@/components/backpack/ProductSection';
import RoomPreview from '@/components/backpack/RoomPreview';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useProduct } from '@/hooks/product';
import { saveRoom, loadRoom, ItemTransform } from '@/utils/roomStorage';

const { width, height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 62;
const PRODUCT_PANEL_HEIGHT = 150;
const DRAG_INDICATOR_HEIGHT = 40;
const TITLE_CONTAINER_HEIGHT = 50;

export default function Backpack() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('wallpaper');
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [selectedRoomItems, setSelectedRoomItems] = useState<Partial<Record<ProductCategory, Product>>>({});
  const [itemTransforms, setItemTransforms] = useState<Partial<Record<ProductCategory, ItemTransform>>>({});

  const [isPanelExpanded, setIsPanelExpanded] = useState<boolean>(false);
  const panelTranslateY = useRef(new Animated.Value(PRODUCT_PANEL_HEIGHT)).current;

  const {
    purchasedProductsByType,
    fetchPurchasedProductsByType,
  } = useProduct();

  const loadStoredData = async () => {
    try {
      const roomData = await loadRoom();
      setSelectedRoomItems(roomData.selectedItems);
      setItemTransforms(roomData.itemTransforms);
    } catch (error) {
      console.error('讀取房間資料失敗:', error);
    }
  };

  const handleGoBack = async () => {
    if (editingCategory) {
      Alert.alert(
        '提示',
        '正在編輯商品，是否要離開？',
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '離開', 
            style: 'destructive',
            onPress: async () => {
              await saveRoom(selectedRoomItems, itemTransforms);
              router.back();
            }
          }
        ]
      );
    } else {
      await saveRoom(selectedRoomItems, itemTransforms);
      router.back();
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPurchasedProductsByType();
      loadStoredData();
    }, [fetchPurchasedProductsByType])
  );

  const togglePanel = (expand?: boolean) => {
    const shouldExpand = expand !== undefined ? expand : !isPanelExpanded;
    const toValue = shouldExpand ? 0 : PRODUCT_PANEL_HEIGHT;
    
    Animated.timing(panelTranslateY, {
      toValue,
      useNativeDriver: true,
      duration: 250,
      easing: Easing.ease,
    }).start();
    
    setIsPanelExpanded(shouldExpand);
  };

  const handleCategoryChange = (category: ProductCategory) => {
    if (editingCategory) {
      setEditingCategory(null);
    }
    setSelectedCategory(category);
    
    if (!isPanelExpanded) {
      togglePanel(true);
    }
  };

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
    
    setSelectedRoomItems(prev => ({
      ...prev,
      [category]: product
    }));

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

    setItemTransforms(prev => {
      const newTransforms = { ...prev };
      delete newTransforms[category];
      return newTransforms;
    });
  };

  const handleStartEdit = (category: ProductCategory | null) => {
    setEditingCategory(category);
  };

  const handleTransformUpdate = (category: ProductCategory, transform: ItemTransform) => {
    setItemTransforms(prev => ({
      ...prev,
      [category]: transform
    }));
  };

  const getCurrentSelectedProduct = () => {
    return selectedRoomItems[selectedCategory] || null;
  };

  const roomPreviewHeight = height - TITLE_CONTAINER_HEIGHT - TAB_BAR_HEIGHT;
  
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleGoBack}
          >
            <Ionicons name='arrow-back' size={24} color={"black"}></Ionicons>
          </TouchableOpacity>
          <Text style={styles.titleText}>房間預覽</Text>
        </View>
        <TouchableOpacity style={styles.shopIcon} onPress={() => router.push('/shop')}>
            <Ionicons name="storefront-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={[styles.roomPreviewContainer, { height: roomPreviewHeight }]}>
        <RoomPreview
          selectedItems={selectedRoomItems}
          onItemPress={handleRemoveFromRoom}
          editingCategory={editingCategory}
          onStartEdit={handleStartEdit}
          itemTransforms={itemTransforms}
          onTransformUpdate={handleTransformUpdate}
          containerHeight={roomPreviewHeight}
        />
      </View>

      <Animated.View 
        style={[
          styles.bottomSlidingPanel,
          {
            transform: [{ translateY: panelTranslateY }],
          }
        ]}
      >
        <View style={styles.dragIndicatorContainer}>
          <TouchableOpacity 
            style={styles.dragIndicator}
            onPress={() => togglePanel()}
          >
            <Ionicons 
              name={isPanelExpanded ? "chevron-down" : "chevron-up"} 
              size={24} 
              color="#666" 
            />
            <View style={styles.dragHandle} />
          </TouchableOpacity>
        </View>

        <View style={styles.categoryContainer}>
          <CategorySelector
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </View>

        <View style={styles.productPanelContent}>
          <ProductSection
            products={Array.isArray(purchasedProductsByType[selectedCategory]) ? purchasedProductsByType[selectedCategory] : []}
            onProductPress={handleProductSelect}
            selectedProduct={getCurrentSelectedProduct()}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  titleContainer: {
    height: TITLE_CONTAINER_HEIGHT,
    flexDirection: "row",
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    backgroundColor: 'white',
    zIndex: 100,
  },
  backButton: {
    paddingHorizontal: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    padding: 8,
    borderRadius: 20,
  },
  roomPreviewContainer: {
    width: '100%',
    backgroundColor: 'white',
  },
  bottomSlidingPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT + PRODUCT_PANEL_HEIGHT + DRAG_INDICATOR_HEIGHT,
    backgroundColor: 'transparent',
  },
  dragIndicatorContainer: {
    height: DRAG_INDICATOR_HEIGHT,
    width: 100,
    top: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignSelf: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 110,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#E0E0E0',
  },
  dragIndicator: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 24,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 80,
  },
  dragHandle: {
    width: 24,
    height: 3,
    backgroundColor: '#B0B0B0',
    borderRadius: 2,
  },
  categoryContainer: {
    height: TAB_BAR_HEIGHT,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    zIndex: 10,
  },
  productPanelContent: {
    flex: 1,
    backgroundColor: 'white',
  },
  shopIcon: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
});
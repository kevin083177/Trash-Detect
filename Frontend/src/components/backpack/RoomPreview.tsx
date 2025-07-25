import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ImageBackground, 
  Image, 
  TouchableOpacity, 
  Dimensions,
} from 'react-native';
import { Product, ProductCategory } from '@/interface/Product';
import { ItemTransform } from '@/utils/roomStorage';
import EditableProduct from './EditableProduct';

interface RoomPreviewProps {
  selectedItems: Partial<Record<ProductCategory, Product>>;
  onItemPress: (category: ProductCategory) => void;
  editingCategory?: ProductCategory | null;
  onStartEdit?: (category: ProductCategory | null) => void;
  containerHeight?: number;
  itemTransforms: Partial<Record<ProductCategory, ItemTransform>>; // 新增
  onTransformUpdate: (category: ProductCategory, transform: ItemTransform) => void; // 新增
}

const { width, height } = Dimensions.get('window');

// 使用相對位置，這樣可以適應不同的容器高度
const getDefaultPositions = (containerHeight: number): Record<ProductCategory, { x: number; y: number }> => ({
  table: { x: width * 0.5, y: containerHeight * 0.5 },
  bookshelf: { x: width * 0.3, y: containerHeight * 0.4 },
  lamp: { x: width * 0.7, y: containerHeight * 0.3 },
  carpet: { x: width * 0.5, y: containerHeight * 0.7 },
  pendant: { x: width * 0.4, y: containerHeight * 0.25 },
  calendar: { x: width * 0.6, y: containerHeight * 0.45 },
  box: { x: width * 0.5, y: containerHeight * 0.8 },
  wallpaper: { x: 0, y: 0 },
});

export default function RoomPreview({ 
  selectedItems, 
  onItemPress,
  editingCategory = null,
  onStartEdit,
  containerHeight,
  itemTransforms, // 新增
  onTransformUpdate // 新增
}: RoomPreviewProps) {

  // 使用傳入的高度或默認高度
  const actualHeight = containerHeight || height;
  const defaultPositions = getDefaultPositions(actualHeight);
  
  const currentBackground = selectedItems.wallpaper?.image?.url;

  // 獲取商品的變換信息
  const getItemTransform = (category: ProductCategory): ItemTransform => {
    return itemTransforms[category] || {
      position: defaultPositions[category],
      scale: 2,
      rotation: 0,
    };
  };

  // 處理編輯確認 - 改為調用 onTransformUpdate 而不是直接保存
  const handleEditConfirm = (
    category: ProductCategory, 
    position: { x: number; y: number }, 
    scale: number, 
    rotation: number
  ) => {
    const transform: ItemTransform = { position, scale, rotation };
    
    // 通過 props 回調更新變換信息
    onTransformUpdate(category, transform);
    
    if (onStartEdit) {
      onStartEdit(null);
    }
  };

  // 處理編輯取消
  const handleEditCancel = (category: ProductCategory) => {
    if (onStartEdit) {
      onStartEdit(null);
    }
  };

  // 處理商品點擊
  const handleItemPress = (category: ProductCategory) => {
    if (editingCategory) {
      return;
    }
    
    // 開始編輯此商品
    if (onStartEdit) {
      onStartEdit(category);
    } else {
      onItemPress(category);
    }
  };

  const renderStaticItem = (
    category: ProductCategory, 
    item: Product, 
    transform: ItemTransform
  ) => {
    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.itemContainer,
          {
            left: transform.position.x - 30,
            top: transform.position.y - 30,
            transform: [
              { scale: transform.scale },
              { rotate: `${transform.rotation}deg` }
            ],
          }
        ]}
        onPress={() => handleItemPress(category)}
        disabled={!!editingCategory}
      >
        <Image
          source={{ uri: item.image?.url }}
          style={[
            styles.itemImage,
            editingCategory && editingCategory !== category && styles.dimmedItem
          ]}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, containerHeight ? { height: containerHeight } : {}]}>      
      <View style={styles.previewContainer}>
        <ImageBackground
          source={{ uri: currentBackground }}
          style={styles.roomBackground}
          resizeMode="cover"
        >
          {/* 渲染所有商品 */}
          {Object.entries(selectedItems).map(([category, item]) => {
            if (!item || category === 'wallpaper' || category === 'box') return null;
            
            const categoryKey = category as ProductCategory;
            const transform = getItemTransform(categoryKey);
            
            if (editingCategory === categoryKey) {
              return (
                <EditableProduct
                  key={categoryKey}
                  category={categoryKey}
                  item={item}
                  initialPosition={transform.position}
                  initialScale={transform.scale}
                  initialRotation={transform.rotation}
                  onConfirm={handleEditConfirm}
                  onCancel={handleEditCancel}
                />
              );
            }
            
            return renderStaticItem(categoryKey, item, transform);
          })}
        </ImageBackground>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  previewContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  roomBackground: {
    flex: 1,
    position: 'relative',
  },
  itemContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
  },
  itemImage: {
    width: 60,
    height: 60,
  },
  dimmedItem: {
    opacity: 0.3,
  },
});
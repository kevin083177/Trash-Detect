import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  Alert 
} from 'react-native';
import { Product, ProductCategory } from '@/interface/Product';
import EditableProduct from './EditableProduct';

interface ItemTransform {
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}

interface RoomPreviewProps {
  selectedItems: Partial<Record<ProductCategory, Product>>;
  onItemPress: (category: ProductCategory) => void;
  editingCategory?: ProductCategory | null;
  onStartEdit?: (category: ProductCategory) => void;
}

const { width, height } = Dimensions.get('window');
const PREVIEW_HEIGHT = height * 0.73;

const DEFAULT_POSITIONS: Record<ProductCategory, { x: number; y: number }> = {
  table: { x: width * 0.5, y: PREVIEW_HEIGHT * 0.5 },
  bookshelf: { x: width * 0.5, y: PREVIEW_HEIGHT * 0.5 },
  lamp: { x: width * 0.5, y: PREVIEW_HEIGHT * 0.5 },
  carpet: { x: width * 0.5, y: PREVIEW_HEIGHT * 0.5 },
  pendant: { x: width * 0.5, y: PREVIEW_HEIGHT * 0.5 },
  calendar: { x: width * 0.5, y: PREVIEW_HEIGHT * 0.5 },
  box: { x: width * 0.5, y: PREVIEW_HEIGHT * 0.5 },
  wallpaper: { x: 0, y: 0 },
};

export default function RoomPreview({ 
  selectedItems, 
  onItemPress,
  editingCategory = null,
  onStartEdit 
}: RoomPreviewProps) {
  const [itemTransforms, setItemTransforms] = useState<Partial<Record<ProductCategory, ItemTransform>>>({});

  const currentBackground = selectedItems.wallpaper?.image?.url;

  // 獲取商品的變換信息
  const getItemTransform = (category: ProductCategory): ItemTransform => {
    return itemTransforms[category] || {
      position: DEFAULT_POSITIONS[category],
      scale: 2,
      rotation: 0,
    };
  };

  // 處理編輯確認
  const handleEditConfirm = (
    category: ProductCategory, 
    position: { x: number; y: number }, 
    scale: number, 
    rotation: number
  ) => {
    setItemTransforms(prev => ({
      ...prev,
      [category]: { position, scale, rotation }
    }));
    
    if (onStartEdit) {
      onStartEdit(null as any);
    }
  };

  // 處理編輯取消
  const handleEditCancel = (category: ProductCategory) => {
    if (onStartEdit) {
      onStartEdit(null as any);
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

  return (
    <View style={styles.container}>      
      <View style={styles.previewContainer}>
        <ImageBackground
          source={{ uri: currentBackground }}
          style={styles.roomBackground}
          resizeMode="cover"
        >
          {/* 渲染所有商品 */}
          {Object.entries(selectedItems).map(([category, item]) => {
            if (!item || category === 'wallpaper') return null;
            
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
            
            // 否則渲染普通版本
            return renderStaticItem(categoryKey, item, transform);
          })}
        </ImageBackground>
      </View>
    </View>
  );

  function renderStaticItem(
    category: ProductCategory, 
    item: Product, 
    transform: ItemTransform
  ) {
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
  }
}

const styles = StyleSheet.create({
  container: {
    height: PREVIEW_HEIGHT,
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
  emptyText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
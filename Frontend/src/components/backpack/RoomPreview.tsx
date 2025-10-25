import React, { useState, useEffect, forwardRef } from 'react';
import { View, StyleSheet, ImageBackground, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Product, ProductCategory } from '@/interface/Product';
import { ItemTransform } from '@/utils/roomStorage';
import EditableProduct from './EditableProduct';
import { ImageSize } from '@/interface/Image';
import { ITEM_Z_INDEX } from '@/interface/Product';
import Logo from '../auth/Logo';
import { Dog } from '../Dog';

interface RoomPreviewProps {
  selectedItems: Partial<Record<ProductCategory, Product>>;
  onItemPress: (category: ProductCategory) => void;
  editingCategory?: ProductCategory | null;
  onStartEdit?: (category: ProductCategory | null) => void;
  containerHeight?: number;
  itemTransforms: Partial<Record<ProductCategory, ItemTransform>>;
  onTransformUpdate: (category: ProductCategory, transform: ItemTransform) => void;
  showWatermark?: boolean;
}

const { width, height } = Dimensions.get('window');
const DEFAULT_SIZE = 60;

const getDefaultPositions = (containerHeight: number): Record<ProductCategory, { x: number; y: number }> => ({
  table: { x: width * 0.5, y: containerHeight * 0.5 },
  bookshelf: { x: width * 0.3, y: containerHeight * 0.4 },
  lamp: { x: width * 0.7, y: containerHeight * 0.3 },
  carpet: { x: width * 0.5, y: containerHeight * 0.7 },
  pendant: { x: width * 0.4, y: containerHeight * 0.25 },
  calendar: { x: width * 0.6, y: containerHeight * 0.45 },
  wallpaper: { x: 0, y: 0 },
});

const RoomPreview = forwardRef<View, RoomPreviewProps>(({ 
  selectedItems, 
  onItemPress,
  editingCategory = null,
  onStartEdit,
  containerHeight,
  itemTransforms,
  onTransformUpdate,
  showWatermark = false,
}, ref) => {

  const [imageSizes, setImageSizes] = useState<Partial<Record<ProductCategory, ImageSize>>>({});
  const [currentEditingTransform, setCurrentEditingTransform] = useState<ItemTransform | null>(null);

  useEffect(() => {
    if (editingCategory) {
      const transform = getItemTransform(editingCategory);
      setCurrentEditingTransform(transform);
    } else {
      setCurrentEditingTransform(null);
    }
  }, [editingCategory, itemTransforms]);

  const actualHeight = containerHeight || height;
  const defaultPositions = getDefaultPositions(actualHeight);
  
  const currentBackground = selectedItems.wallpaper?.image?.url;

  useEffect(() => {
    const loadImageSizes = async () => {
      const newImageSizes: Partial<Record<ProductCategory, ImageSize>> = {};
      
      const promises = Object.entries(selectedItems).map(([category, item]) => {
        if (!item || category === 'wallpaper' || !item.image?.url) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
          Image.getSize(
            item.image!.url,
            (imgWidth, imgHeight) => {
              const maxSize = 80;
              const ratio = Math.min(maxSize / imgWidth, maxSize / imgHeight);
              const displayWidth = imgWidth * ratio;
              const displayHeight = imgHeight * ratio;
              
              newImageSizes[category as ProductCategory] = {
                width: Math.round(displayWidth),
                height: Math.round(displayHeight)
              };
              resolve();
            },
            (error) => {
              console.log(`Failed to get image size for ${category}:`, error);
              newImageSizes[category as ProductCategory] = {
                width: DEFAULT_SIZE,
                height: DEFAULT_SIZE
              };
              resolve();
            }
          );
        });
      });

      await Promise.all(promises);
      setImageSizes(newImageSizes);
    };

    loadImageSizes();
  }, [selectedItems]);

  const getItemTransform = (category: ProductCategory): ItemTransform => {
    return itemTransforms[category] || {
      position: defaultPositions[category],
      scale: 2,
      rotation: 0,
    };
  };

  const getItemSize = (category: ProductCategory): ImageSize => {
    return imageSizes[category] || { width: DEFAULT_SIZE, height: DEFAULT_SIZE };
  };

  const handleEditConfirm = (
    category: ProductCategory, 
    position: { x: number; y: number }, 
    scale: number, 
    rotation: number
  ) => {
    const transform: ItemTransform = { position, scale, rotation };
    
    onTransformUpdate(category, transform);
    
    if (onStartEdit) {
      onStartEdit(null);
    }
    
    setCurrentEditingTransform(null);
  };

  const handleEditingTransformChange = (
    category: ProductCategory,
    position: { x: number; y: number },
    scale: number,
    rotation: number
  ) => {
    setCurrentEditingTransform({ position, scale, rotation });
  };

  const handleBackgroundPress = () => {
    if (editingCategory && currentEditingTransform) {
      handleEditConfirm(
        editingCategory,
        currentEditingTransform.position,
        currentEditingTransform.scale,
        currentEditingTransform.rotation
      );
    }
  };

  const handleItemPress = (category: ProductCategory) => {
    if (editingCategory) {
      return;
    }
    
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
    const imageSize = getItemSize(category);
    const containerWidth = imageSize.width;
    const containerHeight = imageSize.height;
    const zIndex = transform.zIndex ?? ITEM_Z_INDEX[category];

    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.itemContainer,
          {
            left: transform.position.x - containerWidth / 2,
            top: transform.position.y - containerHeight / 2,
            width: containerWidth,
            height: containerHeight,
            zIndex: zIndex,
            transform: [
              { scale: transform.scale },
              { rotate: `${transform.rotation}deg` }
            ],
          }
        ]}
        onPress={() => handleItemPress(category)}
        disabled={!!editingCategory}
      >
        <View style={[
          styles.imageWrapper,
          {
            width: containerWidth,
            height: containerHeight,
          }
        ]}>
          <Image
            source={{ uri: item.image?.url }}
            style={[
              styles.itemImage,
              {
                width: imageSize.width,
                height: imageSize.height,
              },
              editingCategory && editingCategory !== category && styles.dimmedItem
            ]}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View ref={ref} collapsable={false} style={[styles.container, containerHeight ? { height: containerHeight } : {}]}>      
      <View style={styles.previewContainer}>
        <ImageBackground
          source={{ uri: currentBackground }}
          style={styles.roomBackground}
          resizeMode="cover"
        >
          {editingCategory && (
            <TouchableOpacity
              style={styles.backgroundOverlay}
              onPress={handleBackgroundPress}
              activeOpacity={1}
            />
          )}

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
                  onTransformChange={handleEditingTransformChange}
                />
              );
            }
            
            return renderStaticItem(categoryKey, item, transform);
          })}

          {showWatermark && (
            <View style={styles.watermarkContainer}>
              <Dog
                source={require('@/assets/images/walking.json')}
                size={180}
                initialY={height - 220}
                autoWalk={false}
              />
              <View style={styles.logo}>
                <Logo fontColor='white'/>
              </View>
            </View>
          )}
        </ImageBackground>
      </View>
    </View>
  );
});

RoomPreview.displayName = 'RoomPreview';

export default RoomPreview;

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
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 500,
  },
  itemContainer: {
    position: 'absolute',
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
  },
  dimmedItem: {
    opacity: 0.3,
  },
  
  watermarkContainer: {
    flex: 1,
    width: '100%',
    overflow:'hidden',
    zIndex: 1000,
  },
  logo: {
    position: 'absolute',
    bottom: -12,
    left: 8
  }
});
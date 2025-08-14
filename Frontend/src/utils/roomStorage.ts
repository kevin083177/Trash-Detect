import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, ProductCategory } from '@/interface/Product';
import { asyncGet } from './fetch';
import { theme_api } from '@/api/api';
import { Platform } from 'react-native';

const ROOM_KEY = 'room';

export interface ItemTransform {
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  zIndex?: number;
}

export interface RoomData {
  selectedItems: Partial<Record<ProductCategory, Product>>;
  itemTransforms: Partial<Record<ProductCategory, ItemTransform>>;
}

export const saveRoom = async (
  selectedItems: Partial<Record<ProductCategory, Product>>,
  itemTransforms?: Partial<Record<ProductCategory, ItemTransform>>
): Promise<void> => {
  try {
    const roomData: RoomData = {
      selectedItems,
      itemTransforms: itemTransforms || {}
    };
    await AsyncStorage.setItem(ROOM_KEY, JSON.stringify(roomData));
  } catch (error) {
    console.error('保存房間資料失敗:', error);
    throw error;
  }
};

export const loadRoom = async (): Promise<RoomData> => {
  try {
    const storedData = await AsyncStorage.getItem(ROOM_KEY);
    if (storedData) {
      const roomData: RoomData = JSON.parse(storedData);
      return {
        selectedItems: roomData.selectedItems || {},
        itemTransforms: roomData.itemTransforms || {}
      };
    }
  } catch (error) {
    console.error('讀取房間資料失敗:', error);
  }
  
  return {
    selectedItems: {},
    itemTransforms: {}
  };
};

export const removeItem = async (category: ProductCategory): Promise<void> => {
  try {
    const existingData = await loadRoom();
    
    const newSelectedItems = { ...existingData.selectedItems };
    delete newSelectedItems[category];
    
    const newTransforms = { ...existingData.itemTransforms };
    delete newTransforms[category];
    
    await saveRoom(newSelectedItems, newTransforms);
  } catch (error) {
    console.error('移除商品失敗:', error);
    throw error;
  }
};

export const hasRoom = async (): Promise<boolean> => {
  try {
    const storedData = await AsyncStorage.getItem(ROOM_KEY);
    return storedData !== null;
  } catch (error) {
    console.error('檢查房間資料失敗:', error);
    return false;
  }
};

export const clearRoom = async(): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ROOM_KEY);
  } catch (error) {
    console.error('移除房間失敗: ', error);
  }
}

const fetchDefaultTheme = async(token: string): Promise<Product[]> => {
  try {
    const response = await asyncGet(`${theme_api.get_theme}/預設`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (response && response.body) {
      return response.body.products;
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    throw error;
  }
}
const generateDefaultTransform = (width: number, height: number, category: ProductCategory): ItemTransform => {
  const isTablet = Math.min(width, height) >= 768;
  const baseTransforms: Partial<Record<ProductCategory, ItemTransform>> = {
    'wallpaper': { position: { x: 0, y: 0 }, scale: 1, rotation: 0},
    'carpet': { position: { x: width / 2, y: height / 1.3 }, scale: 3.5, rotation: 0},
    'table': { position: { x: width / 1.8, y: height / 1.6 }, scale: 2, rotation: 0},
    'bookshelf': { position: { x: 60, y: height / 1.7 }, scale: 2.8, rotation: 0},
    'lamp': { position: { x: width - 45, y: height / 1.7 }, scale: 3, rotation: 0},
    'pendant': { position: { x: 120, y: 75}, scale: 3, rotation: 0},
    'calendar': { position: { x: width / 3, y: height / 4 }, scale: 1.5, rotation: 0},
    'box': { position: { x: 0, y: 0 }, scale: 1, rotation: 0},
  };

  const baseTransform = baseTransforms[category] as ItemTransform;
  
  if (isTablet) {
    const scaleFactor = height / width;
    
    let adjustedX = baseTransform.position.x;
    let adjustedY = baseTransform.position.y;

    if (category === 'bookshelf') {
      adjustedX = baseTransform.position.x * scaleFactor;
    } else if (category === 'lamp') {
      adjustedX = baseTransform.position.x - 30;
    } else if (category === 'pendant') {
      adjustedX = baseTransform.position.x + 60;
      adjustedY = baseTransform.position.y + 50;
    }
    
    return {
      position: { 
        x: adjustedX, 
        y: adjustedY 
      },
      scale: baseTransform.scale * scaleFactor,
      rotation: baseTransform.rotation
    };
  }

  return baseTransform;
};


export const loadDefaultDecorations = async (token: string, width: number, height: number): Promise<RoomData> => {
  try {
    const defaultProducts = await fetchDefaultTheme(token);
    const selectedItems: Partial<Record<ProductCategory, Product>> = {};
    const itemTransforms: Partial<Record<ProductCategory, ItemTransform>> = {};
    
    defaultProducts.forEach((product: Product) => {
      const category = product.type as ProductCategory;
      selectedItems[category] = product;
      itemTransforms[category] = generateDefaultTransform(width, height, category);
    });
    
    const roomData: RoomData = {
      selectedItems,
      itemTransforms
    };

    await saveRoom(selectedItems, itemTransforms);

    return roomData;
  } catch (error) {
    console.error('加載預設裝飾失敗:', error);
    throw error;
  }
};
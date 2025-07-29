import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, ProductCategory } from '@/interface/Product';

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
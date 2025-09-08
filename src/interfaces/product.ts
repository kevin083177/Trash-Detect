import type { Image } from "./image";

export interface Product{
    _id: string;
    name: string;
    description: string;
    price: number;
    theme?: string;
    type: ProductType;
    image: Image;
}

export type ProductType = | 'bookshelf' | 'calendar' | 'carpet' | 'lamp' | 'pendant' | 'table' | 'wallpaper';

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  bookshelf: '書架',
  calendar: '時間', 
  carpet: '地毯',
  lamp: '燈具',
  pendant: '吊飾',
  table: '桌子',
  wallpaper: '壁紙'
} as const;


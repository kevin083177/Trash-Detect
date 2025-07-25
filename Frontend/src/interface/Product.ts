import { Image } from "./Image";

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  theme: string;
  type: string;
  image: Image;
}

export interface PurchasedProducts {
  bookshelf: Product[];
  box: Product[];
  calendar: Product[];
  carpet: Product[];
  lamp: Product[];
  pendant: Product[];
  table: Product[];
  wallpaper: Product[];
}

export interface SelectedDecorations {
  wallpaper?: string;
  box?: string;
  table?: string;
  carpet?: string;
  bookshelf?: string;
  lamp?: string;
  pendant?: string;
  calendar?: string;
}

export type ProductCategory = 
  | 'bookshelf' 
  | 'box' 
  | 'calendar' 
  | 'carpet' 
  | 'lamp' 
  | 'pendant' 
  | 'table' 
  | 'wallpaper';
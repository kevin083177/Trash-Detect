export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  theme: string;
  type: string;
  image: ProductImage;
}

interface ProductImage {
  public_id: string;
  url: string;
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
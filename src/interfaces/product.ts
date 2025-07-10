import type { Image } from "./image";

export interface Product{
    _id: string;
    name: string;
    description: string;
    price: number;
    type: ProductType;
    image: Image;
}

type ProductType = | 'bookshelf' | 'box' | 'calendar' | 'carpet' | 'lamp' | 'pendant' | 'table' | 'wallpaper';
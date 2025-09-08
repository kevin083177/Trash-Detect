import { type Image } from "./image";
import type { Product } from "./product";

export interface Theme {
    _id?: string;
    name: string;
    description: string;
    products?: Product[];
    image: Image;
};
export interface Product {
    _id: string;
    name: string;
    description?: string;
    price: number;
    image: {
      thumbnail_url: string;
    };
}
import { product_api } from '@/api/api';
import { asyncGet } from '@/utils/fetch';
import { tokenStorage } from '@/utils/storage';
import React, { createContext, useContext, useState, useEffect } from 'react';

// 定義商品回傳樣式
export interface Product {
    _id: string;
    description: string;
    image: {
      folder: string;
      public_id: string;
      thumbnail_url: string;
      url: string;
    };
    name: string;
    price: number;
    recycle_requirement: {
      [key: string]: number;
    };
}

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: (folder: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (folder: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await asyncGet(`${product_api.get_product_by_folder}/${folder}`, {
        headers: {
            'Authorization': `Bearer ${await tokenStorage.getToken()}`,
        },
      });
      if (response.status === 200) {
        setProducts(response.body);
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProductContext.Provider value={{ products, loading, error, fetchProducts }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (context === undefined) {
      throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};
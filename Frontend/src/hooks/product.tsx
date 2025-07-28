import { purchase_api, theme_api } from "@/api/api";
import { Product, PurchasedProducts } from "@/interface/Product";
import { asyncGet, asyncPost } from "@/utils/fetch";
import { tokenStorage } from "@/utils/tokenStorage";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

interface ProductContextType {
    themes: string[];
    themeProducts: Record<string, Product[]>;
    themeLoading: Record<string, boolean>;
    purchasedProductIds: string[];
    purchasedProductsByType: PurchasedProducts;
    loading: boolean;

    fetchThemes: () => Promise<void>;
    fetchPurchasedProducts: () => Promise<void>;
    fetchPurchasedProductsByType: () => Promise<void>;
    purchaseProduct: (productId: string) => Promise<boolean>;
    refreshAll: () => Promise<void>;

    isProductPurchased: (productId: string) => boolean;
    hasEnoughMoney: (productPrice: number, userMoney: number) => boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)

interface ProductProviderProps {
    children: ReactNode;
}

export function ProductProvider ({ children }: ProductProviderProps) {
    const [themes, setThemes] = useState<string[]>([]);
    const [themeProducts, setThemeProducts] = useState<Record<string, Product[]>>({});
    const [themeLoading, setThemeLoading] = useState<Record<string, boolean>>({});
    const [purchasedProductIds, setPurchasedProductIds] = useState<string[]>([]);
    const [purchasedProductsByType, setPurchasedProductsByType] = useState<PurchasedProducts>({
        bookshelf: [],
        box: [],
        calendar: [],
        carpet: [],
        lamp: [],
        pendant: [],
        table: [],
        wallpaper: [],
    });
    const [loading, setLoading] = useState<boolean>(false);

    const fetchThemes = useCallback(async() => {
        const token = await tokenStorage.getToken();
        if (!token) return;

        try {
            setLoading(true);
            
            // 調用新的API路徑，獲取所有主題及其產品
            const response = await asyncGet(theme_api.get_all_themes, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            
            if (response && response.body) {
                const themesWithProducts = response.body;
                
                // 提取主題名稱
                const themeNames: string[] = [];
                const productsMap: Record<string, Product[]> = {};
                const loadingState: Record<string, boolean> = {};
                
                themesWithProducts.forEach((themeData: any) => {
                    const themeName = themeData.name;
                    themeNames.push(themeName);
                    productsMap[themeName] = themeData.products || [];
                    loadingState[themeName] = false; // 數據已經加載完成
                });
                
                setThemes(themeNames);
                setThemeProducts(productsMap);
                setThemeLoading(loadingState);
            } 
        }
        catch (error) {
            console.log("Error fetch themes: ", error);
        } finally {
            setLoading(false);
        }
    }, [])

    const fetchPurchasedProductsByType = useCallback(async () => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) return;
        
            const response = await asyncGet(purchase_api.get_purchase_by_type, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
        
            if (response && response.body) {
                const products: PurchasedProducts = {
                    bookshelf: response.body.bookshelf || [],
                    box: response.body.box || [],
                    calendar: response.body.calendar || [],
                    carpet: response.body.carpet || [],
                    lamp: response.body.lamp || [],
                    pendant: response.body.pendant || [],
                    table: response.body.table || [],
                    wallpaper: response.body.wallpaper || [],
                };
            
                setPurchasedProductsByType(products);
            }
        } catch (error) {
            console.error('Failed to fetch purchased product by type: ', error);
        }
    }, []);

    const fetchPurchasedProducts = useCallback(async () => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) return;
            
            const response = await asyncGet(purchase_api.get_purchase, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response && response.body) {
                 const purchasedIds = response.body.product.map((item: any) => item._id);
                setPurchasedProductIds(purchasedIds);
            }
        } catch (error) {
            console.log("Failed to fetch prucahsed products: ", error);
        }
    }, [])

    const purchaseProduct = useCallback(async (productId: string): Promise<boolean> => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) return false;

            const response = await asyncPost(purchase_api.purchase, {
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: {
                    'product_id': productId,
                }
            })

            if (response.status === 200) {
                setPurchasedProductIds(prev => [...prev, productId]);
                return true;
            }
            return false;
        } catch (error) {
            console.log("Failed to purchase product: ", error);
            return false;
        }
    }, [])

    const refreshAll = useCallback(async () => {
        await Promise.all([
            fetchThemes(),
            fetchPurchasedProducts()
        ]);
    }, [fetchThemes, fetchPurchasedProducts]);

    const isProductPurchased = useCallback((productId: string) => {
        return purchasedProductIds.includes(productId);
    }, [purchasedProductIds]);

    const hasEnoughMoney = useCallback((productPrice: number, userMoney: number) => {
        return userMoney >= productPrice;
    }, []);
    
    useEffect(() => {
        fetchPurchasedProducts();
        fetchPurchasedProductsByType();
    }, [fetchPurchasedProducts, fetchPurchasedProductsByType]);

    const value: ProductContextType = {
        themes,
        themeProducts,
        themeLoading,
        purchasedProductIds,
        purchasedProductsByType,
        loading,
        
        fetchThemes,
        fetchPurchasedProducts,
        fetchPurchasedProductsByType,
        purchaseProduct,
        refreshAll,
        
        isProductPurchased,
        hasEnoughMoney,
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
}

export function useProduct () {
    const context = useContext(ProductContext);

    if (context === undefined) {
        throw new Error('useProduct must be used within a ProductProvider');
    }

    return context;
}
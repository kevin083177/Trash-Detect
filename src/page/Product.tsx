import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import "../styles/Product.css";
import type { Product } from "../interfaces/product";
import { ProductCard } from "../components/product/ProductCard";
import type { Theme } from "../interfaces/theme";
import { asyncDelete } from "../utils/fetch";
import { EditThemeModal } from "../components/product/EditThemeModal";
import { ProductModal } from "../components/product/ProductModal";
import { MdEdit } from "react-icons/md";
import { BiImageAdd } from "react-icons/bi";
import { product_api } from "../api/api";
import { useNotification } from "../context/NotificationContext";

export const ProductPage: React.FC = () => {
    const { theme_name } = useParams();
    const location = useLocation();
    
    const { _id: theme_id , name, description, products: stateProducts, image } = location.state as Theme;
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [themeInfo, setThemeInfo] = useState<Theme | null>(null);
    
    const [showEditThemeModal, setShowEditThemeModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const { showSuccess, showError } = useNotification();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            if (name && stateProducts !== undefined) {
                setThemeInfo({
                    _id: theme_id,
                    name, 
                    description: description, 
                    image 
                });
                setProducts(Array.isArray(stateProducts) ? stateProducts : []);
                setLoading(false);
                return;
            } else {
                setError("主題名稱不存在");
                showError("主題名稱不存在");
            }

            setLoading(false);
        };

        loadData();
    }, [theme_id, name, stateProducts, description, image, theme_name]);

    
    const handleThemeSave = (updatedTheme: Theme) => {
        setThemeInfo(updatedTheme);
    };

    const handleProductSave = (savedProduct: Product) => {
        if (editProduct) {
            setProducts(products.map(p => p._id === savedProduct._id ? savedProduct : p));
        } else {
            setProducts(prevProducts => [...prevProducts, savedProduct]);
        }
    };

    const handleThemeClick = () => {
        setShowEditThemeModal(true);
    };

    const handleAddProduct = () => {
        setEditProduct(null);
        setShowProductModal(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditProduct(product);
        setShowProductModal(true);
    };

    if (loading) {
        return (
            <div className="theme-products-container">
                <div className="loading">載入中...</div>
            </div>
        );
    }

    if (error || !themeInfo) {
        showError("找不到主題資料");
        return (
            <div className="theme-products-container">
                <div className="product-error">{error}</div>
            </div>
        );
    }

    return (
        <div className="theme-products-container">
            <div className="theme-layout">
                <div className="theme-info-section" onClick={handleThemeClick}>
                    <div className="theme-image-container">
                        {themeInfo.image?.url && (
                            <img 
                                src={themeInfo.image.url} 
                                alt={themeInfo.name}
                                className="theme-main-image"
                            />
                        )}
                        
                        <div className="theme-details">
                            <h1 className="theme-title">{themeInfo.name}</h1>
                            {themeInfo.description && (
                                <p className="theme-description">{themeInfo.description}</p>
                            )}
                        </div>

                        <div className="theme-edit-overlay">
                            <span className="theme-edit-icon">
                                <MdEdit size={24}/>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="products-section">
                    <div className="products-header">
                        <h2 className="products-section-title">商品列表</h2>
                        {products.length > 0 && (
                            <button className="add-product-btn" onClick={handleAddProduct}>
                                <BiImageAdd size={20}/>
                                <p>新增商品</p>
                            </button>
                        )}
                    </div>
                    {products.length === 0 && (
                        <div className="empty-products">
                            <p>這個主題還沒有商品</p>
                            <button className="add-product-btn" onClick={handleAddProduct}>
                                新增第一個商品
                            </button>
                        </div>
                    )}
                    <div className="products-grid">
                        {products.length > 0 && (
                            products.map((product) => (
                                <ProductCard
                                    key={product._id}
                                    name={product.name}
                                    description={product.description}
                                    price={product.price}
                                    type={product.type}
                                    image={product.image?.url || ''}
                                    onEdit={() => handleEditProduct(product)}
                                    onDelete={async () => {
                                        if (window.confirm("確定要刪除這個商品嗎？")) {
                                            try {
                                                const response = await asyncDelete(product_api.delete, {
                                                    headers: {
                                                        Authorization: `Bearer ${localStorage.getItem('token')}`
                                                    },
                                                    body: {
                                                        product_id: product._id
                                                    }
                                                })
                                                if (response.status === 200) {
                                                    setProducts(products.filter(p => p._id !== product._id));
                                                    showSuccess('成功刪除商品')
                                                }
                                            } catch (error) {
                                                showError(error as string);
                                            }
                                        }
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            <ProductModal
                isOpen={showProductModal}
                onClose={() => {
                    setShowProductModal(false);
                    setEditProduct(null);
                }}
                onSave={handleProductSave}
                themeName={themeInfo.name}
                existingProducts={products}
                product={editProduct}
            />

            <EditThemeModal
                isOpen={showEditThemeModal}
                onClose={() => setShowEditThemeModal(false)}
                onSave={handleThemeSave}
                initialData={themeInfo}
            />
        </div>
    );
};
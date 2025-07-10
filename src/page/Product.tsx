import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Product.css";
import type { Product } from "../interfaces/product";
import { asyncGet } from "../utils/fetch";
import { theme_api } from "../api/api";
import { ProductCard } from "../components/product/ProductCard";


export const ProductPage: React.FC = () => {
    const { theme_name } = useParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    
    const filtered = products.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase())
    );
    
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({
        name: "",
        price: "",
        theme_name: theme_name || "",
        category: "",
        description: "",
        image: "",
    });

    useEffect(() => {
        const fetchProducts = async () => {
            if (!theme_name) {
                setError("主題名稱不存在");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                
                const response = await asyncGet(`${theme_api.get_theme_products}/${theme_name}/products`, {
                    headers: { 
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                // 檢查回傳的資料結構
                if (response && response.body && Array.isArray(response.body)) {
                    setProducts(response.body);
                } else {
                    setError("無法獲取商品資料");
                }
            } catch (err) {
                console.error("獲取商品資料失敗:", err);
                setError("獲取商品資料失敗，請稍後再試");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [theme_name]);

    const handleOpenAddModal = () => {
        setNewItem({
            name: "",
            price: "",
            theme_name: theme_name || "",
            category: "",
            description: "",
            image: "",
        });
        setShowAddModal(true);
    };

    useEffect(() => {
        console.log("當前主題:", theme_name);
    }, [theme_name]);

    // 載入中的狀態
    if (loading) {
        return (
            <div className="theme-products-container">
                <button className="theme-products-back-btn" onClick={() => navigate(-1)}>
                    ← 返回
                </button>
                <div className="loading">載入中...</div>
            </div>
        );
    }

    // 錯誤狀態
    if (error) {
        return (
            <div className="theme-products-container">
                <button className="theme-products-back-btn" onClick={() => navigate(-1)}>
                    ← 返回
                </button>
                <div className="error">{error}</div>
            </div>
        );
    }

    return (
        <div className="theme-products-container">
            <button className="theme-products-back-btn" onClick={() => navigate(-1)}>
                ← 返回
            </button>
            <div className="theme-products-topbar">
                <div className="topbar-search">
                    <input
                        type="text"
                        placeholder="搜尋商品"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="topbar-actions">
                    <button className="topbar-btn" onClick={handleOpenAddModal}>➕ 新增商品</button>
                </div>
            </div>

            <div className="theme-products-grid">
                {filtered.length === 0 ? (
                    <p>查無商品。</p>
                ) : (
                    filtered.map((product) => (
                        <ProductCard
                            key={product._id}
                            name={product.name}
                            description={product.description}
                            price={product.price}
                            type={product.type}
                            image={product.image.url}
                            onEdit={() => {
                                // 處理編輯邏輯
                                console.log('編輯商品:', product._id);
                            }}
                            onDelete={() => {
                                // 處理刪除邏輯
                                console.log('刪除商品:', product._id);
                            }}
                        />
                    ))
                )}
            </div>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-wrapper">
                        <div className="modal-card">
                            <div className="modal-left">
                                {newItem.image ? (
                                    <img src={newItem.image} alt="預覽" className="modal-image" />
                                ) : (
                                    <label className="modal-image-placeholder">
                                        上傳圖片
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setNewItem({ ...newItem, image: reader.result as string });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                )}
                                <input
                                    className="modal-input"
                                    placeholder="物品名稱"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                />
                                <input
                                    className="modal-input"
                                    placeholder="價錢"
                                    value={newItem.price}
                                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                />
                            </div>
                            <div className="modal-right">
                                <input
                                    className="modal-input"
                                    placeholder="類別"
                                    value={newItem.theme_name}
                                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                />
                                <textarea
                                    className="modal-textarea"
                                    placeholder="物品介紹"
                                    value={newItem.description}
                                    onChange={(e) =>
                                        setNewItem({ ...newItem, description: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className="modal-actions-centered">
                            <button className="product-back" onClick={() => setShowAddModal(false)}>取消</button>
                            <button className="product-submit" onClick={() => setShowAddModal(false)}>新增</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
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
    const [showEditThemeModal, setShowEditThemeModal] = useState(false);
    const [editThemeName, setEditThemeName] = useState(theme_name || "");
    const [editThemeDesc, setEditThemeDesc] = useState("");
    const [editThemeImage, setEditThemeImage] = useState<string | null>(null);
    const [showEditProductModal, setShowEditProductModal] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
        const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({
        name: "",
        price: 0,
        theme_name: theme_name || "",
        type: "",
        description: "", 
        image: "",
    });

    const filtered = products.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase())
    );

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
            price: 0,
            theme_name: theme_name || "",
            type: "",
            description: "",
            image: "",
        });
        setShowAddModal(true);
    };

    useEffect(() => {
        console.log("當前主題:", theme_name);
    }, [theme_name]);

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
                    <button className="topbar-btn" onClick={() => setShowEditThemeModal(true)}>編輯主題</button>
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
                                setEditProduct(product);
                                setShowEditProductModal(true);
                            }}
                            onDelete={async () => {
                                if (window.confirm("確定要刪除這個商品嗎？")) {
                                    // await asyncDelete(`${theme_api.delete_product}/${product._id}`);
                                    setProducts(products.filter(p => p._id !== product._id));
                                }
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
                                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                                />
                            </div>
                            <div className="modal-right">
                                <select
                                    className="modal-input"
                                    value={newItem.type}
                                    onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                                >
                                    <option value="">請選擇類別</option>
                                    <option value="bookshelf">書架</option>
                                    <option value="box">收納盒</option>
                                    <option value="calendar">月曆</option>
                                    <option value="carpet">地毯</option>
                                    <option value="lamp">燈具</option>
                                    <option value="pendant">吊飾</option>
                                    <option value="table">桌子</option>
                                    <option value="wallpaper">壁紙</option>
                                </select>
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

            {showEditThemeModal && (
                <div className="theme-modal-overlay">
                    <div className="theme-modal-content">
                        <div className="theme-modal-left">
                            <label className="theme-image-upload">
                                {editThemeImage ? (
                                    <img
                                        src={editThemeImage}
                                        alt="主題預覽"
                                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }}
                                    />
                                ) : (
                                    "+新增圖片"
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setEditThemeImage(reader.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                        <div className="theme-modal-right">
                            <input
                                className="theme-name-input"
                                type="text"
                                placeholder="主題名稱"
                                value={editThemeName}
                                onChange={e => setEditThemeName(e.target.value)}
                            />
                            <textarea
                                className="theme-description-input"
                                placeholder="說明"
                                value={editThemeDesc}
                                onChange={e => setEditThemeDesc(e.target.value)}
                            />
                        </div>
                        <button
                            className="theme-modal-submit"
                            onClick={() => {
                                setShowEditThemeModal(false);
                            }}
                        >
                            儲存
                        </button>
                        <button
                            className="theme-modal-close"
                            onClick={() => setShowEditThemeModal(false)}
                        >
                            關閉
                        </button>
                    </div>
                </div>
            )}

            {/* 編輯商品 Modal */}
            {showEditProductModal && editProduct && (
                <div className="modal-overlay">
                    <div className="modal-wrapper">
                        <div className="modal-card">
                            <div className="modal-left">
                                {editProduct.image ? (
                                    <img src={editProduct.image.url} alt="預覽" className="modal-image" />
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
                                                        setEditProduct({
                                                            ...editProduct,
                                                            image: { ...editProduct.image, url: reader.result as string }
                                                        });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                )}
                                <select
                                    className="modal-type"
                                    value={editProduct.type}
                                    onChange={e => setEditProduct({ ...editProduct, type: e.target.value as Product["type"] })}
                                >
                                    <option value="">請選擇類別</option>
                                    <option value="bookshelf">書架</option>
                                    <option value="box">收納盒</option>
                                    <option value="calendar">日曆</option>
                                    <option value="carpet">地毯</option>
                                    <option value="lamp">燈具</option>
                                    <option value="pendant">吊飾</option>
                                    <option value="table">桌子</option>
                                    <option value="wallpaper">壁紙</option>
                                </select>                                                                
                            </div>
                            <div className="modal-right">
                                <input
                                    className="modal-name"
                                    placeholder="物品名稱"
                                    value={editProduct.name}
                                    onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                                />
                                <textarea
                                    className="modal-description"
                                    placeholder="物品介紹"
                                    value={editProduct.description}
                                    onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                                />
                                <input
                                    className="modal-price"
                                    placeholder="價錢"
                                    value={editProduct.price}
                                    onChange={(e) => setEditProduct({ ...editProduct, price: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="modal-actions-centered">
                            <button className="product-back" onClick={() => setShowEditProductModal(false)}>取消</button>
                            <button
                                className="product-submit"
                                onClick={async () => {
                                    // await asyncPut(`${theme_api.update_product}/${editProduct._id}`, editProduct);
                                    setShowEditProductModal(false);
                                    setProducts(products.map(p => p._id === editProduct._id ? editProduct : p));
                                }}
                            >
                                儲存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
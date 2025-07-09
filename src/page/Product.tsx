import React, { useState , useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Product.css";

// 商品資料改為陣列格式
const allProducts = [
    {
        name: "橘子訊息框",
        price: 200,
        theme_name: "橘續分類",
        category:"桌子",
        description: "這是橘子訊息框",
        image: "https://via.placeholder.com/100"
    },
    // 可再加入更多商品
];

export const Product: React.FC = () => {
    const { theme_name } = useParams(); // 取得網址上的分類
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    // 依分類與搜尋篩選
    const filtered = allProducts.filter(
        product =>
            product.theme_name === theme_name &&
            product.name.includes(search)
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

    
    

    return (
        <div className="theme-products-container">
            <h2>主題: {theme_name}</h2>
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
                    filtered.map((product, index) => (
                        <div key={index} className="product-card">
                            <div className="product-card-left">
                                <div className="product-card-image-box">
                                    <img src={product.image} alt={product.name} className="product-card-image" />
                                </div>
                                <div className="product-card-name">{product.name}</div>
                            </div>
                            <div className="product-card-right">
                                <div className="product-card-header">
                                    <span className="product-card-title">訊息框</span>
                                    <span className="product-card-actions">
                                        <button className="icon-btn" title="編輯">✏️</button>
                                        <button className="icon-btn" title="刪除">🗑️</button>
                                    </span>
                                </div>
                                <div className="product-card-desc">{product.description}</div>
                                <div className="product-card-price">${product.price}</div>
                            </div>
                        </div>
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
                            <button className="product-back" onClick={() => navigate(-1)}>取消</button>
                            <button className="product-submit"onClick={() => setShowAddModal(false)}>新增</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

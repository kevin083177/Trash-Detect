import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Theme.css";
import { asyncGet } from "../utils/fetch";
import { theme_api } from "../api/api";
import type { Theme } from "../interfaces/theme";

export const Themes: React.FC = () => {
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [themes, setThemes] = useState<Theme[]>([]);
    const filteredThemes = themes.filter(theme =>
        theme.name.includes(search)
    );
    useEffect(() => {
        const fetchThemesName = async () => {
            try {
                const response = await asyncGet(theme_api.get_all_themes, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                })

                if (response.body) {
                    const names: string[] = response.body;
                    const promises = names.map(async (name) => {
                        const themeDetail = await fetchThemesPreview(name);
                        return themeDetail
                    })
                    const detailedThemes = await Promise.all(promises);
                    setThemes(detailedThemes);
                    console.log(detailedThemes);
                }
            } catch (e) {
                console.log(e);
            }
        }
        fetchThemesName();
    }, [])

    const fetchThemesPreview = async (name: string): Promise<Theme> => {
        const response = await asyncGet(`${theme_api.get_theme}${name}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        return response.body;
    };
    return (
        <div className="container">
            <div className="home-header">
                <span>Hi, Username</span>
            </div>
            <div className="header">
                <div className="search-group">
                    <span role="img" aria-label="search" style={{ fontSize: 20 }}>🔍</span>
                    <input
                        type="text"
                        placeholder="搜尋主題或商品"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        新增主題
                    </button>
                </div>
            </div>

            <div className="themes">
                {filteredThemes.map((theme) => (
                    <div
                        key={theme.name}
                        className="theme-card"
                        style={{ background: "#fff", cursor: "pointer" }}
                        onClick={() => navigate(`/products/${theme.name}`)}
                    >
                        <img src={theme.image.url} className="theme-image" />
                        <div className="theme-name">{theme.name}</div>
                    </div>
                ))}
            </div>
            {showModal && (
                <div className="theme-modal-overlay">
                    <div className="theme-modal-content">
                        <div className="theme-modal-left">
                            <label className="theme-image-upload">
                                +新增圖片
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                />
                            </label>
                        </div>
                        <div className="theme-modal-right">
                            <input
                                className="theme-name-input"
                                type="text"
                                placeholder="主題名稱"
                            />
                            <input
                                className="theme-description-input"
                                type="text"
                                placeholder="說明"
                            />
                        </div>
                        <button className="theme-modal-submit" onClick={() => setShowModal(false)}>新增</button>
                        <button className="theme-modal-close" onClick={() => setShowModal(false)}>關閉</button>
                    </div>
                </div>
            )}
        </div>
    );
}
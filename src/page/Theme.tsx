import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Theme.css";
import { asyncGet } from "../utils/fetch";
import { theme_api } from "../api/api";
import type { Theme } from "../interfaces/theme";
import { Header } from "../components/Header";
import { AddThemeModal } from "../components/theme/AddThemeModal";
import { MdChair } from "react-icons/md";

export const Themes: React.FC = () => {
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const [showAddModal, setShowAddModal] = useState(false);
    const [themes, setThemes] = useState<Theme[]>([]);
    const filteredThemes = themes.filter(theme =>
        theme.name.includes(search)
    );
    
    useEffect(() => {
        const fetchThemes = async () => {
            try {
                const response = await asyncGet(theme_api.get_all_themes, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.body) {
                    setThemes(response.body);
                }
            } catch (e) {
                console.log(e);
            }
        }
        fetchThemes();
    }, []);

    const handleOpenAddModal = () => {
        setShowAddModal(true);
    };

    const handleThemeSave = (newTheme: Theme) => {
        setThemes(prev => [...prev, newTheme]);
    };

    return (
        <>
            <Header />
            <div className="theme-container">
                <div className="theme-header">
                    <div className="theme-search-group">
                        <span role="img" aria-label="search" style={{ fontSize: 20 }}>🔍</span>
                        <input
                            type="text"
                            placeholder="搜尋主題或商品"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="theme-search-input"
                        />
                    </div>
                    <div>
                        <button className="theme-add-theme-btn" onClick={handleOpenAddModal}>
                            <MdChair size={20}/>
                            <p>新增主題</p>
                        </button>
                    </div>
                </div>

                <div className="themes">
                    {filteredThemes.map((theme) => (
                        <div
                            key={theme._id}
                            className="theme-card"
                            style={{ background: "#fff", cursor: "pointer" }}
                            onClick={() => navigate(`/product`, {
                                state: {
                                    _id: theme._id,
                                    name: theme.name,
                                    description: theme.description,
                                    products: theme.products || [],
                                    image: theme.image
                                }
                            })}
                        >
                            <img src={theme.image.url} className="theme-image" alt={theme.name} />
                            <div className="theme-name">{theme.name}</div>
                        </div>
                    ))}
                </div>

                <AddThemeModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSave={handleThemeSave}
                />
            </div>
        </>
    );
}
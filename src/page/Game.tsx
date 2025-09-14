import React, { useEffect, useState } from "react";
import "../styles/Game.css";
import type { Chapter } from "../interfaces/chapter";
import { asyncGet } from "../utils/fetch";
import { chapter_api } from "../api/api";
import { useNavigate } from "react-router-dom";
import { IoGameController } from "react-icons/io5";
import { FaSpinner } from "react-icons/fa";
import { useNotification } from "../context/NotificationContext";

export const Game: React.FC = () => {
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { showError } = useNotification();

    const navigate = useNavigate();

    useEffect(() => {
        const fetchChapters = async () => {
            try {
                setLoading(true);
                const response = await asyncGet(chapter_api.get_all_chapters, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.body) {
                    setChapters(response.body);
                } else {
                    setError('無法載入遊戲章節資料');
                    showError('無法載入遊戲章節資料');
                }
            } catch (error) {
                console.error("Failed to fetch chapters:", error);
                setError('載入資料時發生錯誤');
                showError("獲取遊戲章節失敗");
            } finally {
                setLoading(false);
            }
        }
        fetchChapters();
    }, []);

    const filteredChapters = chapters.filter((chapter) =>
        chapter.name.includes(search)
    );

    const handleOpenAddModal = () => {
        setShowModal(true);
    };

    return (
        <div className="game-container">
            <div className="game-header">
                <div className="game-search-group">
                    <span role="img" aria-label="search" style={{ fontSize: 20 }}>
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder="搜尋遊戲章節"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="game-search-input"
                    />
                </div>
                <div>
                    <button className="game-add-chapter-btn" onClick={handleOpenAddModal}>
                        <IoGameController size={20}/>
                        <p>新增遊戲章節</p>
                    </button>
                </div>
            </div>

            { error ? (
                <div className="game-error">{error}</div>    
            ) : loading ? (
                <div className="game-loading-container">
                    <div className="game-loading-spinner">
                        <FaSpinner className="game-spinner-icon" />
                        <span>載入遊戲類別中...</span>
                    </div>
                </div>
            ) : (
                <div className="game-chapter">
                    {filteredChapters.map((chapter) => (
                        <div
                            className="game-chapter-card"
                            key={chapter.name}
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/questions/${chapter.name}`)}
                        >
                            <img src={chapter.image.url} className="chapter-image" />
                            <div className="game-chapter-name">{chapter.name}</div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="game-modal-overlay">
                    <div className="game-modal-content">
                        <button className="game-modal-close" onClick={() => setShowModal(false)}>
                            ✕
                        </button>
                        <input
                            className="game-chapter-input"
                            type="text"
                            placeholder="關卡名稱"
                        />
                        <input
                            className="game-chapter-input"
                            type="text"
                            placeholder="垃圾需求量"
                        />
                        <label className="game-image-upload">
                            + 新增圖片
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                            />
                        </label>
                        <button 
                            className="game-add-chapter-btn" 
                            style={{ width: '120px', margin: '0 auto' }}
                            onClick={() => {
                                setShowModal(false);
                            }}
                        >
                            確定新增
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
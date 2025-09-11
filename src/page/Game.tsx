import React, { useEffect, useState } from "react";
import "../styles/Game.css";
import type { Chapter } from "../interfaces/chapter";
import { asyncGet } from "../utils/fetch";
import { chapter_api } from "../api/api";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { IoGameController } from "react-icons/io5";

export const Game: React.FC = () => {
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchChapters = async () => {
            try {
                const response = await asyncGet(chapter_api.get_all_chapters, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.body) {
                    setChapters(response.body);
                }
            } catch (error) {
                console.error("Failed to fetch chapters:", error);
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
        <>
            <Header />
            <div className="game-container">
                <div className="game-header">
                    <div className="game-search-group">
                        <span role="img" aria-label="search" style={{ fontSize: 20 }}>
                            🔍
                        </span>
                        <input
                            type="text"
                            placeholder="搜尋關卡"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div>
                        <button className="game-add-chapter-btn" onClick={handleOpenAddModal}>
                            <IoGameController size={20}/>
                            <p>新增遊戲章節</p>
                        </button>
                    </div>
                </div>

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
        </>
    );
};
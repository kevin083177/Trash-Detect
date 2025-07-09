import React, { useEffect, useState } from "react";
import "../styles/Game.css";
import type { Chapter } from "../interfaces/chapter";
import { asyncGet } from "../utils/fetch";
import { chapter_api } from "../api/api";
import { useNavigate } from "react-router-dom";

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

    return (
        <div className="container">
            <div className="home-header">
                <span>Hi, Username</span>
            </div>

            <div className="header">
                <div className="search-group">
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
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        新增關卡
                    </button>
                </div>
            </div>

            <div className="chapter">
                {filteredChapters.map((chapter) => (
                    <div
                        className="chapter-card"
                        key={chapter.name}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/questions/${chapter.name}`)}
                    >
                        <img src={chapter.image.url} className="chapter-image" />
                        <div className="chapter-name">{chapter.name}</div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="game-modal-content">
                        <input
                            className="chapter-input"
                            type="text"
                            placeholder="關卡名稱"
                        />
                        <input
                            className="chapter-input"
                            type="text"
                            placeholder="垃圾需求量"
                        />
                        <label className="image-upload">
                            +新增圖片
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                            />
                        </label>
                        <button className="modal-close" onClick={() => setShowModal(false)}>關閉</button>
                    </div>
                </div>
            )}
        </div>
    );
};

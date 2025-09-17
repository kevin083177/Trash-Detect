import React, { useEffect, useState, useRef, useMemo } from "react";
import type { Feedback } from "../interfaces/feedback";
import "../styles/Feedback.css";
import { feedback_api } from "../api/api";
import { asyncGet, asyncPut } from "../utils/fetch";
import { ImageModal } from "../components/feedback/ImageModal";
import { StatusCard } from "../components/home/StatusCard";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { FaClock, FaSpinner, FaCheck, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { LuReply } from "react-icons/lu";

export const FeedbackPage: React.FC = () => {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [feedbackData, setFeedbackData] = useState<Feedback[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [replyInputs, setReplyInputs] = useState<{[key: string]: string}>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const replyRefs = useRef<{[key: string]: HTMLTextAreaElement | null}>({});
    
    const { showSuccess, showError } = useNotification();
    const { username } = useAuth();

    const sortedFeedbackData = useMemo(() => {
        const statusOrder = { 'pending': 1, 'processing': 2, 'resolved': 3, 'closed': 4 };
        
        return feedbackData.sort((a, b) => {
            const statusDiff = statusOrder[a.status] - statusOrder[b.status];
            if (statusDiff !== 0) return statusDiff;
            
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [feedbackData]);

    const statusStats = useMemo(() => {
        return {
            pending: feedbackData.filter(item => item.status === 'pending').length,
            processing: feedbackData.filter(item => item.status === 'processing').length,
            resolved: feedbackData.filter(item => item.status === 'resolved').length,
            closed: feedbackData.filter(item => item.status === 'closed').length
        };
    }, [feedbackData]);

    const sortFeedback = (feedbackList: Feedback[]) => {
        const statusOrder = { 'pending': 1, 'processing': 2, 'resolved': 3, 'closed': 4 };
        
        return feedbackList.sort((a, b) => {
            const statusDiff = statusOrder[a.status] - statusOrder[b.status];
            if (statusDiff !== 0) return statusDiff;
            
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    };

    useEffect(() => {
        const fetchFeedback = async() => {
            try {
                setIsLoading(true);
                const response = await asyncGet(feedback_api.all, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response && response.body) {
                    setFeedbackData(sortFeedback(response.body));
                } else {
                    setError('無法載入回饋訊息資料');
                }
            } catch (error) {
                setError('載入資料時發生錯誤');
                showError('載入回饋訊息失敗');
            } finally {
                setIsLoading(false);
            }
        }

        fetchFeedback();
    }, [])

    const handleToggle = (id: string) => {
        setExpandedRow((prev) => (prev === id ? null : id));
    };

    const getCategoryDisplay = (category: Feedback['category']) => {
        const categoryMap = {
            'bug': '錯誤回報',
            'detect': '檢測問題',
            'improvement': '改善建議',
            'other': '其他'
        };
        return categoryMap[category];
    };

    const getStatusColor = (status: Feedback['status']) => {
        const colorMap = {
            'pending': '#007bff',
            'processing': '#fd7e14',
            'resolved': '#28a745',
            'closed': '#6c757d'
        };
        return colorMap[status];
    };

    const getButtonStates = (status: Feedback['status']) => {
        switch (status) {
            case 'pending':
                return {
                    canReply: true,
                    canComplete: false,
                    canCancel: true
                };
            case 'processing':
                return {
                    canReply: false,
                    canComplete: true,
                    canCancel: true
                };
            case 'resolved':
                return {
                    canReply: false,
                    canComplete: false,
                    canCancel: true
                }
            case 'closed':
                return {
                    canReply: false,
                    canComplete: false,
                    canCancel: false
                };
        }
    };

    const handleImageClick = (imageUrl: string) => {
        setSelectedImage(imageUrl);
    };

    const closeImageModal = () => {
        setSelectedImage(null);
    };

    const handleReplyChange = (feedbackId: string, value: string) => {
        setReplyInputs(prev => ({
            ...prev,
            [feedbackId]: value
        }));
    };

    const handleReplyClick = (feedbackId: string) => {
        setExpandedRow(feedbackId);
        setTimeout(() => {
            const replyElement = replyRefs.current[feedbackId];
            if (replyElement) {
                replyElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                replyElement.focus();
            }
        }, 600);
    };

    const handleCompleteClick = async (feedbackId: string) => {
        if (window.confirm('確定要將這個問題標記為已完成嗎？')) {
            try {
                const response = await asyncPut(feedback_api.update_status, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    body: {
                        feedback_id: feedbackId,
                        status: 'resolved'
                    }
                });

                if (response.status === 200) {
                    setFeedbackData((prev) => {
                        const updated = prev.map((f) =>
                            f._id === feedbackId 
                                ? { ...f, status: 'resolved' as Feedback['status'] }
                                : f
                        );
                        return sortFeedback(updated);
                    });
                } else {
                    window.alert("更新狀態失敗");
                }
            } catch (error) {
                console.error("Failed to update feedback status:", error);
                window.alert("更新狀態失敗");
            }
        }
    };

    const handleCancelClick = async (feedbackId: string) => {
        if (window.confirm('確定要關閉這個問題嗎？關閉後將無法再進行操作。')) {
            try {
                const response = await asyncPut(feedback_api.update_status, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    body: {
                        feedback_id: feedbackId,
                        status: 'closed'
                    }
                });

                if (response.status === 200) {
                    setFeedbackData((prev) => {
                        const updated = prev.map((f) =>
                            f._id === feedbackId 
                                ? { ...f, status: 'closed' as Feedback['status'] }
                                : f
                        );
                        return sortFeedback(updated);
                    });
                } else {
                    window.alert("關閉問題失敗");
                }
            } catch (error) {
                console.error("Failed to close feedback:", error);
                window.alert("關閉問題失敗");
            }
        }
    };

    const handleReplySubmit = async (feedbackId: string) => {
        const replyContent = replyInputs[feedbackId];
        if (!replyContent?.trim()) return;

        try {
            const response = await asyncPut(feedback_api.reply, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: {
                    feedback_id: feedbackId,
                    reply_content: replyContent.trim()
                }
            })
            
            if (response.status === 200) {
                setFeedbackData((prev) => {
                    const updated = prev.map((f) =>
                        f._id === feedbackId 
                            ? { 
                                ...f,
                                reply_content: replyContent,
                                admin_name: username as string,
                                reply_at: new Date().toISOString(),
                                status: 'processing' as Feedback['status']
                            } 
                            : f
                    );
                    return sortFeedback(updated);
                });

                setReplyInputs(prev => ({
                    ...prev,
                    [feedbackId]: ''
                }));
                showSuccess('成功新增回覆訊息');
            } else {
                showError('回覆訊息失敗');
            }
        } catch (error) {
            console.error("Failed to submit reply:", error);
            showError('回覆訊息失敗');
        }
    };

    return (
        <>
            <div className="feedback-container">
                <div className="feedback-status-cards">
                    <StatusCard
                        title="待處理訊息"
                        value={statusStats.pending}
                        icon={<FaClock size={18}/>}
                        color="#007bff"
                        isLoading={isLoading}
                    />
                    <StatusCard
                        title="已回覆訊息"
                        value={statusStats.processing}
                        icon={<LuReply size={18} />}
                        color="#fd7e14"
                        isLoading={isLoading}
                    />
                    <StatusCard
                        title="已解決訊息"
                        value={statusStats.resolved}
                        icon={<FaCheck size={18} />}
                        color="#28a745"
                        isLoading={isLoading}
                    />
                    <StatusCard
                        title="已關閉訊息"
                        value={statusStats.closed}
                        icon={<FaTimes size={18} />}
                        color="#6c757d"
                        isLoading={isLoading}
                    />
                </div>

                <div className="feedback-table-wrapper">
                    { error ? (
                        <div className="feedback-error">{error}</div>
                    ) : isLoading ? (
                        <div className="feedback-loading-container">
                            <div className="feedback-loading-spinner">
                                <FaSpinner className="spinner-icon" />
                                <span>載入訊息資料中...</span>
                            </div>
                        </div>
                    ) : (
                        <table className="feedback-table">
                            <thead>
                                <tr>
                                    <th style={{width: '8px'}}></th>
                                    <th>類別</th>
                                    <th>使用者</th>
                                    <th>主旨</th>
                                    <th>建立時間</th>
                                    <th>操作區</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedFeedbackData.map((item) => (
                                    <React.Fragment key={item._id}>
                                        <tr 
                                            className={`feedback-table-row ${expandedRow === item._id ? 'expanded' : ''}`}
                                            onClick={() => handleToggle(item._id)}
                                        >
                                            <td 
                                                className="feedback-status-indicator" 
                                                style={{
                                                    borderLeft: `4px solid ${getStatusColor(item.status)}`,
                                                }}
                                            >
                                            </td>
                                            <td>{getCategoryDisplay(item.category)}</td>
                                            <td>{item.user_info.username}</td>
                                            <td className="feedback-subject-cell" title={item.title}>
                                                {item.title}
                                            </td>
                                            <td>{new Date(item.created_at).toLocaleDateString('zh-TW')}</td>
                                            <td className="feedback-action-buttons">
                                                {(() => {
                                                    const buttonStates = getButtonStates(item.status);
                                                    return (
                                                        <>
                                                            <button 
                                                                className={`feedback-action-btn feedback-reply-btn ${!buttonStates.canReply ? 'disabled' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (buttonStates.canReply) {
                                                                        handleReplyClick(item._id);
                                                                    }
                                                                }}
                                                                disabled={!buttonStates.canReply}
                                                            >
                                                                回覆
                                                            </button>
                                                            <button 
                                                                className={`feedback-action-btn feedback-complete-btn ${!buttonStates.canComplete ? 'disabled' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (buttonStates.canComplete) {
                                                                        handleCompleteClick(item._id);
                                                                    }
                                                                }}
                                                                disabled={!buttonStates.canComplete}
                                                            >
                                                                完成
                                                            </button>
                                                            <button 
                                                                className={`feedback-action-btn feedback-delete-btn ${!buttonStates.canCancel ? 'disabled' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (buttonStates.canCancel) {
                                                                        handleCancelClick(item._id);
                                                                    }
                                                                }}
                                                                disabled={!buttonStates.canCancel}
                                                            >
                                                                取消
                                                            </button>
                                                        </>
                                                    );
                                                })()}
                                            </td>
                                            <td className="feedback-expand-column">
                                                <span className="feedback-expand-arrow">
                                                    {expandedRow === item._id ? <IoIosArrowUp /> : <IoIosArrowDown/>}
                                                </span>
                                            </td>
                                        </tr>
                                        {expandedRow === item._id && (
                                            <tr className="feedback-expanded-row">
                                                <td colSpan={7}>
                                                    <div className={`feedback-detail ${expandedRow === item._id ? 'expanded' : ''}`}>
                                                        <div className="feedback-detail-content">
                                                            <div className="feedback-detail-row">
                                                                <div className="feedback-detail-info-group">
                                                                    <h4>使用者資訊</h4>
                                                                    <div><strong>ID:</strong>{item.user_id}</div>
                                                                    <div><strong>名稱:</strong>{item.user_info.username}</div>
                                                                    <div><strong>Email:</strong>{item.user_info.email}</div>
                                                                </div>
                                                                <div className="feedback-detail-info-group">
                                                                    <h4>問題資訊</h4>
                                                                    <div><strong>ID:</strong> {item._id}</div>
                                                                    <div><strong>建立時間:</strong> {new Date(item.created_at).toLocaleString('zh-TW')}</div>
                                                                    <div><strong>類別:</strong> {getCategoryDisplay(item.category)}</div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="feedback-detail-row">
                                                                <div className="feedback-detail-info-group">
                                                                    <h4>主旨</h4>
                                                                    <div>{item.title}</div>
                                                                </div>
                                                                
                                                                <div className="feedback-detail-info-group">
                                                                    <h4>內容</h4>
                                                                    <div>{item.content}</div>
                                                                </div>
                                                            </div>
                                                            {item.images && item.images.length > 0 && (
                                                                <div className="feedback-content-section">
                                                                    <h4>附件圖片</h4>
                                                                    <div className="feedback-images">
                                                                        {item.images.map((image, index) => (
                                                                            <div key={index} className="feedback-image-container">
                                                                                <img 
                                                                                    src={image.url} 
                                                                                    alt={`feedback-image-${index}`}
                                                                                    className="feedback-image-thumbnail"
                                                                                    onClick={() => handleImageClick(image.url)}
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            

                                                            <div className="feedback-reply-management">
                                                                <div className="feedback-reply-section">
                                                                    {item.reply_content ? (
                                                                        <div>
                                                                            <h4>管理員({item.admin_name})回覆</h4>
                                                                            <div className="admin-reply-display">
                                                                                {item.reply_content}
                                                                                {item.reply_at && (
                                                                                    <span style={{ 
                                                                                        fontSize: '12px', 
                                                                                        color: '#666', 
                                                                                        marginLeft: '6px',
                                                                                    }}>
                                                                                        ({new Date(item.reply_at).toLocaleString('zh-TW')})
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div>
                                                                            <h4>新增回覆</h4>
                                                                            <textarea
                                                                                ref={el => { replyRefs.current[item._id] = el; }}
                                                                                className="feedback-reply-textarea"
                                                                                placeholder="輸入回覆內容..."
                                                                                value={replyInputs[item._id]}
                                                                                onChange={(e) => handleReplyChange(item._id, e.target.value)}
                                                                                rows={2}
                                                                            />
                                                                            <button
                                                                                className="feedback-reply-submit-btn"
                                                                                onClick={() => handleReplySubmit(item._id)}
                                                                                disabled={!replyInputs[item._id]?.trim()}
                                                                            >
                                                                                送出回覆
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            
            <ImageModal 
                imageUrl={selectedImage} 
                onClose={closeImageModal} 
            />
        </>
    );
};
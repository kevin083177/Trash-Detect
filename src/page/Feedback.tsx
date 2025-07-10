import React, { useState } from "react";
import type { Feedback } from "../interfaces/feedback";
import "../styles/Feedback.css";
import { Header } from "../components/Header";

export const FeedbackPage: React.FC = () => {
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const data: Feedback[] = [
        {
            id: 1,
            user: "cww",
            category: "技術問題",
            subject: "技術問題",
            admin: "hck",
            status: "已完成",
            detail: "這是使用者 cww 的詳細反饋內容，例如出現錯誤訊息或操作問題。",
        },
        {
            id: 2,
            user: "ccx",
            category: "辨識錯誤",
            subject: "辨識錯誤",
            admin: "hck",
            status: "處理中",
            detail: "這是關於辨識錯誤的回報，圖片誤判為一般垃圾。",
        },
        {
            id: 3,
            user: "pyq",
            category: "進階答案錯誤",
            subject: "進階答案錯誤",
            admin: "",
            status: "未處理",
            detail: "題目說明與實際顯示內容不符，懇請更正。",
        },
    ];

    const handleToggle = (id: number) => {
        setExpandedRow((prev) => (prev === id ? null : id));
    };
    const [feedbackData, setFeedbackData] = useState<Feedback[]>(data);

    return (
        <>
            <Header />
            <div className="feedback-container">
                <div className="feedback-table-wrapper">
                    <table className="feedback-table">
                        <thead>
                            <tr>
                                <th>編號</th>
                                <th>使用者帳號</th>
                                <th>問題類別</th>
                                <th>問題主旨</th>
                                <th>管理者帳號</th>
                                <th>處理進度</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feedbackData.map((item) => (
                                <React.Fragment key={item.id}>
                                    <tr onClick={() => handleToggle(item.id)} className="clickable-row">
                                        <td>{item.id}</td>
                                        <td>{item.user}</td>
                                        <td>{item.category}</td>
                                        <td>{item.subject}</td>
                                        <td>{item.admin || "-"}</td>
                                        <td>
                                            <select
                                                value={item.status}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => {
                                                    const newStatus = e.target.value;
                                                    setFeedbackData((prev) =>
                                                        prev.map((f) =>
                                                            f.id === item.id ? { ...f, status: newStatus } : f
                                                        )
                                                    );
                                                }}
                                            >
                                                <option value="未處理">未處理</option>
                                                <option value="處理中">處理中</option>
                                                <option value="已完成">已完成</option>
                                            </select>
                                        </td>
                                    </tr>
                                    {expandedRow === item.id && (
                                        <tr className="expanded-row">
                                            <td colSpan={6}>
                                                <div className="feedback-detail">內容:{item.detail}</div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

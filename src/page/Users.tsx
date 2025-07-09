import React from "react";
import "../styles/Users.css";

export const Users: React.FC = () => {    
        const users = [
        { id: "001", name: "xi bua", daily: 10, total: 110, range: "3-1" },
        { id: "002", name: "pan qian", daily: 15, total: 95, range: "2-5" },
    ];

    return (
        <div className="users-container">
            <div className="users-header">
                <span>Hi, Username</span>
            </div>
            <div className="users-table-wrapper">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>使用者帳號</th>
                            <th>每日掃描次數</th>
                            <th>總掃描量</th>
                            <th>遊戲進度</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.name}</td>
                                <td>{user.daily}</td>
                                <td>{user.total}</td>
                                <td>{user.range}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
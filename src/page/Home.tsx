import React from "react";
import "../styles/Home.css";
import { Header } from "../components/Header";
import {
    PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis
} from "recharts";
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from 'recharts';

// 範例資料
const data = [
    { name: "塑膠", value: 300 },
    { name: "寶特瓶", value: 500 },
    { name: "紙容器", value: 200 },
    { name: "鐵鋁罐", value: 150 },
    { name: "紙類", value: 400 },
];

const chartData = [
    { date: '7/01', scans: 30, logins: 5 },
    { date: '7/02', scans: 50, logins: 8 },
    { date: '7/03', scans: 40, logins: 6 },
    { date: '7/04', scans: 60, logins: 12 },
    { date: '7/05', scans: 80, logins: 10 },
];

const carbonData = [
    {
        name: '總碳排',
        value: 68,
        fill: '#5F8D4E',
    },
];

const COLORS = ["#FFA07A", "#87CEEB", "#90EE90", "#FFD700", "#BA55D3"];

export const Home: React.FC = () => {
    return (
        <div className="home-container">
            <Header/>
            
            <div className="home-main">
                <div className="home-top">
                    <div className="home-chart-section">
                        <div className="home-chart-title">每日掃描成長量 / 每日登入量</div>
                        <div className="home-chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData}>
                                    <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="scans" barSize={20} fill="#90EE90" />
                                    <Line type="monotone" dataKey="logins" stroke="#8884d8" strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="home-side">
                        <div className="carbon-note">to be continued...</div>
                    </div>
                </div>
            </div>
            
            <div className="home-bottom">
                <div className="home-bottom-title">回收統計圖</div>
                <div className="home-circles">
                    {data.map((entry, index) => (
                        <div className="home-circle" key={index}>
                            <PieChart width={160} height={160}>
                                <Pie
                                    data={[{ ...entry }]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    dataKey="value"
                                >
                                    <Cell fill={COLORS[index % COLORS.length]} />
                                </Pie>
                            </PieChart>
                            <div className="circle-label">{entry.name}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
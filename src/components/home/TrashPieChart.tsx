import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import "./styles/TrashPieChart.css";
import type { Trash } from "../../interfaces/Trash";

interface TrashData {
    name: string;
    value: number;
}

interface TrashPieChartProps {
    isLoading: boolean;
    totals: Trash | null;
}

const COLORS = ["#FFA07A", "#87CEEB", "#90EE90", "#FFD700", "#BA55D3"];

export const TrashPieChart: React.FC<TrashPieChartProps> = ({ isLoading, totals }) => {
    const [trashData, setTrashData] = useState<TrashData[]>([]);

    useEffect(() => {
        if (totals) {
            const formattedData: TrashData[] = [
                { name: "寶特瓶", value: totals.bottles },
                { name: "鐵鋁罐", value: totals.cans },
                { name: "紙容器", value: totals.containers },
                { name: "紙類", value: totals.paper },
                { name: "塑膠", value: totals.plastic },
            ];

            const filteredData = formattedData.filter(item => item.value > 0);
            setTrashData(filteredData);
        }
    }, [totals]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="recycling-tooltip">
                    <p className="tooltip-label">{data.name}</p>
                    <p className="tooltip-value">數量: {data.value}</p>
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="recycling-chart-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>載入中...</p>
                </div>
            </div>
        );
    }

    if (!totals || trashData.length === 0) {
        return (
            <div className="recycling-chart-container">
                <div className="no-data-container">
                    <p>目前沒有回收資料</p>
                </div>
            </div>
        );
    }

    return (
        <div className="recycling-chart-container">
            <div className="recycling-pie-chart">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={trashData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {trashData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
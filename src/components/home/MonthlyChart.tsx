import React, { useMemo } from "react";
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Daily } from "../../interfaces/daily";
import './styles/MonthlyChart.css';

interface MonthlyChartProps {
    dailyTotals: Daily[];
    isLoading?: boolean;
    selectedMonth: string;
    onMonthChange: (month: string) => void;
}

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ 
    dailyTotals, 
    isLoading = false,
    selectedMonth,
    onMonthChange
}) => {
    const groupedByMonth = useMemo(() => {
        const groups: { [key: string]: Daily[] } = {};
        
        dailyTotals.forEach(item => {
            const monthKey = item.date.substring(0, 7);
            if (!groups[monthKey]) {
                groups[monthKey] = [];
            }
            groups[monthKey].push(item);
        });

        Object.keys(groups).forEach(month => {
            groups[month].sort((a, b) => a.date.localeCompare(b.date));
        });

        return groups;
    }, [dailyTotals]);

    const availableMonths = useMemo(() => {
        return Object.keys(groupedByMonth).sort();
    }, [groupedByMonth]);

    const currentMonthData = useMemo(() => {
        const data = groupedByMonth[selectedMonth] || [];
        return data.map(item => ({
            date: item.date.slice(8),
            trash: item.total,
            logins: item.active_users
        }));
    }, [groupedByMonth, selectedMonth]);

    const currentMonthIndex = availableMonths.indexOf(selectedMonth);
    const hasPrevMonth = currentMonthIndex > 0;
    const hasNextMonth = currentMonthIndex < availableMonths.length - 1;

    const goToPrevMonth = () => {
        if (hasPrevMonth) {
            onMonthChange(availableMonths[currentMonthIndex - 1]);
        }
    };

    const goToNextMonth = () => {
        if (hasNextMonth) {
            onMonthChange(availableMonths[currentMonthIndex + 1]);
        }
    };

    const formatMonthDisplay = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        return `${year}年${month}月`;
    };

    if (isLoading) {
        return (
            <div className="monthly-chart-section">
                <div className="monthly-chart-title">每月掃描成長量 / 每月登入量</div>
                <div className="monthly-chart-loading-container">
                    <div className="monthly-chart-loading-spinner"></div>
                    <p>載入中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="monthly-chart-section">
            <div className="monthly-chart-header">
                <div className="monthly-chart-title">每月掃描成長量 / 每月登入量</div>
                <div className="monthly-chart-month-navigation">
                    <button 
                        className={`monthly-chart-nav-button ${!hasPrevMonth ? 'disabled' : ''}`}
                        onClick={goToPrevMonth}
                        disabled={!hasPrevMonth}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="monthly-chart-current-month">
                        {formatMonthDisplay(selectedMonth)}
                    </span>
                    <button 
                        className={`monthly-chart-nav-button ${!hasNextMonth ? 'disabled' : ''}`}
                        onClick={goToNextMonth}
                        disabled={!hasNextMonth}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            
            <div className="monthly-chart">
                {currentMonthData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={currentMonthData}>
                            <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="trash" barSize={20} fill="#90EE90" />
                            <Line type="monotone" dataKey="logins" stroke="#8884d8" strokeWidth={2} />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="monthly-chart-no-data-container">
                        <p>該月份暫無數據</p>
                    </div>
                )}
            </div>
        </div>
    );
};
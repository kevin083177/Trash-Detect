import React, { useEffect, useState, useMemo } from "react";
import "../styles/Home.css";
import "../components/home/styles/Monitor.css";
import "../components/home/styles/StatusCard.css";
import { Header } from "../components/Header";
import { TrashPieChart } from "../components/home/TrashPieChart";
import { MonthlyChart } from "../components/home/MonthlyChart";
import { StatusCard } from "../components/home/StatusCard";
import { asyncGet } from "../utils/fetch";
import { admin_api } from "../api/api";
import { SystemInfoPanel } from "../components/home/SystemInfoPanel";
import { Monitor } from "../components/home/Monitor";
import type { Daily } from "../interfaces/daily";
import { FiUserPlus } from "react-icons/fi";
import { LuUsers } from "react-icons/lu";
import { RiRecycleLine } from "react-icons/ri";
import { HiOutlineStatusOnline } from "react-icons/hi";

export const Home: React.FC = () => {
    const [chartLoading, setChartLoading] = useState<boolean>(false);
    const [systemLoading, setSystemLoading] = useState<boolean>(false);
    const [dailyTotals, setDailyTotals] = useState<Daily[]>([]);
    const [systemInfo, setSystemInfo] = useState<any>(null);
    const [isMonitoringActive, setIsMonitoringActive] = useState<boolean>(false);

    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(
        `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    );

    const todayData = useMemo(() => {
        if (!dailyTotals || dailyTotals.length === 0) return null;

        const today = new Date().toISOString().split('T')[0];
        const todayStats = dailyTotals.find(item => item.date === today);

        return todayStats;
    }, [dailyTotals]);

    const yesterdayData = useMemo(() => {
        if (!dailyTotals || dailyTotals.length === 0) return null;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        return dailyTotals.find(item => item.date === yesterdayString) || null;
    }, [dailyTotals]);

    const calculateTrend = (todayValue: number, yesterdayValue: number) => {
        if (!yesterdayValue || yesterdayValue === 0) return null;
        const change = ((todayValue - yesterdayValue) / yesterdayValue) * 100;
        return {
            value: Math.round(Math.abs(change)),
            isPositive: change >= 0
        };
    };

    const monthlyTrashTotals = useMemo(() => {
        if (!dailyTotals || dailyTotals.length === 0) return null;

        const monthlyData = dailyTotals.filter(item => 
            item.date.substring(0, 7) === selectedMonth
        );

        if (monthlyData.length === 0) return null;

        const totals = monthlyData.reduce((acc, item) => {
            return {
                bottles: (acc.bottles) + (item.bottles),
                cans: (acc.cans) + (item.cans),
                containers: (acc.containers) + (item.containers),
                paper: (acc.paper) + (item.paper),
                plastic: (acc.plastic) + (item.plastic),
            };
        }, {
            bottles: 0,
            cans: 0,
            containers: 0,
            paper: 0,
            plastic: 0,
        });

        return totals;
    }, [dailyTotals, selectedMonth]);

    useEffect(() => {
        const fetchTrashData = async() => {
            try {
                setChartLoading(true);
                const response = await asyncGet(admin_api.get_all_trash, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });
                if (response && response.body) {
                    setDailyTotals(response.body.daily_stats);
                }

                console.log(response);
            } catch (error) {
                console.log(error);
            } finally {
                setChartLoading(false);
            }
        }

        const fetchSystemInfo = async() => {
            try{
                setSystemLoading(true);
                const response = await asyncGet(admin_api.get_system_info, {
                    headers: { 
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response && response.body) {
                    setSystemInfo(response.body);
                }
            } catch (error) {
                console.log("Failed to fetch system info");
            } finally {
                setSystemLoading(false);
            }
        }

        fetchTrashData();
        fetchSystemInfo();
    }, [])

    return (
        <div className="home-container">
            <Header/>
            <div className="home-main">
                <div className="dashboard-status-section">
                    <div className="dashboard-status-cards">
                        <StatusCard
                            title="今日新使用者"
                            value={todayData?.new_registered || 0}
                            icon={<FiUserPlus size={28} />}
                            color="#FF0060"
                            subtitle="新註冊使用者數"
                            trend={todayData && yesterdayData ? 
                                calculateTrend(todayData.new_registered || 0, yesterdayData.new_registered) || undefined : 
                                undefined
                            }
                            isLoading={chartLoading}
                        />
                        
                        <StatusCard
                            title="今日活躍使用者"
                            value={todayData?.active_users || 0}
                            icon={<LuUsers size={28} />}
                            color="#f8992c"
                            subtitle="活躍使用者數"
                            trend={todayData && yesterdayData ? 
                                calculateTrend(todayData.active_users || 0, yesterdayData.active_users) || undefined : 
                                undefined
                            }
                            isLoading={chartLoading}
                        />
                        
                        <StatusCard
                            title="今日回收總量"
                            value={todayData?.total || 0}
                            icon={<RiRecycleLine size={28} />}
                            color="#00df59"
                            subtitle="總回收物品數"
                            trend={todayData && yesterdayData ? 
                                calculateTrend(todayData.total || 0, yesterdayData.total) || undefined : 
                                undefined
                            }
                            isLoading={chartLoading}
                        />
                        
                        <StatusCard
                            title="系統狀態"
                            value={systemInfo ? "正常" : "檢查中"}
                            icon={<HiOutlineStatusOnline size={28} />}
                            color="#0079FF"
                            subtitle={systemInfo ? "系統運行正常" : "系統狀態檢查中"}
                            isLoading={systemLoading}
                        />
                    </div>
                </div>

                <div className="home-top-row">
                    <MonthlyChart
                        dailyTotals={dailyTotals}
                        isLoading={chartLoading}
                        selectedMonth={selectedMonth}
                        onMonthChange={setSelectedMonth}
                    />
                    <div className="home-pie-section">
                        <div className="home-chart-title">回收統計圖</div>
                        <TrashPieChart
                            isLoading={chartLoading} 
                            totals={monthlyTrashTotals} 
                            selectedMonth={selectedMonth}
                        />
                    </div>
                </div>
                
                <div className="home-bottom-row">
                    <div className="home-monitor-section">
                        <Monitor
                            isActive={isMonitoringActive}
                            onToggle={setIsMonitoringActive}
                        />
                    </div>
                    <div className="home-system-section">
                        <SystemInfoPanel isLoading={systemLoading} systemInfo={systemInfo} />
                    </div>
                </div>
            </div>
        </div>
    );
};
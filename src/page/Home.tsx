import React, { useEffect, useState } from "react";
import "../styles/Home.css";
import "../components/home/styles/Monitor.css";
import { Header } from "../components/Header";
import { TrashPieChart } from "../components/home/TrashPieChart";
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { asyncGet } from "../utils/fetch";
import { admin_api } from "../api/api";
import type { Trash } from "../interfaces/Trash";
import { SystemInfoPanel } from "../components/home/SystemInfoPanel";
import { Monitor } from "../components/home/Monitor";

export const Home: React.FC = () => {
    const [chartLoading, setChartLoading] = useState<boolean>(false);
    const [systemLoading, setSystemLoading] = useState<boolean>(false);
    const [dailyTotals, setDailyTotals] = useState<{ date: string; trash: number; logins: number }[]>([]);
    const [trashTotals, setTrashTotals] = useState<Trash | null>(null);
    const [systemInfo, setSystemInfo] = useState<any>(null);
    const [isMonitoringActive, setIsMonitoringActive] = useState<boolean>(false);

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
                    setTrashTotals(response.body.summary.totals);

                    const convertedData = response.body.daily_stats.map((item: any) => ({
                        date: item.date.slice(5),
                        trash: item.total,
                        logins: 0
                    }))

                    setDailyTotals(convertedData);
                }
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
                <div className="home-top-row">
                    <div className="home-chart-section">
                        <div className="home-chart-title">每日掃描成長量 / 每日登入量</div>
                        <div className="home-chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={dailyTotals}>
                                    <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="trash" barSize={20} fill="#90EE90" />
                                    <Line type="monotone" dataKey="logins" stroke="#8884d8" strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="home-pie-section">
                        <div className="home-chart-title">回收統計圖</div>
                        <TrashPieChart isLoading={chartLoading} totals={trashTotals} />
                    </div>
                </div>
                
                <div className="home-bottom-row">
                    <div className="home-system-section">
                        <div className="home-chart-title">系統資訊</div>
                        <SystemInfoPanel isLoading={systemLoading} systemInfo={systemInfo} />
                    </div>
                    <div className="home-monitor-section">
                        <Monitor
                            isActive={isMonitoringActive}
                            onToggle={setIsMonitoringActive}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
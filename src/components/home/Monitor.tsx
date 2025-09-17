import React, { useEffect, useState } from 'react';
import { socketService } from '../../utils/socket';
import { GaugeChart } from './GaugeChart';
import { BsCpu, BsMemory, BsGpuCard } from "react-icons/bs";
import { CiHardDrive } from "react-icons/ci";
import './styles/Monitor.css';
import type { SystemStats } from '../../interfaces/system';

interface MonitorProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

interface ConnectionStatus {
  connected: boolean;
  monitoring: boolean;
  error: string | null;
}

export const Monitor: React.FC<MonitorProps> = ({ onToggle }) => {
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
        connected: false,
        monitoring: false,
        error: null
    });

    const initializeSocket = async() => {
        try {
            setConnectionStatus(prev => ({ ...prev, error: null}));

            await socketService.connect();
            setConnectionStatus(prev => ({ ...prev, connected: true}));

            socketService.onSystemStats((data: SystemStats) => {
                setSystemStats(data);
            });

            socketService.onMonitoringStop(() => {
                setConnectionStatus(prev => ({ ...prev, monitoring: false}));
                onToggle(false);
            });
        } catch (error) {
            console.log("Failed to connect socket: ", error);
            setConnectionStatus(prev => ({
                ...prev,
                connected: false,
                error: (error as Error).message
            }));
        }
    };

    const startMonitoring = async() => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await socketService.startMonitoring(token);
            setConnectionStatus(prev => ({ ...prev, monitoring: true, error: null}));
            onToggle(true);
        } catch (error) {
            console.log("Failed to start monitoring: ", error);
            setConnectionStatus(prev => ({
                ...prev,
                connected: false,
                error: (error as Error).message
            }));
            onToggle(false);
        }
    };

    useEffect(() => {
        const initAndStart = async () => {
            await initializeSocket();
            setTimeout(async () => {
                if (connectionStatus.connected) {
                    await startMonitoring();
                }
            }, 1000);
        };

        initAndStart();

        return () => {
            socketService.disconnect();
        };
    }, []);

    useEffect(() => {
        if (connectionStatus.connected && !connectionStatus.monitoring) {
            setTimeout(() => {
                startMonitoring();
            }, 500);
        }
    }, [connectionStatus.connected]);

    const getCPUInfo = () => {
        if (!systemStats?.cpu) {
            return {
                usage: 0,
                details: 'CPU 資訊不可用',
                extraInfo: undefined
            };
        }

        return {
            usage: systemStats.cpu.usage || 0,
            details: `${(systemStats.cpu.frequency / 1000).toFixed(1)} GHz`,
        };
    };

    const getMemoryInfo = () => {
        if (!systemStats?.memory) {
            return {
                usage: 0,
                details: '記憶體資訊不可用'
            };
        }

        return {
            usage: systemStats.memory.usage || 0,
            details: `${systemStats.memory.used || 'N/A'} / ${systemStats.memory.total || 'N/A'}`
        };
    };

    const getDiskInfo = () => {
        if (!systemStats?.disk) {
            return {
                usage: 0,
                details: '硬碟資訊不可用'
            };
        }

        return {
            usage: systemStats.disk.usage || 0,
            details: `${systemStats.disk.used || 'N/A'} / ${systemStats.disk.total || 'N/A'}`
        };
    };

    const getGPUInfo = () => {
        if (!systemStats?.gpu?.available || !systemStats.gpu.gpus?.[0]) {
            return { 
                usage: 0, 
                details: 'GPU 不可用',
                extraInfo: undefined
            };
        }
        
        const gpu = systemStats.gpu.gpus[0];
        return {
            usage: gpu.usage || 0,
            details: `${gpu.memory_used} / ${gpu.memory_total}`,
            extraInfo: {
                gpu: {
                    temperature: gpu.temperature
                }
            }
        };
    };

    const cpuInfo = getCPUInfo();
    const memoryInfo = getMemoryInfo();
    const diskInfo = getDiskInfo();
    const gpuInfo = getGPUInfo();

    return (
        <div className="realtime-monitor">
            <div className="monitor-header">
                <h3 className="monitor-title">即時監控</h3>
                <div className="monitor-controls">
                    <div className="connection-status">
                        <span className={`status-indicator ${connectionStatus.connected ? 'connected' : 'disconnected'}`}></span>
                        <span className="status-text">
                            {connectionStatus.connected ? '已連接' : '未連接'}
                        </span>
                    </div>
                </div>
            </div>

            {connectionStatus.error && (
                <div className="monitor-error">
                    <span className="error-text">{connectionStatus.error}</span>
                    <button className="retry-btn" onClick={initializeSocket}>
                        重試連接
                    </button>
                </div>
            )}

            {systemStats && connectionStatus.monitoring ? (
                <div className="monitor-gauges">
                    <GaugeChart
                        title="CPU"
                        icon={<BsCpu />}
                        percentage={cpuInfo.usage}
                        details={cpuInfo.details}
                        color="#4CAF50"
                    />
                    
                    <GaugeChart
                        title="記憶體"
                        icon={<BsMemory />}
                        percentage={memoryInfo.usage}
                        details={memoryInfo.details}
                        color="#2196F3"
                    />
                    
                    <GaugeChart
                        title="磁碟"
                        icon={<CiHardDrive />}
                        percentage={diskInfo.usage}
                        details={diskInfo.details}
                        color="#9C27B0"
                    />
                    
                    <GaugeChart
                        title="GPU"
                        icon={<BsGpuCard />}
                        percentage={gpuInfo.usage}
                        details={gpuInfo.details}
                        color="#FF9800"
                    />
                </div>
            ) : (
                <div className="monitor-loading">
                    <div className="loading-spinner"></div>
                    <span>正在獲取系統數據...</span>
                </div>
            )}
        </div>
    );
};
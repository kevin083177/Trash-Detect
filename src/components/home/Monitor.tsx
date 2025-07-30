
import React, { useEffect, useState } from 'react';
import { socketService } from '../../utils/socket';
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

export const Monitor: React.FC<MonitorProps> = ({ isActive, onToggle }) => {
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
        connected: false,
        monitoring: false,
        error: null
    });

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

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
            console.log("FAiled to start monitoring: ", error);
            setConnectionStatus(prev => ({
                ...prev,
                connected: false,
                error: (error as Error).message
            }));
            onToggle(false);
        }
    }

    const stopMonitoring = () => {
        socketService.stopMonitoring();
        setConnectionStatus(prev => ({ ...prev, monitoring: false }));
        setSystemStats(null);
        onToggle(false);
    };

     const toggleMonitoring = async () => {
        if (!connectionStatus.connected) {
        await initializeSocket();
        return;
        }

        if (connectionStatus.monitoring) {
        stopMonitoring();
        } else {
        await startMonitoring();
        }
    };

    useEffect(() => {
        initializeSocket();

        return () => {
            socketService.disconnect();
        };
    }, []);

    useEffect(() => {
        if (isActive && connectionStatus.connected && !connectionStatus.monitoring) {
            startMonitoring();
        } else if (!isActive && connectionStatus.monitoring) {
            stopMonitoring();
        }
    }, [isActive]);

    return (
        <div className="realtime-monitor">
            <div className="monitor-header">
                <h3 className="monitor-title">實時系統監控</h3>
                <div className="monitor-controls">
                <div className="connection-status">
                    <span className={`status-indicator ${connectionStatus.connected ? 'connected' : 'disconnected'}`}></span>
                    <span className="status-text">
                    {connectionStatus.connected ? '已連接' : '未連接'}
                    </span>
                </div>
                <button 
                    className={`monitor-toggle-btn ${connectionStatus.monitoring ? 'active' : ''}`}
                    onClick={toggleMonitoring}
                    disabled={!connectionStatus.connected}
                >
                    {connectionStatus.monitoring ? '停止監控' : '開始監控'}
                </button>
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
            <div className="monitor-stats">
                {/* CPU 使用率 */}
                <div className="stat-card">
                    <div className="stat-header">
                    <span className="stat-icon">🖥️</span>
                    <span className="stat-title">CPU</span>
                    </div>
                    <div className="stat-content">
                    <div className="stat-main">
                        <span className="stat-value">{systemStats.cpu.usage}%</span>
                        <div className="progress-bar">
                        <div 
                            className="progress-fill cpu"
                            style={{ width: `${systemStats.cpu.usage}%` }}
                        ></div>
                        </div>
                    </div>
                    <div className="stat-details">
                        <span>核心數: {systemStats.cpu.count}</span>
                        {systemStats.cpu.frequecy && (
                        <span>頻率: {systemStats.cpu.frequecy} MHz</span>
                        )}
                    </div>
                    </div>
                </div>

                {/* 記憶體使用率 */}
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-icon">💾</span>
                        <span className="stat-title">記憶體</span>
                    </div>
                    <div className="stat-content">
                        <div className="stat-main">
                            <span className="stat-value">{systemStats.memory.usage}%</span>
                            <div className="progress-bar">
                            <div 
                                className="progress-fill memory"
                                style={{ width: `${systemStats.memory.usage}%` }}
                            ></div>
                            </div>
                        </div>
                    <div className="stat-details">
                        <span>已用: {systemStats.memory.used}</span>
                        <span>總計: {systemStats.memory.total}</span>
                    </div>
                </div>
            </div>

            {/* 磁碟使用率 */}
            <div className="stat-card">
                <div className="stat-header">
                <span className="stat-icon">💽</span>
                <span className="stat-title">磁碟</span>
                </div>
                <div className="stat-content">
                <div className="stat-main">
                    <span className="stat-value">{systemStats.disk.usage}%</span>
                    <div className="progress-bar">
                    <div 
                        className="progress-fill disk"
                        style={{ width: `${systemStats.disk.usage}%` }}
                    ></div>
                    </div>
                </div>
                <div className="stat-details">
                    <span>已用: {systemStats.disk.used}</span>
                    <span>總計: {systemStats.disk.total}</span>
                </div>
                </div>
            </div>

            {/* 網路狀態 */}
            <div className="stat-card">
                <div className="stat-header">
                    <span className="stat-icon">🌐</span>
                    <span className="stat-title">網路</span>
                </div>
                <div className="stat-content">
                    <div className="network-stats">
                        <div className="network-item">
                            <span className="network-label">上傳:</span>
                            <span className="network-value">{formatBytes(systemStats.network.bytes_sent)}</span>
                        </div>
                        <div className="network-item">
                            <span className="network-label">下載:</span>
                            <span className="network-value">{formatBytes(systemStats.network.bytes_recv)}</span>
                        </div>
                        <div className="network-item">
                            <span className="network-label">發送封包:</span>
                            <span className="network-value">{systemStats.network.packets_sent.toLocaleString()}</span>
                        </div>
                        <div className="network-item">
                            <span className="network-label">接收封包:</span>
                            <span className="network-value">{systemStats.network.packets_recv.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ) : connectionStatus.monitoring ? (
        <div className="monitor-loading">
            <div className="loading-spinner"></div>
            <span>正在獲取系統數據...</span>
        </div>
    ) : (
        <div className="monitor-placeholder">
            <span>點擊「開始監控」查看實時系統狀態</span>
        </div>
        )}
    </div>
  );
}
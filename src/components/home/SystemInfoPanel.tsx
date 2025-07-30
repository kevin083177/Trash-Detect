import type React from "react";

interface SystemInfoPanelProps {
    isLoading: boolean;
    systemInfo: any;
}

export const SystemInfoPanel: React.FC<SystemInfoPanelProps> = ({ isLoading, systemInfo }) => {
    const formatDateTime = (dateTimeString: string) => {
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return dateTimeString;
        }
    }

    if (isLoading) {
        return (
             <div className="loading-container">
                <div className="loading-spinner"></div>
                <div>載入系統資訊中...</div>
            </div>
        )
    }

    if (!systemInfo) {
        return (
            <div className="no-data-container">
                <p>無法載入系統資訊</p>
            </div>
        )
    }
    return (
        <div className="system-info-container">
            {/* 應用程式資訊 */}
            <div className="system-info-section">
                <div className="system-info-section-title">
                    <span className="system-info-icon">⚙️</span>
                    應用程式資訊
                </div>
                <div className="system-info-grid">
                    <div className="system-info-item">
                        <div className="system-info-label">應用名稱</div>
                        <div className="system-info-value">{systemInfo.application?.app_name || 'N/A'}</div>
                    </div>
                    <div className="system-info-item">
                        <div className="system-info-label">資料庫名稱</div>
                        <div className="system-info-value">{systemInfo.application?.db_name || 'N/A'}</div>
                    </div>
                    <div className="system-info-item">
                        <div className="system-info-label">環境</div>
                        <div className={`system-info-value environment-prod`}>
                            {systemInfo.application?.environment || 'N/A'}
                        </div>
                    </div>
                    <div className="system-info-item">
                        <div className="system-info-label">Flask 端口</div>
                        <div className="system-info-value">{systemInfo.application?.flask_port || 'N/A'}</div>
                    </div>
                    <div className="system-info-item">
                        <div className="system-info-label">Socket 端口</div>
                        <div className="system-info-value">{systemInfo.application?.socket_port || 'N/A'}</div>
                    </div>
                    <div className="system-info-item">
                        <div className="system-info-label">MongoDB 主機</div>
                        <div className="system-info-value system-info-value-small">{systemInfo.application?.mongo_host || 'N/A'}</div>
                    </div>
                </div>
            </div>

            {/* 資料庫資訊 */}
            <div className="system-info-section">
                <div className="system-info-section-title">
                    <span className="system-info-icon">🗄️</span>
                    資料庫資訊
                </div>
                <div className="system-info-database-summary">
                    <div className="system-info-total-collections">
                        <div className="system-info-total-number">{systemInfo.database?.total_collections || 0}</div>
                        <div className="system-info-total-label">總集合數</div>
                    </div>
                </div>
                <div className="system-info-collections">
                    {systemInfo.database?.collections && Object.entries(systemInfo.database.collections).map(([name, info]: [string, any]) => (
                        <div key={name} className="system-info-collection-item">
                            <div className="system-info-collection-name">{name}</div>
                            <div className="system-info-collection-count">{info.count}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 模型資訊 */}
            <div className="system-info-section">
                <div className="system-info-section-title">
                    <span className="system-info-icon">🤖</span>
                    AI 模型資訊
                </div>
                <div className="system-info-grid">
                    <div className="system-info-item">
                        <div className="system-info-label">YOLO 模型版本</div>
                        <div className="system-info-value">{systemInfo.models?.yolo_model?.model_version || 'N/A'}</div>
                    </div>
                    <div className="system-info-item">
                        <div className="system-info-label">信心閾值</div>
                        <div className="system-info-value">{systemInfo.models?.yolo_model?.confidence_threshold || 'N/A'}</div>
                    </div>
                </div>
            </div>

            {/* 系統資訊 */}
            <div className="system-info-section-row">
                {/* 平台資訊 */}
                <div className="system-info-section system-info-section-half">
                    <div className="system-info-section-title">
                        <span className="system-info-icon">💻</span>
                        平台資訊
                    </div>
                    <div className="system-info-list">
                        <div className="system-info-item">
                            <div className="system-info-label">作業系統</div>
                            <div className="system-info-value">{systemInfo.system?.platform?.system || 'N/A'}</div>
                        </div>
                        <div className="system-info-item">
                            <div className="system-info-label">版本</div>
                            <div className="system-info-value">{systemInfo.system?.platform?.version || 'N/A'}</div>
                        </div>
                        <div className="system-info-item">
                            <div className="system-info-label">架構</div>
                            <div className="system-info-value">{systemInfo.system?.platform?.architecture || 'N/A'}</div>
                        </div>
                        <div className="system-info-item">
                            <div className="system-info-label">機器</div>
                            <div className="system-info-value">{systemInfo.system?.platform?.machine || 'N/A'}</div>
                        </div>
                        <div className="system-info-item">
                            <div className="system-info-label">處理器</div>
                            <div className="system-info-value system-info-value-small">{systemInfo.system?.platform?.processor || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                {/* 伺服器資訊 */}
                <div className="system-info-section system-info-section-half">
                    <div className="system-info-section-title">
                        <span className="system-info-icon">🖥️</span>
                        伺服器資訊
                    </div>
                    <div className="system-info-list">
                        <div className="system-info-item">
                            <div className="system-info-label">主機名稱</div>
                            <div className="system-info-value">{systemInfo.system?.server?.hostname || 'N/A'}</div>
                        </div>
                        <div className="system-info-item">
                            <div className="system-info-label">時區</div>
                            <div className="system-info-value">{systemInfo.system?.server?.timezone || 'N/A'}</div>
                        </div>
                        <div className="system-info-item">
                            <div className="system-info-label">當前時間</div>
                            <div className="system-info-value system-info-value-small">
                                {systemInfo.system?.server?.current_time ? formatDateTime(systemInfo.system.server.current_time) : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
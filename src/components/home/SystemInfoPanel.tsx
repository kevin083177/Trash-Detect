import type React from "react";
import './styles/SystemInfoPanel.css';
import { IoMdSettings } from "react-icons/io";
import { PiScanDuotone } from "react-icons/pi";
import { FaComputer } from "react-icons/fa6";

interface SystemInfoPanelProps {
    isLoading: boolean;
    systemInfo: any;
}

export const SystemInfoPanel: React.FC<SystemInfoPanelProps> = ({ isLoading, systemInfo }) => {
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
            <div className="system-info-section">
                <div className="system-info-section-title">
                    <span className="system-info-icon"><IoMdSettings size={24}/></span>
                    應用程式資訊
                </div>
                <div className="system-info-grid">
                    <div className="system-info-item">
                        <div className="system-info-label">資料庫名稱</div>
                        <div className="system-info-value">{systemInfo.application.db_name}</div>
                    </div>
                    <div className="system-info-item">
                        <div className="system-info-label">Flask 端口</div>
                        <div className="system-info-value">{systemInfo.application.flask_port}</div>
                    </div>
                    <div className="system-info-item">
                        <div className="system-info-label">Socket 端口</div>
                        <div className="system-info-value">{systemInfo.application.socket_port}</div>
                    </div>
                    <div className="system-info-item">
                        <div className="system-info-label">MongoDB 主機</div>
                        <div className="system-info-value system-info-value-small">{systemInfo.application.mongo_host}</div>
                    </div>
                </div>
            </div>

            <div className="system-info-section">
                <div className="system-info-section-title">
                    <span className="system-info-icon"><PiScanDuotone size={24}/></span>
                    AI 模型資訊
                </div>
                <div className="system-info-small-grid">
                    <div className="system-info-item">
                        <div className="system-info-label">YOLO 模型版本</div>
                        <div className="system-info-value">{systemInfo.models.yolo_model.model_version}</div>
                    </div>
                    <div className="system-info-item">
                        <div className="system-info-label">信心閾值</div>
                        <div className="system-info-value">{systemInfo.models.yolo_model.confidence_threshold}</div>
                    </div>
                    <div className="system-info-item">
                        <div className="system-info-label">IoU閾值</div>
                        <div className="system-info-value">{systemInfo.models.yolo_model.iou_threshold}</div>
                    </div>
                </div>
            </div>

            <div className="system-info-section">
                <div className="system-info-section-title">
                    <span className="system-info-icon"><FaComputer size={24} /></span>
                    平台資訊
                </div>
                <div className="system-info-small-grid">
                    <div className="system-info-item">
                        <div className="system-info-label">作業系統</div>
                        <div className="system-info-value">{systemInfo.system.platform.system}</div>
                    </div>
                    <div className="system-info-item">
                        <div className="system-info-label">版本</div>
                        <div className="system-info-value">{systemInfo.system.platform.version}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
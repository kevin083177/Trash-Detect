import React from 'react';
import './styles/StatusCard.css';

interface StatusCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    isLoading?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({
    title,
    value,
    icon,
    color = '#3b82f6',
    subtitle,
    trend,
    isLoading = false
}) => {
    const hexToRgba = (hex: string, alpha: number = 0.85) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return hex;
    };

    const getLightBackground = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `rgba(${r}, ${g}, ${b}, 0.1)`;
        }
        return hex;
    };

    const cardStyle = {
        '--card-color': color,
        '--card-border': hexToRgba(color, 0.85),
        '--card-bg': getLightBackground(color),
    } as React.CSSProperties;

    if (isLoading) {
        return (
            <div className="status-card" style={cardStyle}>
                <div className="status-card-loading">
                    <div className="status-card-loading-spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="status-card" style={cardStyle}>
            <div className="status-card-header">
                {icon && (
                    <div className="status-card-icon">{icon}</div>
                )}
                <div className="status-card-title">{title}</div>
                {trend && (
                    <div className={`status-card-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
                        <span className="status-card-trend-icon">
                            {trend.isPositive ? '↗' : '↘'}
                        </span>
                        <span className="status-card-trend-value">
                            {Math.abs(trend.value)}%
                        </span>
                    </div>
                )}
            </div>
            
            <div className="status-card-content">
                <div className="status-card-value">{value}</div>
                {subtitle && (
                    <div className="status-card-subtitle">{subtitle}</div>
                )}
            </div>
        </div>
    );
};
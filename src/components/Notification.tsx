import React, { useEffect, useState } from 'react';
import './styles/Notification.css';

export type NotificationType = 'success' | 'error' | 'warning';

interface NotificationProps {
  show: boolean;
  type: NotificationType;
  message: string;
  duration?: number;
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  show,
  type,
  message,
  duration = 2000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div className={`notification ${isVisible ? 'show' : ''}`}>
      <div className={`notification-content ${type}`}>
        <span className="notification-message">{message}</span>
        <button 
          className="notification-close"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};
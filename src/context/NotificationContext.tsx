import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { Notification, type NotificationType } from '../components/Notification';

export interface NotificationData {
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const showNotificationHandler = (data: NotificationData) => {
    setNotification(data);
    setShowNotification(true);
  };

  const showSuccess = (message: string, duration?: number) => {
    showNotificationHandler({ type: 'success', message, duration });
  };

  const showError = (message: string, duration?: number) => {
    showNotificationHandler({ type: 'error', message, duration });
  };

  const showWarning = (message: string, duration?: number) => {
    showNotificationHandler({ type: 'warning', message, duration });
  };

  const hideNotification = () => {
    setShowNotification(false);
    setNotification(null);
  };

  const contextValue: NotificationContextType = {
    showSuccess,
    showError,
    showWarning,
    hideNotification
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Notification
        show={showNotification}
        type={notification?.type || 'success'}
        message={notification?.message || ''}
        duration={notification?.duration}
        onClose={hideNotification}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
import React from 'react';
import './styles/UserCard.css';
import { IoGameController } from "react-icons/io5";
import { FaRegCalendarCheck } from "react-icons/fa";
import { BsCoin } from "react-icons/bs";
import type { User } from '../../interfaces/user';

interface UserCardProps {
  user: User;
  onClick: (user: User) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onClick }) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    const parent = target.parentElement;
    if (parent) {
      const fallback = parent.querySelector('.user-card-default-avatar') as HTMLElement;
      if (fallback) {
        fallback.style.display = 'flex';
      }
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '從未';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '無效日期';
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
      });
    } catch {
      return '無效日期';
    }
  };

  const getActivityStatus = (lastActive: string | null): string => {
    if (!lastActive) return 'offline';
    
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    
    const todayStr = now.getFullYear() + '-' + 
                     String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(now.getDate()).padStart(2, '0');
    
    const activeDayStr = lastActiveDate.getUTCFullYear() + '-' + 
                         String(lastActiveDate.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                         String(lastActiveDate.getUTCDate()).padStart(2, '0');
    
    const today = new Date(todayStr + 'T00:00:00');
    const activeDay = new Date(activeDayStr + 'T00:00:00');
    const daysDiff = Math.floor((today.getTime() - activeDay.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 'today';
    if (daysDiff === 1) return 'yesterday';
    if (daysDiff < 7) return 'week';
    return 'offline';
  };

  const activityStatus = getActivityStatus(user.last_active);

  return (
    <div className="user-card-container" onClick={() => onClick(user)}>
      <div className="user-card-background-curve"></div>
      
      <div className="user-card-header">
        <div className="user-card-avatar-container">
          {user.profile && user.profile.url ? (
            <>
              <img
                src={user.profile.url}
                alt={user.username}
                className="user-card-avatar"
                onError={handleImageError}
              />
              <div 
                className="user-card-default-avatar"
                style={{ display: 'none' }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
            </>
          ) : (
            <div className="user-card-default-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={`user-card-status-indicator ${activityStatus}`} />
        </div>
        
        <h3 className="user-card-username">{user.username}</h3>
        <div className="user-card-user-id">
          {user._id}
        </div>
        <div className="user-card-last-active">
          最後活動: {formatDate(user.last_active)}
        </div>
      </div>
      
      <div className="user-card-stats">
        <div className="user-card-stat-item">
          <div className="user-card-stat-icon">
            <BsCoin />
          </div>
          <div className="user-card-stat-info">
            <span className="user-card-stat-value">${(user.money).toLocaleString('zh-TW')}</span>
            <span className="user-card-stat-label">狗狗幣</span>
          </div>
        </div>
        
        <div className="user-card-stat-item">
          <div className="user-card-stat-icon">
            <IoGameController />
          </div>
          <div className="user-card-stat-info">
            <span className="user-card-stat-value">Lv.{user.highest_level}</span>
            <span className="user-card-stat-label">最高關卡</span>
          </div>
        </div>
        
        <div className="user-card-stat-item">
          <div className="user-card-stat-icon">
            <FaRegCalendarCheck />
          </div>
          <div className="user-card-stat-info">
            <span className="user-card-stat-value">{user.consecutive_check_in_days || 0}</span>
            <span className="user-card-stat-label">連續簽到</span>
          </div>
        </div>
      </div>
    </div>
  );
};
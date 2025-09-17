import React, { useState, useEffect, useMemo } from 'react';
import '../styles/Users.css';
import { asyncGet } from '../utils/fetch';
import { admin_api } from '../api/api';
import type { User } from '../interfaces/user';
import { UserCard } from '../components/user/UserCard';
import { UserModal } from '../components/user/UserModal';
import { StatusCard } from '../components/home/StatusCard';
import { IoPersonSharp, IoStatsChart, IoCalendarSharp, IoTrendingUp } from 'react-icons/io5';
import { FaSpinner } from 'react-icons/fa';
import { useNotification } from '../context/NotificationContext';

interface DashboardStats {
  totalUsers: number;
  activeToday: number;
  activeYesterday: number;
  activeThisWeek: number;
}

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { showError } = useNotification();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await asyncGet(admin_api.get_all_users_info, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response && response.body) {
          setUsers(response.body);
          setFilteredUsers(response.body);
        }
      } catch (err) {
        setError('載入資料時發生錯誤');
        showError('獲取使用者資料失敗');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getActivityStatus = (lastActive: string | null): 'today' | 'yesterday' | 'week' | 'offline' => {
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

  const stats = useMemo((): DashboardStats => {
    const activeToday = users.filter(user => getActivityStatus(user.last_active) === 'today').length;
    const activeYesterday = users.filter(user => getActivityStatus(user.last_active) === 'yesterday').length;
    const activeThisWeek = users.filter(user => {
      const status = getActivityStatus(user.last_active);
      return status === 'today' || status === 'yesterday' || status === 'week';
    }).length;

    return {
      totalUsers: users.length,
      activeToday,
      activeYesterday,
      activeThisWeek
    };
  }, [users]);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="users-dashboard">
      <div className="users-stats-grid">
        <StatusCard
          title="總會員數量"
          value={stats.totalUsers}
          icon={<IoPersonSharp size={18}/>}
          color="#3b82f6"
          subtitle="使用者總數"
          isLoading={loading}
        />
        <StatusCard
          title="今日活躍人數"
          value={stats.activeToday}
          icon={<IoStatsChart size={18}/>}
          color="#10b981"
          subtitle="今天有登入的使用者"
          isLoading={loading}
        />
        <StatusCard
          title="昨日活躍人數"
          value={stats.activeYesterday}
          icon={<IoCalendarSharp size={18}/>}
          color="#f59e0b"
          subtitle="昨天有登入的使用者"
          isLoading={loading}
        />
        <StatusCard
          title="本週活躍人數"
          value={stats.activeThisWeek}
          icon={<IoTrendingUp size={18}/>}
          color="#8b5cf6"
          subtitle="近7天內有登入的使用"
          isLoading={loading}
        />
      </div>
      
      {error ? (
        <div className="users-error">{error}</div>
      ) : loading ? (
        <div className="users-loading-container">
          <div className="users-loading-spinner">
            <FaSpinner className="users-spinner-icon" />
            <span>載入用戶資料中...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="users-grid">
            {filteredUsers.map((user) => (
              <UserCard
                key={user._id}
                user={user}
                onClick={handleUserClick}
              />
            ))}
          </div>

          <UserModal
            user={selectedUser}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          />
        </>
      )}
    </div>
  );
};
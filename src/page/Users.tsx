import React, { useState, useEffect, useMemo } from 'react';
import '../styles/Users.css';
import { asyncGet } from '../utils/fetch';
import { admin_api } from '../api/api';
import type { User } from '../interfaces/user';
import { Header } from '../components/Header';
import { UserCard } from '../components/user/UserCard';
import { UserModal } from '../components/user/UserModal';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  checkedInUsers: number;
}

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        } else {
          setError('無法載入使用者資料');
        }
      } catch (err) {
        setError('載入資料時發生錯誤');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const stats = useMemo((): DashboardStats => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const activeUsers = users.filter(user => {
      if (!user.last_active) return false;
      const lastActive = new Date(user.last_active);
      return (now.getTime() - lastActive.getTime()) < 24 * 60 * 60 * 1000;
    }).length;

    const checkedInUsers = users.filter(user => {
      if (!user.last_check_in) return false;
      try {
        const lastCheckIn = new Date(user.last_check_in);
        return lastCheckIn.toISOString().split('T')[0] === today;
      } catch {
        return false;
      }
    }).length;

    return {
      totalUsers: users.length,
      activeUsers,
      checkedInUsers
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

  if (loading) {
    return (
      <div className="users-dashboard">
        <div className="users-loading">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-dashboard">
        <div className="users-error">{error}</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="users-dashboard">
        <div className="users-stat-number">{stats.totalUsers}</div>

        <div className="users-controls">
          <div className="users-search-box">
            <input
              type="text"
              placeholder="搜尋使用者名稱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="users-grid">
          {filteredUsers.map((user) => (
            <UserCard
              key={user._id}
              user={user}
              onClick={handleUserClick}
            />
          ))}
        </div>

        {filteredUsers.length === 0 && searchTerm && (
          <div className="users-no-data">
            找不到符合 "{searchTerm}" 的使用者
          </div>
        )}

        <UserModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </>
  );
};
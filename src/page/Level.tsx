import React, { useState, useEffect } from 'react';
import { LevelCard } from '../components/level/LevelCard';
import { asyncGet } from '../utils/fetch';
import { level_api } from '../api/api';
import '../styles/Level.css';
import type { Level } from '../interfaces/level';
import { StatusCard } from '../components/home/StatusCard';
import { useNotification } from '../context/NotificationContext';
import { BiDetail, BiListOl } from "react-icons/bi";
import { RiErrorWarningFill } from "react-icons/ri";
import { FaSpinner } from "react-icons/fa";

export const LevelPage: React.FC = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);

  const { showError } = useNotification();
  
  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await asyncGet(level_api.all, {
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.body && Array.isArray(response.body)) {
        const sortedLevels = response.body.sort((a:Level, b:Level) => a.sequence - b.sequence);
        setLevels(sortedLevels);
      } else {
        showError('無法獲取關卡資訊');
      }
    } catch (err) {
      console.error('載入關卡時發生錯誤:', err);
      setError('載入資料時發生錯誤');
      showError('獲取關卡資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const checkCanPerformAction = (targetLevelId: string): boolean => {
    if (!editingLevelId || editingLevelId === targetLevelId) {
      return true;
    }

    const confirmCancel = window.confirm(
      '目前有其他關卡正在編輯中，是否要取消當前編輯並繼續？'
    );
    
    if (confirmCancel) {
      setEditingLevelId(null);
      return false;
    }
    
    return false;
  };

  const handleEditLevel = (Level: Level) => {
    if (!checkCanPerformAction(Level._id)) {
      return;
    }
    
    setEditingLevelId(Level._id);
  };

  const handleEditEnd = () => {
    setEditingLevelId(null);
  };

  return (
    <div className="level-dashboard">
      <div className="level-stats-grid">
        <StatusCard 
            title="章節數量"
            value={new Set(levels.map(level => level.chapter)).size}
            icon={<BiDetail size={18}/>}
            color="#4275d9"
            isLoading={loading}
        />
        <StatusCard 
            title="關卡數量"
            value={levels.length}
            icon={<BiListOl size={18}/>}
            color="#9d42d9"
            isLoading={loading}
        />
        <StatusCard
          title="關卡管理操作須知"
          value={""}
          subtitle={`若需要新增/刪除關卡 請至題目管理新增主題`}
          icon={<RiErrorWarningFill size={18}/>}
          color='red'
          isLoading={loading}
        />
      </div>

      {error ? (
        <div className="level-error">{error}</div>
      ) : loading ? (
        <div className="level-loading-container">
          <div className="level-loading-spinner">
            <FaSpinner className="level-spinner-icon" />
            <span>載入關卡中...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="level-grid">
            {levels.map((level) => (
              <LevelCard
                key={level._id}
                levelData={level}
                onEdit={handleEditLevel}
                onEditEnd={handleEditEnd}
                canEdit={!editingLevelId || editingLevelId === level._id}
              />
            ))}
          </div>
          
          {levels.length === 0 && (
            <div className="level-no-data">
              尚無任何關卡
            </div>
          )}
        </>
      )}
    </div>
  );
};
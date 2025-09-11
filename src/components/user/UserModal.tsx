import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './styles/UserModal.css';
import type { User } from '../../interfaces/user';
import type { Trash } from '../../interfaces/Trash';
import type { QuestionStats } from '../../interfaces/question';

interface UserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;

  const translateType = (type: string): string => {
    const translations: Record<string, string> = {
      bottles: '寶特瓶',
      cans: '鐵鋁罐',
      containers: '紙容器',
      paper: '紙張',
      plastic: '塑膠'
    };
    return translations[type];
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '從未活動';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '無效日期';
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC'
      });
    } catch {
      return '無效日期';
    }
  };

  const getTrashStatsData = (trashStats: Trash | null | undefined) => {
    if (!trashStats || typeof trashStats !== 'object') {
      return [];
    }
    
    const colors = ['#6366f1', '#8b5cf6', '#d946ef', '#06b6d4', '#10b981'];
    try {
      return Object.entries(trashStats)
        .filter(([_, value]) => typeof value === 'number' && value > 0)
        .map(([type, count], index) => ({
          name: translateType(type),
          value: count,
          color: colors[index % colors.length]
        }));
    } catch (error) {
      console.error('Error processing trash stats:', error);
      return [];
    }
  };

  const getQuestionStatsData = (questionStats: {[K in keyof Trash]: QuestionStats} | null | undefined) => {
    if (!questionStats || typeof questionStats !== 'object') {
      return [];
    }
    
    try {
      return Object.entries(questionStats)
        .filter(([_, stats]) => {
          return stats && 
                 typeof stats === 'object' && 
                 typeof stats.total === 'number' && 
                 typeof stats.correct === 'number' && 
                 stats.total > 0;
        })
        .map(([type, stats]) => ({
          category: translateType(type),
          correct: stats.correct,
          incorrect: stats.total - stats.correct,
          total: stats.total,
          accuracy: Math.round((stats.correct / stats.total) * 100)
        }));
    } catch (error) {
      console.error('Error processing question stats:', error);
      return [];
    }
  };

  const trashStats = user.trash_stats;
  const questionStats = user.question_stats;
  
  const trashData = getTrashStatsData(trashStats);
  const questionData = getQuestionStatsData(questionStats);
  
  const totalTrash = (() => {
    try {
      return Object.values(trashStats).reduce((sum, val) => {
        return sum + (typeof val === 'number' ? val : 0);
      }, 0);
    } catch {
      return 0;
    }
  })();
  
  const totalQuestions = (() => {
    try {
      return Object.values(questionStats).reduce((sum, stats) => {
        return sum + (stats && typeof stats.total === 'number' ? stats.total : 0);
      }, 0);
    } catch {
      return 0;
    }
  })();
  
  const totalCorrect = (() => {
    try {
      return Object.values(questionStats).reduce((sum, stats) => {
        return sum + (stats && typeof stats.correct === 'number' ? stats.correct : 0);
      }, 0);
    } catch {
      return 0;
    }
  })();
  
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    const parent = target.parentElement;
    if (parent) {
      const fallback = parent.querySelector('.user-modal-default-avatar') as HTMLElement;
      if (fallback) {
        fallback.style.display = 'flex';
      }
    }
  };

  const BarChartToolTip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const correct = payload.find((p: any) => p.dataKey === "correct")?.value;
      const incorrect = payload.find((p: any) => p.dataKey === "incorrect")?.value;
      const total = correct + incorrect;
      const accuracy = total > 0 ? ((correct / total) * 100).toFixed(1) + "%" : "N/A";

      const keyMap: Record<string, string> = {
        correct: "回答正確",
        incorrect: "回答錯誤",
      };

      return (
        <div className="user-modal-custom-tooltip">
          <p className="user-modal-tooltip-label">{label}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} className="user-modal-tooltip-content">
              <span style={{ color: pld.color }}>
                {keyMap[pld.dataKey]}: {pld.value}
              </span>
            </p>
          ))}
          <p className="user-modal-tooltip-content">
            <span style={{color: "#2980e3"}}>正確率: {accuracy}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const PieChartToolTip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="user-modal-custom-tooltip">
          <p className="user-modal-tooltip-label">{data.name}</p>
          <p className="user-modal-tooltip-content">數量: {data.value}</p>
          <p className="user-modal-tooltip-content">
            佔比: {totalTrash > 0 ? ((data.value / totalTrash) * 100).toFixed(1) : '0'}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="user-modal-backdrop" onClick={handleBackdropClick}>
      <div className="user-modal-container">
        <div className="user-modal-header">
          <div className="user-modal-user-info">
            <div className="user-modal-avatar-container">
              {user.profile && user.profile.url ? (
                <>
                  <img
                    src={user.profile.url}
                    alt={user.username}
                    className="user-modal-avatar"
                    onError={handleImageError}
                  />
                  <div 
                    className="user-modal-default-avatar"
                    style={{ display: 'none' }}
                  >
                    {(user.username).charAt(0).toUpperCase()}
                  </div>
                </>
              ) : (
                <div className="user-modal-default-avatar">
                  {(user.username).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="user-modal-user-details">
              <h2 className="user-modal-username">{user.username}</h2>
              <p className="user-modal-user-id">ID: {user._id}</p>
              <p className="user-modal-last-active">
                最後活動: {formatDateTime(user.last_active)}
              </p>
            </div>
          </div>
          <button className="user-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="user-modal-body">
          <div className="user-modal-content">            
            <div className="user-modal-charts-container">
              <div className="user-modal-chart-wrapper">
                <h3 className="user-modal-chart-title">垃圾回收統計</h3>
                {trashData.length > 0 ? (
                  <div className="user-modal-chart-content">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <Pie
                          data={trashData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent}) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {trashData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieChartToolTip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="user-modal-chart-summary">
                      總計回收: {totalTrash} 件
                    </div>
                  </div>
                ) : (
                  <div className="user-modal-no-data">
                    暫無回收記錄
                  </div>
                )}
              </div>

              <div className="user-modal-chart-wrapper">
                <h3 className="user-modal-chart-title">答題統計</h3>
                {questionData.length > 0 ? (
                  <div className="user-modal-chart-content">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={questionData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="category" 
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <Tooltip content={<BarChartToolTip />} />
                        <Legend
                          iconType="square"
                          wrapperStyle={{fontSize: '16px'}}
                        />
                        <Bar dataKey="correct" stackId="a" fill="#10b981" name="回答正確" />
                        <Bar dataKey="incorrect" stackId="a" fill="#ef4444" name="回答錯誤" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="user-modal-chart-summary">
                      總正確率: {overallAccuracy}% ({totalCorrect}/{totalQuestions})
                    </div>
                  </div>
                ) : (
                  <div className="user-modal-no-data">
                    暫無答題記錄
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
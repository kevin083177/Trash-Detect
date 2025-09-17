import React, { useState } from 'react';
import './styles/LevelCard.css';
import { FiEdit3, FiLayers, FiHash, FiCheck, FiX } from 'react-icons/fi';
import type { Level } from '../../interfaces/level';
import { asyncPut } from '../../utils/fetch';
import { level_api } from '../../api/api';
import { useNotification } from '../../context/NotificationContext';

interface LevelCardProps {
  levelData: Level;
  onEdit: (levelData: Level) => void;
  onEditEnd: () => void;
  canEdit: boolean;
}

export const LevelCard: React.FC<LevelCardProps> = ({
  levelData,
  onEdit,
  onEditEnd,
  canEdit
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(levelData.description);
  const [isLoading, setIsLoading] = useState(false);
  const { showError, showSuccess } = useNotification();

  const DESCRIPTION_MAX_LENGTH = 40;

  const handleEditClick = () => {
    if (canEdit && !isEditing) {
      setIsEditing(true);
      setEditedDescription(levelData.description);
      onEdit(levelData);
    }
  };

  const handleConfirmClick = async () => {
    if (!canEdit || !isEditing) return;
    
    setIsLoading(true);
    try {
      const response = await asyncPut(level_api.update, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: {
          sequence: levelData.sequence,
          name: levelData.name,
          description: editedDescription,
          unlock_requirement: levelData.unlock_requirement
        }
      });
      if (response.status === 200) {
        levelData.description = editedDescription;
        setIsEditing(false);
        onEditEnd();
        showSuccess(`成功更新 ${levelData.name}`);
      }
    } catch (error) {
      console.error('Failed to update level:', error);
      showError('更新關卡失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedDescription(levelData.description);
    onEditEnd();
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= DESCRIPTION_MAX_LENGTH) {
      setEditedDescription(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleConfirmClick();
    }
    if (e.key === 'Escape') {
      handleCancelClick();
    }
  };

  const getCharCountClass = () => {
    const currentLength = (editedDescription ?? '').length;
    if (currentLength >= DESCRIPTION_MAX_LENGTH) {
      return 'level-card-char-count at-limit';
    } else if (currentLength >= DESCRIPTION_MAX_LENGTH * 0.8) {
      return 'level-card-char-count near-limit';
    }
    return 'level-card-char-count';
  };

  return (
    <div className={`level-card-container ${!canEdit ? 'level-card-disabled' : ''}`}>
      <div className="level-card-bg-decoration">
        <div className="level-card-bg-circle level-card-circle-1"></div>
        <div className="level-card-bg-circle level-card-circle-2"></div>
        <div className="level-card-bg-circle level-card-circle-3"></div>
      </div>

      <div className="level-card-header">
        <div className="level-card-sequence-badge">
          <div className="level-card-sequence-icon">
            <FiHash size={12} />
          </div>
          <span className="level-card-sequence-text">{levelData.sequence}</span>
        </div>
        
        <div className="level-card-actions">
          {!isEditing ? (
            <button
              className={`level-card-action-button level-card-edit-action ${!canEdit ? 'level-card-disabled' : ''}`}
              onClick={handleEditClick}
              disabled={!canEdit}
              title={!canEdit ? '目前有其他關卡正在編輯中' : '編輯關卡'}
            >
              <FiEdit3 size={16} />
            </button>
          ) : (
            <>
              <button
                className={`level-card-action-button level-card-confirm-action ${!canEdit ? 'level-card-disabled' : ''}`}
                onClick={handleConfirmClick}
                disabled={!canEdit || isLoading}
                title="確認修改"
              >
                {isLoading ? (
                  <div className="level-card-loading-spinner"></div>
                ) : (
                  <FiCheck size={16} />
                )}
              </button>
              <button
                className={`level-card-action-button level-card-cancel-action ${!canEdit ? 'level-card-disabled' : ''}`}
                onClick={handleCancelClick}
                disabled={!canEdit || isLoading}
                title="取消編輯"
              >
                <FiX size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="level-card-content">
        <div className="level-card-title">
          <h3 className="level-card-name">{levelData.name}</h3>
          <div className={`level-card-chapter-tag level-card-purple ${levelData.chapter}`}>
            <FiLayers className="level-card-edit-icon" size={12} />
            <span>{levelData.chapter}</span>
          </div>
        </div>

        <div className="level-card-description">
          {isEditing ? (
            <div className="level-card-description-container">
              <textarea
                className="level-card-description-input"
                value={editedDescription ?? ''}
                onChange={handleDescriptionChange}
                onKeyDown={handleKeyDown}
                placeholder="輸入關卡故事..."
                rows={2}
                autoFocus
              />
              <div className={getCharCountClass()}>
                {(editedDescription ?? '').length}/{DESCRIPTION_MAX_LENGTH}
              </div>
            </div>
          ) : (
            <p>{levelData.description}</p>
          )}
        </div>
      </div>

      <div className="level-card-footer">
        <div className="level-card-unlock-info">
          <div className="level-card-unlock-text">
            {levelData.unlock_requirement === 0 ? (
              <span className="level-card-start-level">起始關卡</span>
            ) : (
              <span className="level-card-requirement-level">
                需要完成 Level {levelData.unlock_requirement}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
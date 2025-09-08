import React, { useState, useEffect } from 'react';
import './styles/EditThemeModal.css';
import { IoImagesSharp } from "react-icons/io5";
import { useNotification } from '../../context/NotificationContext';
import { asyncDelete, asyncPut } from '../../utils/fetch';
import { theme_api } from '../../api/api';
import type { Theme } from '../../interfaces/theme';
import { useNavigate } from "react-router-dom";

interface EditThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (themeData: Theme) => void;
  initialData: Theme | null;
}

export const EditThemeModal: React.FC<EditThemeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [editThemeName, setEditThemeName] = useState("");
  const [editThemeDesc, setEditThemeDesc] = useState("");
  const [editThemeImage, setEditThemeImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isOpen && initialData) {
      setEditThemeName(initialData.name);
      setEditThemeDesc(initialData.description || "");
      setEditThemeImage(initialData.image?.url || null);
      setSelectedImageFile(null);
      setError('');
    }
  }, [isOpen, initialData]);

  const validateForm = (): boolean => {
    if (!editThemeName.trim()) {
      setError('請輸入主題名稱');
      return false;
    }

    if (!editThemeDesc.trim()) {
      setError('請輸入主題描述');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !initialData) return;

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      
      formData.append('theme_id', initialData._id ?? '');
      
      if (editThemeName.trim() !== initialData.name) {
        formData.append('name', editThemeName.trim());
      }
      
      if (editThemeDesc.trim() !== (initialData.description || '')) {
        formData.append('description', editThemeDesc.trim());
      }
      
      if (selectedImageFile) {
        formData.append('image', selectedImageFile);
      }

      const response = await asyncPut(theme_api.update_theme, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }, 
        body: formData
      });
      if (response.status === 200) {
        showSuccess('主題更新成功');

        onSave({
          _id: initialData._id,
          name: editThemeName,
          description: editThemeDesc,
          image: editThemeImage
            ? { public_id: initialData.image?.public_id || '', url: editThemeImage }
            : initialData.image
        });
        
        onClose();
      } else {
        showError('更新失敗');
      }
    } catch (err: any) {
      console.error('Update theme error:', err);
      setError(err.message || '儲存主題時發生錯誤');
      
      showError('更新主題時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;

    const confirmed = window.confirm(
      '確定要刪除此主題嗎？刪除後將會一併清除所有商品資料，此操作無法復原。'
    );
    
    if (!confirmed) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await asyncDelete(`${theme_api.delete_theme}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: {
          theme_name: initialData.name
        }
      });

      if (response.status === 200) {
        navigate("/theme");
        showSuccess('主題刪除成功');
        onClose();
        // onDelete?.(initialData._id);
      } else {
        showError('刪除失敗');
      }
    } catch (err: any) {
      console.error('Delete theme error:', err);
      setError('刪除主題時發生錯誤');
      showError('刪除主題時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('圖片大小不能超過5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('請選擇有效的圖片檔案 (支持JPG、PNG、GIF)');
        return;
      }

      setError('');
      setSelectedImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => setEditThemeImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    if (initialData) {
      setEditThemeName(initialData.name);
      setEditThemeDesc(initialData.description || "");
      setEditThemeImage(initialData.image?.url || null);
      setSelectedImageFile(null);
    }
    setError('');
    onClose();
  };

  const handleInputChange = (field: 'name' | 'description', value: string) => {
    if (field === 'name') {
      setEditThemeName(value);
    } else {
      setEditThemeDesc(value);
    }
    if (error) setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="edit-theme-modal-overlay" onClick={handleCancel}>
      <div className="edit-theme-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="edit-theme-modal-header">
          <h3>編輯主題</h3>
          <button
            className="edit-theme-modal-close"
            onClick={handleCancel}
            disabled={isLoading}
          >
            ×
          </button>
        </div>
        
        <div className="edit-theme-modal-card">
          <div className="edit-theme-modal-left">
            <div className="edit-theme-modal-field">
              <label>主題封面 <span className="required">*</span></label>
              {editThemeImage ? (
                <div className="edit-theme-modal-image-container">
                  <img 
                    src={editThemeImage} 
                    alt="主題預覽" 
                    className="edit-theme-modal-image" 
                  />
                  <div className="edit-theme-modal-image-overlay">
                    <div className="edit-theme-modal-change-icon">
                      <IoImagesSharp />
                      <span>更換圖片</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="edit-theme-modal-image-input"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="edit-theme-modal-image-placeholder">
                  <div className="edit-theme-modal-upload-icon">
                    <IoImagesSharp />
                  </div>
                  <label>上傳主題封面</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleImageChange}
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="edit-theme-modal-right">
            <div className="edit-theme-modal-field">
              <label>主題名稱 <span className="required">*</span></label>
              <input
                className="edit-theme-modal-name-input"
                placeholder="輸入主題名稱"
                value={editThemeName}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isLoading}
                maxLength={50}
              />
            </div>
            
            <div className="edit-theme-modal-field">
              <label>主題描述 <span className="required">*</span></label>
              <textarea
                className="edit-theme-modal-description-input"
                placeholder="輸入主題描述"
                value={editThemeDesc}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isLoading}
                maxLength={200}
                rows={4}
              />
            </div>

            <div className="edit-theme-modal-actions">
              <button
                className="edit-theme-modal-delete-btn"
                onClick={handleDelete}
                disabled={isLoading}
              >
                刪除主題
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="edit-theme-modal-error">
            {error}
          </div>
        )}

        <div className="edit-theme-modal-actions">
          <button
            className="edit-theme-modal-save-btn"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  );
};
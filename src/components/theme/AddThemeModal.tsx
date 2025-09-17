import React, { useState, useEffect } from 'react';
import './styles/AddThemeModal.css';
import { IoImagesSharp } from "react-icons/io5";
import { useNotification } from '../../context/NotificationContext';
import { asyncPost } from '../../utils/fetch';
import { theme_api } from '../../api/api';
import type { Theme } from '../../interfaces/theme';
import { createPortal } from "react-dom";

interface AddThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (themeData: Theme) => void;
}

export const AddThemeModal: React.FC<AddThemeModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [themeName, setThemeName] = useState("");
  const [themeDesc, setThemeDesc] = useState("");
  const [themeImage, setThemeImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (isOpen) {
      setThemeName("");
      setThemeDesc("");
      setThemeImage(null);
      setSelectedImageFile(null);
      setError('');
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    if (!themeName.trim()) {
      setError('請輸入主題名稱');
      return false;
    }

    if (!themeDesc.trim()) {
      setError('請輸入主題描述');
      return false;
    }

    if (!selectedImageFile) {
      setError('請選擇主題封面圖片');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      
      formData.append('name', themeName.trim());
      formData.append('description', themeDesc.trim());
      
      if (selectedImageFile) {
        formData.append('image', selectedImageFile);
      }

      const response = await asyncPost(theme_api.add_theme, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }, 
        body: formData
      });

      if (response.status === 200) {
        showSuccess('主題新增成功');

        const newTheme: Theme = {
          _id: response.body._id,
          name: response.body.name,
          description: response.body.description,
          image: response.body.image,
          products: []
        };

        onSave(newTheme);
        onClose();
      } else {
        throw new Error('新增失敗');
      }
    } catch (err: any) {
      setError(err.message || '新增主題時發生錯誤');
      showError('新增主題時發生錯誤');
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
        setError('不支援該圖片檔案');
        return;
      }

      setError('');
      setSelectedImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => setThemeImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    setThemeName("");
    setThemeDesc("");
    setThemeImage(null);
    setSelectedImageFile(null);
    setError('');
    onClose();
  };

  const handleInputChange = (field: 'name' | 'description', value: string) => {
    if (field === 'name') {
      setThemeName(value);
    } else {
      setThemeDesc(value);
    }
    if (error) setError('');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="add-theme-modal-overlay" onClick={handleCancel}>
      <div className="add-theme-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="add-theme-modal-header">
          <h3>新增主題</h3>
          <button
            className="add-theme-modal-close"
            onClick={handleCancel}
            disabled={isLoading}
          >
            ×
          </button>
        </div>
        
        <div className="add-theme-modal-card">
          <div className="add-theme-modal-left">
            <div className="add-theme-modal-field">
              <label>主題封面 <span className="required">*</span></label>
              {themeImage ? (
                <div className="add-theme-modal-image-container">
                  <img 
                    src={themeImage} 
                    alt="主題預覽" 
                    className="add-theme-modal-image" 
                  />
                  <div className="add-theme-modal-image-overlay">
                    <div className="add-theme-modal-change-icon">
                      <IoImagesSharp />
                      <span>更換圖片</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="add-theme-modal-image-input"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="add-theme-modal-image-placeholder">
                  <div className="add-theme-modal-upload-icon">
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
          
          <div className="add-theme-modal-right">
            <div className="add-theme-modal-field">
              <label>主題名稱 <span className="required">*</span></label>
              <input
                className="add-theme-modal-name-input"
                placeholder="輸入主題名稱"
                value={themeName}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isLoading}
                maxLength={50}
              />
            </div>
            
            <div className="add-theme-modal-field">
              <label>主題描述 <span className="required">*</span></label>
              <textarea
                className="add-theme-modal-description-input"
                placeholder="輸入主題描述"
                value={themeDesc}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isLoading}
                maxLength={200}
                rows={4}
              />
            </div>
          </div>
        </div>
        
        {error && (
          <div className="add-theme-modal-error">
            {error}
          </div>
        )}

        <div className="add-theme-modal-actions">
          <button
            className="add-theme-modal-save-btn"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? '新增中...' : '新增'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
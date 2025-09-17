import React, { useState, useEffect } from 'react';
import './styles/AddGameChapterModal.css';
import { IoImagesSharp } from "react-icons/io5";
import { useNotification } from '../../context/NotificationContext';
import { asyncPost } from '../../utils/fetch';
import { chapter_api } from '../../api/api';
import type { Chapter } from '../../interfaces/chapter';
import { createPortal } from "react-dom";

interface AddGameChapterModalProps {
  isOpen: boolean;
  existingChapters: Chapter[];
  onClose: () => void;
  onSave: (chapterData: Chapter) => void;
}

export const AddGameChapterModal: React.FC<AddGameChapterModalProps> = ({
  isOpen,
  existingChapters,
  onClose,
  onSave
}) => {
  const [chapterName, setChapterName] = useState("");
  const [trashRequirement, setWasteRequirement] = useState("");
  const [chapterImage, setChapterImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (isOpen) {
      setChapterName("");
      setWasteRequirement("");
      setChapterImage(null);
      setSelectedImageFile(null);
      setError('');
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    if (!chapterName.trim()) {
      setError('請輸入主題名稱');
      return false;
    }

    if (!trashRequirement.trim()) {
      setError('請輸入垃圾需求量');
      return false;
    }

    const lastRequirement = existingChapters[existingChapters.length - 1].trash_requirement;

    if (Number(trashRequirement.trim()) < lastRequirement) {
      setError(`需大於上一主題的垃圾需求量: ${lastRequirement}`);
      return false;
    }

    if (isNaN(Number(trashRequirement)) || Number(trashRequirement) <= 0) {
      setError('垃圾需求量必須為正數');
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
      
      formData.append('name', chapterName.trim());
      formData.append('trash_requirement', trashRequirement.trim());
      
      if (selectedImageFile) {
        formData.append('image', selectedImageFile);
      }

      const response = await asyncPost(chapter_api.add_chapter, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }, 
        body: formData
      });

      if (response.status === 200) {
        showSuccess('遊戲主題新增成功');

        const newChapter: Chapter = {
          _id: response.body._id,
          name: response.body.name,
          trash_requirement: response.body.trashRequirement,
          image: response.body.image
        };

        onSave(newChapter);
        onClose();
      } else {
        throw new Error('新增失敗');
      }
    } catch (err: any) {
      setError(`新增遊戲主題時發生錯誤: ${err}`);
      showError('新增遊戲主題時發生錯誤');
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
      reader.onloadend = () => setChapterImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    setChapterName("");
    setWasteRequirement("");
    setChapterImage(null);
    setSelectedImageFile(null);
    setError('');
    onClose();
  };

  const handleInputChange = (field: 'name' | 'trashRequirement', value: string) => {
    if (field === 'name') {
      setChapterName(value);
    } else {
      setWasteRequirement(value);
    }
    if (error) setError('');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="add-chapter-modal-overlay" onClick={handleCancel}>
      <div className="add-chapter-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="add-chapter-modal-header">
          <h3>新增遊戲主題</h3>
          <button
            className="add-chapter-modal-close"
            onClick={handleCancel}
            disabled={isLoading}
          >
            ×
          </button>
        </div>
        
        <div className="add-chapter-modal-card">
          <div className="add-chapter-modal-left">
            <div className="add-chapter-modal-field">
              <label>主題封面 <span className="required">*</span></label>
              {chapterImage ? (
                <div className="add-chapter-modal-image-container">
                  <img 
                    src={chapterImage} 
                    alt="主題預覽" 
                    className="add-chapter-modal-image" 
                  />
                  <div className="add-chapter-modal-image-overlay">
                    <div className="add-chapter-modal-change-icon">
                      <IoImagesSharp />
                      <span>更換圖片</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="add-chapter-modal-image-input"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="add-chapter-modal-image-placeholder">
                  <div className="add-chapter-modal-upload-icon">
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
          
          <div className="add-chapter-modal-right">
            <div className="add-chapter-modal-field">
              <label style={{textAlign: 'center', fontSize: '24px'}}>第{existingChapters.length + 1}章</label>
              <label>主題名稱 <span className="required">*</span></label>
              <input
                className="add-chapter-modal-name-input"
                placeholder="輸入主題名稱"
                value={chapterName}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isLoading}
                maxLength={50}
              />
            </div>
            
            <div className="add-chapter-modal-field">
              <label>垃圾需求量 <span className="required">*</span></label>
              <input
                className="add-chapter-modal-trash-input"
                type="number"
                placeholder="輸入垃圾需求量"
                value={trashRequirement}
                onChange={(e) => handleInputChange('trashRequirement', e.target.value)}
                disabled={isLoading}
                defaultValue={existingChapters[existingChapters.length - 1].trash_requirement + 1}
                min={existingChapters[existingChapters.length - 1].trash_requirement}
              />
            </div>
          </div>
        </div>
        
        {error && (
          <div className="add-chapter-modal-error">
            {error}
          </div>
        )}

        <div className="add-chapter-modal-actions">
          <button
            className="add-chapter-modal-save-btn"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? '新增中...' : '確定新增'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
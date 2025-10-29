import React, { useState, useEffect } from 'react';
import './styles/VoucherModal.css';
import { IoImagesSharp } from "react-icons/io5";
import { asyncPost, asyncPut, asyncDelete } from '../../utils/fetch';
import { voucher_api } from '../../api/api';
import { useNotification } from '../../context/NotificationContext';
import type { Voucher } from '../../interfaces/vocher';
import { createPortal } from "react-dom";

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voucher: Voucher) => void;
  onDelete?: (voucherId: string) => void;
  voucher?: Voucher | null;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  voucher = null
}) => {
  const isEditMode = !!voucher;
  
  const [formData, setFormData] = useState({
    _id: '',
    name: "",
    description: "",
    price: 0,
    quantity: 0,
    image: "",
  });

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && voucher) {
        setFormData({
          _id: voucher._id,
          name: voucher.name,
          description: voucher.description,
          price: voucher.price,
          quantity: voucher.quantity,
          image: voucher.image?.url || "",
        });
      } else {
        setFormData({
          _id: '',
          name: "",
          description: "",
          price: 0,
          quantity: 0,
          image: "",
        });
      }
      setSelectedImageFile(null);
      setError('');
    }
  }, [isOpen, voucher, isEditMode]);

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('請輸入電子票券名稱');
      return false;
    }

    if (!formData.description.trim()) {
      setError('請輸入電子注意事項');
      return false;
    }

    if (formData.price <= 0) {
      setError('狗狗幣必須大於0');
      return false;
    }

    if (isEditMode) {
      if (formData.quantity < 0) {
        setError('庫存數量不能為負數');
        return false;
      }
    } else {
      if (formData.quantity <= 0) {
        setError('庫存數量必須大於0');
        return false;
      }
    }

    if (!isEditMode && !selectedImageFile) {
      setError('請上傳電子票券圖片');
      return false;
    }

    return true;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('圖片大小不能超過5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('請選擇有效的圖片檔案');
        return;
      }

      setError('');
      setSelectedImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('quantity', formData.quantity.toString());
      
      if (selectedImageFile) {
        formDataToSend.append('image', selectedImageFile);
      }

      let response;
      if (isEditMode) {
        formDataToSend.append('voucher_type_id', formData._id);
        response = await asyncPut(voucher_api.update, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: formDataToSend
        });
      } else {
        response = await asyncPost(voucher_api.add, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: formDataToSend
        });
      }
      
      if (response.status === 200) {
        const savedVoucher: Voucher = {
          _id: response.body._id,
          name: response.body.name,
          description: response.body.description,
          price: response.body.price,
          quantity: response.body.quantity,
          image: response.body.image
        };

        onSave(savedVoucher);
        onClose();
        showSuccess(isEditMode ? "更新電子票券成功" : "新增電子票券成功");
      } else {
        showError(response.message || (isEditMode ? '更新失敗' : '新增電子票券失敗'));
      }
    } catch (error) {
      setError((isEditMode ? '更新' : '新增') + '電子票券時發生錯誤，請稍後再試');
      showError((isEditMode ? "更新" : "新增") + "電子票券發生錯誤");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !formData._id || !onDelete) return;

    if (window.confirm(`確定要刪除「${formData.name}」嗎？此操作無法復原。`)) {
      setIsLoading(true);
      try {
        const response = await asyncDelete(voucher_api.delete, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: {
            voucher_type_id: formData._id
          }
        });
        
        if (response.status === 200) {
          onDelete(formData._id);
          showSuccess('票券刪除成功');
          onClose();
        } else {
          showError(response.message || '刪除失敗');
        }
      } catch (error) {
        showError('刪除票券時發生錯誤');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      _id: '',
      name: "",
      description: "",
      price: 0,
      quantity: 0,
      image: "",
    });
    setSelectedImageFile(null);
    setError('');
    onClose();
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError('');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="voucher-modal-overlay" onClick={handleCancel}>
      <div className="voucher-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="voucher-modal-header">
          <h3>{isEditMode ? '編輯電子票券' : '新增電子票券'}</h3>
          <button
            className="voucher-modal-close"
            onClick={handleCancel}
            disabled={isLoading}
          >
            ×
          </button>
        </div>
        
        <div className="voucher-modal-card">
          <div className="voucher-modal-left">
            <div className="voucher-modal-field">
              <label>票券圖片 <span className="required">*</span></label>
              {formData.image ? (
                <div className="voucher-modal-image-container">
                  <img src={formData.image} alt="預覽" className="voucher-modal-image" />
                  <div className="voucher-modal-image-overlay">
                    <div className="voucher-modal-change-icon">
                      <IoImagesSharp />
                      <span>更換圖片</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="voucher-modal-image-input"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="voucher-modal-image-placeholder">
                  <div className="voucher-modal-upload-icon">
                    <IoImagesSharp />
                  </div>
                  <label>上傳票券圖片</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>
            
            {isEditMode && (
              <button
                className="voucher-modal-delete-btn"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? '刪除中...' : '刪除票券'}
              </button>
            )}
          </div>
          
          <div className="voucher-modal-right">
            <div className="voucher-modal-field">
              <label>票券名稱 <span className="required">*</span></label>
              <input
                className="voucher-modal-input"
                placeholder="輸入票券名稱"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isLoading}
                maxLength={100}
              />
            </div>

            <div className="voucher-modal-field">
              <label>注意事項 <span className="required">*</span></label>
              <textarea
                className="voucher-modal-textarea"
                placeholder="輸入注意事項"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isLoading}
                maxLength={1000}
                rows={4}
              />
            </div>

            <div className="voucher-modal-row">
              <div className="voucher-modal-field">
                <label>狗狗幣 <span className="required">*</span></label>
                <input
                  className="voucher-modal-input"
                  type="number"
                  placeholder="輸入狗狗幣"
                  min="1"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', Number(e.target.value))}
                  disabled={isLoading}
                />
              </div>

              <div className="voucher-modal-field">
                <label>庫存數量 <span className="required">*</span></label>
                <input
                  className="voucher-modal-input"
                  type="number"
                  placeholder="輸入數量"
                  min={isEditMode ? "0" : "1"}
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="voucher-modal-error">
            {error}
          </div>
        )}

        <div className="voucher-modal-actions">
          <button 
            className="voucher-modal-save-btn" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (isEditMode ? '更新中...' : '新增中...') : (isEditMode ? '儲存' : '新增票券')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
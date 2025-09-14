import React, { useState, useEffect } from 'react';
import './styles/EditVoucherModal.css';
import { IoImagesSharp } from "react-icons/io5";
import { asyncPut, asyncDelete } from '../../utils/fetch';
import { voucher_api } from '../../api/api';
import { useNotification } from '../../context/NotificationContext';
import type { Voucher } from '../../interfaces/vocher';

interface EditVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voucher: Voucher) => void;
  onDelete: (voucherId: string) => void;
  voucher: Voucher | null;
}

export const EditVoucherModal: React.FC<EditVoucherModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  voucher
}) => {
  const [editVoucher, setEditVoucher] = useState<Voucher>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    if (isOpen && voucher) {
      setEditVoucher({ ...voucher });
      setSelectedImageFile(null);
      setError('');
    }
  }, [isOpen, voucher]);

  const validateForm = (): boolean => {
    if (!editVoucher) return false;

    if (!editVoucher.name.trim()) {
      setError('請輸入票券名稱');
      return false;
    }

    if (!editVoucher.description.trim()) {
      setError('請輸入注意事項');
      return false;
    }

    if (editVoucher.price <= 0) {
      setError('狗狗幣必須大於0');
      return false;
    }

    if (editVoucher.quantity < 0) {
      setError('庫存數量不能為負數');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!editVoucher || !validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      
      formData.append('voucher_type_id', editVoucher._id);
      formData.append('name', editVoucher.name);
      formData.append('description', editVoucher.description);
      formData.append('price', editVoucher.price.toString());
      formData.append('quantity', editVoucher.quantity.toString());

      if (selectedImageFile) {
        formData.append('image', selectedImageFile);
      }

      const response = await asyncPut(voucher_api.update, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (response.status === 200) {
        onSave(editVoucher);
        showSuccess("更新電子票券成功");
        onClose();
      } else {
        showError(response.message || '更新失敗');
      }
    } catch (error) {
      showError('更新電子票券時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editVoucher) return;

    if (window.confirm(`確定要刪除「${editVoucher.name}」嗎？此操作無法復原。`)) {
      setIsLoading(true);
      try {
        const response = await asyncDelete(voucher_api.delete, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: {
            voucher_type_id: editVoucher._id
          }
        });
        
        if (response.status === 200) {
          onDelete(editVoucher._id);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editVoucher) {
      if (file.size > 5 * 1024 * 1024) {
        setError('圖片大小不能超過5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('請選擇有效的圖片檔案');
        return;
      }

      setSelectedImageFile(file);
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditVoucher({
          ...editVoucher,
          image: {
            public_id: editVoucher.image?.public_id || '',
            url: reader.result as string
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    if (voucher) {
      setEditVoucher({ ...voucher });
      setSelectedImageFile(null);
    }
    setError('');
    onClose();
  };

  if (!isOpen || !editVoucher) return null;

  return (
    <div className="edit-voucher-modal-overlay" onClick={handleCancel}>
      <div className="edit-voucher-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="edit-voucher-modal-header">
          <h3>編輯電子票券</h3>
          <button
            className="edit-voucher-modal-close"
            onClick={handleCancel}
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className="edit-voucher-modal-card">
          <div className="edit-voucher-modal-left">
            <div className="edit-voucher-modal-field">
              <label>票券圖片 <span className="required">*</span></label>
              {editVoucher.image?.url && (
                <div className="edit-voucher-modal-image-container">
                  <img 
                    src={editVoucher.image.url} 
                    alt="預覽" 
                    className="edit-voucher-modal-image" 
                  />
                  <div className="edit-voucher-modal-image-overlay">
                    <div className="edit-voucher-modal-change-icon">
                      <IoImagesSharp />
                      <span>更換圖片</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="edit-voucher-modal-image-input"
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>
            <button
              className="edit-voucher-modal-delete-btn"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? '刪除中...' : '刪除票券'}
            </button>
          </div>
          
          <div className="edit-voucher-modal-right">
            <div className="edit-voucher-modal-field">
              <label>票券名稱 <span className="required">*</span></label>
              <input
                className="edit-voucher-modal-input"
                placeholder="輸入票券名稱"
                value={editVoucher.name}
                onChange={(e) => {
                  setEditVoucher({ 
                    ...editVoucher, 
                    name: e.target.value 
                  });
                  if (error) setError('');
                }}
                disabled={isLoading}
                maxLength={100}
              />
            </div>
            
            <div className="edit-voucher-modal-field">
              <label>注意事項 <span className="required">*</span></label>
              <textarea
                className="edit-voucher-modal-textarea"
                placeholder="輸入注意事項"
                value={editVoucher.description}
                onChange={(e) => {
                  setEditVoucher({ 
                    ...editVoucher, 
                    description: e.target.value 
                  });
                  if (error) setError('');
                }}
                disabled={isLoading}
                maxLength={1000}
                rows={4}
              />
            </div>
            
            <div className="edit-voucher-modal-row">
              <div className="edit-voucher-modal-field">
                <label>狗狗幣 <span className="required">*</span></label>
                <input
                  className="edit-voucher-modal-input"
                  type="number"
                  placeholder="輸入狗狗幣"
                  min="1"
                  value={editVoucher.price}
                  onChange={(e) => {
                    setEditVoucher({ 
                      ...editVoucher, 
                      price: Number(e.target.value) 
                    });
                    if (error) setError('');
                  }}
                  disabled={isLoading}
                />
              </div>

              <div className="edit-voucher-modal-field">
                <label>庫存數量 <span className="required">*</span></label>
                <input
                  className="edit-voucher-modal-input"
                  type="number"
                  placeholder="輸入數量"
                  min="0"
                  value={editVoucher.quantity}
                  onChange={(e) => {
                    setEditVoucher({ 
                      ...editVoucher, 
                      quantity: Number(e.target.value) 
                    });
                    if (error) setError('');
                  }}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="edit-voucher-modal-error">
            {error}
          </div>
        )}

        <div className="edit-voucher-modal-actions">
          <button
            className="edit-voucher-modal-save-btn"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? '更新中...' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  );
};
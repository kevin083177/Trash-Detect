import React, { useState, useEffect } from "react";
import "./styles/AddVoucherModal.css";
import { IoImagesSharp } from "react-icons/io5";
import { asyncPost } from "../../utils/fetch";
import { voucher_api } from "../../api/api";
import { useNotification } from "../../context/NotificationContext";
import type { Voucher } from "../../interfaces/vocher";
import { createPortal } from "react-dom";

interface AddVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voucher: Voucher) => void;
}

export const AddVoucherModal: React.FC<AddVoucherModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
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
      setFormData({
        name: "",
        description: "",
        price: 0,
        quantity: 0,
        image: "",
      });
      setSelectedImageFile(null);
      setError('');
    }
  }, [isOpen]);

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

    if (formData.quantity <= 0) {
      setError('庫存數量必須大於0');
      return false;
    }

    if (!selectedImageFile) {
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
      formDataToSend.append('image', selectedImageFile!);
      
      const response = await asyncPost(voucher_api.add, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });
      
      if (response.status === 200) {
        const newVoucher: Voucher = {
          _id: response.body._id,
          name: response.body.name,
          description: response.body.description,
          price: response.body.price,
          quantity: response.body.quantity,
          image: response.body.image
        };

        onSave(newVoucher);
        onClose();
        showSuccess("新增電子票券成功");
      } else {
        showError(response.message || '新增電子票券失敗');
      }
    } catch (error) {
      setError('新增電子票券時發生錯誤，請稍後再試');
      showError("新增電子票券發生錯誤");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
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
    <div className="add-voucher-modal-overlay" onClick={handleCancel}>
      <div className="add-voucher-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="add-voucher-modal-header">
          <h3>新增電子票券</h3>
          <button
            className="add-voucher-modal-close"
            onClick={handleCancel}
            disabled={isLoading}
          >
            ×
          </button>
        </div>
        
        <div className="add-voucher-modal-card">
          <div className="add-voucher-modal-left">
            <div className="add-voucher-modal-field">
              <label>票券圖片 <span className="required">*</span></label>
              {formData.image ? (
                <div className="add-voucher-modal-image-container">
                  <img src={formData.image} alt="預覽" className="add-voucher-modal-image" />
                  <div className="add-voucher-modal-image-overlay">
                    <div className="add-voucher-modal-change-icon">
                      <IoImagesSharp />
                      <span>更換圖片</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="add-voucher-modal-image-input"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="add-voucher-modal-image-placeholder">
                  <div className="add-voucher-modal-upload-icon">
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
          </div>
          
          <div className="add-voucher-modal-right">
            <div className="add-voucher-modal-field">
              <label>票券名稱 <span className="required">*</span></label>
              <input
                className="add-voucher-modal-input"
                placeholder="輸入票券名稱"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isLoading}
                maxLength={100}
              />
            </div>

            <div className="add-voucher-modal-field">
              <label>注意事項 <span className="required">*</span></label>
              <textarea
                className="add-voucher-modal-textarea"
                placeholder="輸入注意事項"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isLoading}
                maxLength={1000}
                rows={4}
              />
            </div>

            <div className="add-voucher-modal-row">
              <div className="add-voucher-modal-field">
                <label>狗狗幣 <span className="required">*</span></label>
                <input
                  className="add-voucher-modal-input"
                  type="number"
                  placeholder="輸入狗狗幣"
                  min="1"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', Number(e.target.value))}
                  disabled={isLoading}
                />
              </div>

              <div className="add-voucher-modal-field">
                <label>庫存數量 <span className="required">*</span></label>
                <input
                  className="add-voucher-modal-input"
                  type="number"
                  placeholder="輸入數量"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="add-voucher-modal-error">
            {error}
          </div>
        )}

        <div className="add-voucher-modal-actions">
          <button 
            className="add-voucher-modal-save-btn" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? '新增中...' : '新增票券'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
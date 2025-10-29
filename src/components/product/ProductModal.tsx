import React, { useState, useEffect } from 'react';
import './styles/ProductModal.css';
import { PRODUCT_TYPE_LABELS, type Product, type ProductType } from '../../interfaces/product';
import { IoImagesSharp } from "react-icons/io5";
import { asyncPost, asyncPut } from '../../utils/fetch';
import { product_api } from '../../api/api';
import { useNotification } from '../../context/NotificationContext';
import { createPortal } from "react-dom";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  themeName: string;
  existingProducts?: Product[];
  product?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  themeName,
  existingProducts = [],
  product = null
}) => {
  const isEditMode = !!product;
  
  const [formData, setFormData] = useState({
    _id: '',
    name: "",
    price: 0,
    theme: themeName,
    type: "",
    description: "",
    image: "",
  });

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && product) {
        setFormData({
          _id: product._id,
          name: product.name,
          price: product.price,
          theme: product.theme || themeName,
          type: product.type,
          description: product.description,
          image: product.image?.url || "",
        });
      } else {
        setFormData({
          _id: '',
          name: "",
          price: 0,
          theme: themeName,
          type: "",
          description: "",
          image: "",
        });
      }
      setSelectedImageFile(null);
      setError('');
    }
  }, [isOpen, product, isEditMode, themeName]);

  const getAvailableProductTypeOptions = () => {
    const allTypes = Object.keys(PRODUCT_TYPE_LABELS) as ProductType[];
    const safeExistingProducts = Array.isArray(existingProducts) ? existingProducts : [];
    const existingTypes = safeExistingProducts
      .filter(p => p._id !== formData._id)
      .map(p => p?.type)
      .filter(type => type && type.trim() !== '');
    
    const availableTypes = allTypes.filter(type => !existingTypes.includes(type));
    
    if (availableTypes.length === 0) {
      return [
        { value: '', label: '無可用類別' }
      ];
    }
    
    return [
      { value: '', label: '請選擇商品類別' },
      ...availableTypes.map(type => ({
        value: type,
        label: PRODUCT_TYPE_LABELS[type]
      }))
    ];
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('請輸入商品名稱');
      return false;
    }

    if (!formData.description.trim()) {
      setError('請輸入商品介紹');
      return false;
    }

    if (!formData.type) {
      setError('請選擇商品類別');
      return false;
    }

    if (formData.price <= 0) {
      setError('狗狗幣必須大於0');
      return false;
    }

    if (!isEditMode && !selectedImageFile) {
      setError('請上傳商品圖片');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      formDataToSend.append('theme', themeName);
      formDataToSend.append('type', formData.type);
      
      if (selectedImageFile) {
        formDataToSend.append('image', selectedImageFile);
      }

      let response;
      if (isEditMode) {
        formDataToSend.append('product_id', formData._id);
        response = await asyncPut(product_api.update, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: formDataToSend
        });
      } else {
        response = await asyncPost(product_api.add, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: formDataToSend
        });
      }
      
      if (response.status === 200) {
        const savedProduct: Product = {
          _id: response.body._id,
          name: response.body.name,
          description: response.body.description,
          price: response.body.price,
          type: response.body.type,
          theme: response.body.theme,
          image: response.body.image
        };

        onSave(savedProduct);
        onClose();
        showSuccess(isEditMode ? "更新商品成功" : "新增商品成功");
      } else {
        showError(response.message || (isEditMode ? '更新商品失敗' : '新增商品失敗'));
      }
    } catch (error) {
      setError((isEditMode ? '更新' : '新增') + '商品時發生錯誤，請稍後再試');
      showError((isEditMode ? "更新" : "新增") + "商品發生錯誤");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      _id: '',
      name: "",
      price: 0,
      theme: themeName,
      type: "",
      description: "",
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

  const availableTypeOptions = getAvailableProductTypeOptions();

  return createPortal(
    <div className="product-modal-overlay" onClick={handleCancel}>
      <div className="product-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="product-modal-header">
          <h3>{isEditMode ? '編輯商品' : '新增商品'}</h3>
          <button
            className="product-modal-close"
            onClick={handleCancel}
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-modal-card">
          <div className="product-modal-left">
            <div className="product-modal-field">
              <label>商品照片 <span className="required">*</span></label>
              {formData.image ? (
                <div className="product-modal-image-container">
                  <img src={formData.image} alt="預覽" className="product-modal-image" />
                  <div className="product-modal-image-overlay">
                    <div className="product-modal-change-icon">
                      <IoImagesSharp />
                      <span>更換圖片</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="product-modal-image-input"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="product-modal-image-placeholder">
                  <div className="product-modal-upload-icon">
                    <IoImagesSharp />
                  </div>
                  <label>上傳商品圖片</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>

            <div className="product-modal-field">
              <label>商品類別 <span className="required">*</span></label>
              <select
                className="product-modal-select"
                value={formData.type}
                onChange={e => handleInputChange('type', e.target.value)}
                disabled={isLoading}
                required
              >
                {availableTypeOptions.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="product-modal-right">
            <div className="product-modal-field">
              <label>商品名稱 <span className="required">*</span></label>
              <input
                type="text"
                className="product-modal-input"
                placeholder="輸入商品名稱"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="product-modal-field">
              <label>商品介紹 <span className="required">*</span></label>
              <textarea
                className="product-modal-textarea"
                placeholder="輸入商品介紹"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="product-modal-field">
              <label>狗狗幣 <span className="required">*</span></label>
              <input
                type="number"
                className="product-modal-input"
                placeholder="輸入狗狗幣"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                disabled={isLoading}
                required
              />
            </div>
          </div>
        </form>

        {error && (
          <div className="product-modal-error">
            {error}
          </div>
        )}

        <div className="product-modal-actions">
          <button
            type="submit"
            className="product-modal-save-btn"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (isEditMode ? '更新中...' : '新增中...') : (isEditMode ? '更新商品' : '新增商品')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
import React, { useState } from "react";
import './styles/AddProductModal.css';
import { PRODUCT_TYPE_LABELS, type Product, type ProductType } from '../../interfaces/product';
import { IoImagesSharp } from "react-icons/io5";
import { asyncPost } from "../../utils/fetch";
import { product_api } from "../../api/api";
import { useNotification } from "../../context/NotificationContext";
import { createPortal } from "react-dom";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  themeName: string;
  existingProducts?: Product[];
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  themeName,
  existingProducts = []
}) => {
  const [formData, setFormData] = useState({
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

  const getAvailableProductTypeOptions = () => {
    const allTypes = Object.keys(PRODUCT_TYPE_LABELS) as ProductType[];
    const safeExistingProducts = Array.isArray(existingProducts) ? existingProducts : [];
    const existingTypes = safeExistingProducts
      .map(p => p?.type)
      .filter(type => type && type.trim() !== '');
    
    const availableTypes = allTypes.filter(type => !existingTypes.includes(type));
    
    if (availableTypes.length === 0) {
      return [
        { value: '', label: '無' }
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

    const existingTypes = existingProducts.map(p => p.type);
    if (existingTypes.includes(formData.type as ProductType)) {
      setError('此商品類別已存在，請選擇其他類別');
      return false;
    }

    if (formData.price <= 0) {
      setError('狗狗幣必須大於0');
      return false;
    }

    if (!selectedImageFile) {
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!selectedImageFile) {
      setError('請上傳商品圖片');
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
      formDataToSend.append('image', selectedImageFile);
      formDataToSend.append('type', formData.type);
      
      const response = await asyncPost(product_api.add, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });
      
      if (response.status === 200) {
        const newProduct: Product = {
          _id: response.body._id,
          name: response.body.name,
          description: response.body.description,
          price: response.body.price,
          type: response.body.type,
          theme: response.body.theme,
          image: response.body.image
        };

        onSave(newProduct);
        
        setFormData({
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
        showSuccess("新增商品成功");
      } else {
        showError(response.message || '新增商品失敗');
      }
    } catch (error) {
      setError('新增商品時發生錯誤，請稍後再試');
      showError("新增商品發生錯誤");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
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
    <div className="add-product-modal-overlay" onClick={handleCancel}>
      <div className="add-product-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="add-product-modal-header">
          <h3>新增商品</h3>
          <button
            className="add-product-modal-close"
            onClick={handleCancel}
            disabled={isLoading}
          >
            ×
          </button>
        </div>
        
        <div className="add-product-modal-card">
          <div className="add-product-modal-left">
            <div className="add-product-modal-field">
              <label>商品照片 <span className="required">*</span></label>
              {formData.image ? (
                <div className="add-product-modal-image-container">
                  <img src={formData.image} alt="預覽" className="add-product-modal-image" />
                  <div className="add-product-modal-image-overlay">
                    <div className="add-product-modal-change-icon">
                      <IoImagesSharp />
                      <span>更換圖片</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="add-product-modal-image-input"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="add-product-modal-image-placeholder">
                  <div className="add-product-modal-upload-icon">
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

            <div className="add-product-modal-field">
              <label>商品類別 <span className="required">*</span></label>
              <select
                className="add-product-modal-select"
                value={formData.type}
                onChange={e => handleInputChange('type', e.target.value)}
                disabled={isLoading}
              >
                {availableTypeOptions.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="add-product-modal-right">
            <div className="add-product-modal-field">
              <label>商品名稱 <span className="required">*</span></label>
              <input
                className="add-product-modal-input"
                placeholder="輸入商品名稱"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="add-product-modal-field">
              <label>商品介紹 <span className="required">*</span></label>
              <textarea
                className="add-product-modal-textarea"
                placeholder="輸入商品介紹"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="add-product-modal-field">
              <div className="add-product-modal-price-container">
                <div className="add-product-modal-price-label-container">
                  <label>狗狗幣 <span className="required">*</span></label>
                </div>
              </div>
              <input
                className="add-product-modal-price-input"
                placeholder="輸入狗狗幣"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
        
        {error && (
          <div className="add-product-modal-error">
            {error}
          </div>
        )}

        <div className="add-product-modal-actions">
          <button 
            className="add-product-modal-save-btn" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? '新增中...' : '新增商品'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
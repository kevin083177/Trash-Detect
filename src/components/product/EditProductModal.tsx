import React, { useState, useEffect } from 'react';
import './styles/EditProductModal.css';
import { PRODUCT_TYPE_LABELS, type Product, type ProductType } from '../../interfaces/product';
import { IoImagesSharp } from "react-icons/io5";
import { asyncPut } from '../../utils/fetch';
import { product_api } from '../../api/api';
import { useNotification } from '../../context/NotificationContext';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product: Product | null;
  existingProducts?: Product[];
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  existingProducts = []
}) => {
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const { showError, showSuccess } = useNotification();

  const getAvailableProductTypeOptions = () => {
    const allTypes = Object.keys(PRODUCT_TYPE_LABELS) as ProductType[];
    
    const existingTypes = existingProducts
      .filter(p => p._id !== editProduct?._id)
      .map(p => p.type);
    
    const availableTypes = allTypes.filter(type => !existingTypes.includes(type));
    
    return [
      { value: '', label: '請選擇類別' },
      ...availableTypes.map(type => ({
        value: type,
        label: PRODUCT_TYPE_LABELS[type]
      }))
    ];
  };

  useEffect(() => {
    if (isOpen && product) {
      setEditProduct({ ...product });
      setSelectedImageFile(null);
      setError('');
    }
  }, [isOpen, product]);

  const validateForm = (): boolean => {
    if (!editProduct) return false;

    if (!editProduct.name.trim()) {
      setError('請輸入商品名稱');
      return false;
    }

    if (!editProduct.description.trim()) {
      setError('請輸入商品介紹');
      return false;
    }

    if (!editProduct.type) {
      setError('請選擇商品類別');
      return false;
    }

    if (editProduct.price <= 0) {
      setError('狗狗幣必須大於0');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!editProduct || !validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const productId = editProduct._id;
      if (!productId) {
        showError('找不到產品 ID');
      }

      const formData = new FormData();
      
      formData.append('product_id', productId);
      formData.append('description', editProduct.description);
      formData.append('price', editProduct.price.toString());
      formData.append('type', editProduct.type);

      if (selectedImageFile) {
        formData.append('image', selectedImageFile);
      }

      const response = await asyncPut(product_api.update, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (response.status === 200) {
        onSave(editProduct);
        showSuccess("更新商品成功");
        onClose();
      } else {
        showError(response.message);
      }
    } catch (error) {
      showError(error as string);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editProduct) {
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
        setEditProduct({
          ...editProduct,
          image: {
            public_id: editProduct.image?.public_id || '',
            url: reader.result as string
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTypeChange = (newType: string) => {
    if (!editProduct) return;

    setError('');
    setEditProduct({ 
      ...editProduct, 
      type: newType as Product["type"] 
    });
  };

  if (!isOpen || !editProduct) return null;

  const availableTypeOptions = getAvailableProductTypeOptions();

  return (
    <div className="edit-product-modal-overlay" onClick={onClose}>
      <div className="edit-product-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="edit-product-modal-header">
          <h3>編輯商品</h3>
          <button
            className="edit-product-modal-close"
            onClick={onClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className="edit-product-modal-card">
          <div className="edit-product-modal-left">
            <div className="edit-product-modal-field">
              <label>商品照片 <span className="required">*</span></label>
              {editProduct.image.url && (
                <div className="edit-product-modal-image-container">
                  <img 
                    src={editProduct.image.url} 
                    alt="預覽" 
                    className="edit-product-modal-image" 
                  />
                  <div className="edit-product-modal-image-overlay">
                    <div className="edit-product-modal-change-icon">
                      <IoImagesSharp />
                      <span>更換圖片</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="edit-product-modal-image-input"
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>
            
            <div className="edit-product-modal-field">
              <label>商品類別 <span className="required">*</span></label>
              <select
                className="edit-product-modal-select"
                value={editProduct.type}
                onChange={e => handleTypeChange(e.target.value)}
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
          
          <div className="edit-product-modal-right">
            <div className="edit-product-modal-field">
              <label>商品名稱 <span className="required">*</span></label>
              <input
                className="edit-product-modal-input"
                placeholder="輸入商品名稱"
                value={editProduct.name}
                onChange={(e) => {
                  setEditProduct({ 
                    ...editProduct, 
                    name: e.target.value 
                  });
                  if (error) setError('');
                }}
                disabled={isLoading}
              />
            </div>
            
            <div className="edit-product-modal-field">
              <label>商品介紹 <span className="required">*</span></label>
              <textarea
                className="edit-product-modal-textarea"
                placeholder="輸入商品介紹"
                value={editProduct.description}
                onChange={(e) => {
                  setEditProduct({ 
                    ...editProduct, 
                    description: e.target.value 
                  });
                  if (error) setError('');
                }}
                disabled={isLoading}
              />
            </div>
            
            <div className="edit-product-modal-field">
              <label>狗狗幣 <span className="required">*</span></label>
              <input
                className="edit-product-modal-price-input"
                type="number"
                placeholder="輸入狗狗幣"
                min="0"
                value={editProduct.price}
                onChange={(e) => {
                  setEditProduct({ 
                    ...editProduct, 
                    price: Number(e.target.value) 
                  });
                  if (error) setError('');
                }}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
        
        {error && (
          <div className="edit-product-modal-error">
            {error}
          </div>
        )}

        <div className="edit-product-modal-actions">
          <button
            className="edit-product-modal-save-btn"
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
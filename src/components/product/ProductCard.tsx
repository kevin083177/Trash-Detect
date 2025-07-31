import React from 'react';
import './styles/ProductCard.css';

interface ProductCardProps {
  name: string;
  description: string;
  price: number;
  type: string;
  image: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

function translateType(type: string): string {
  const typeMap: Record<string, string> = {
    bookshelf: '書櫃',
    box: '對話框',
    calendar: '日曆',
    carpet: '地毯',
    lamp: '燈具',
    pendant: '吊飾',
    table: '桌子',
    wallpaper: '背景'
  };

  return typeMap[type];
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  description,
  price,
  type,
  image,
  onEdit,
  onDelete
}) => {
  return (
    <div className="product-card">

        {/* 卡片上方 */}
        <div className="product-card-header">
          <div className="product-card-actions">
            {onEdit && (
              <button
                className="product-card-action-btn edit-btn"
                onClick={onEdit}
                title="編輯"
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                className="product-card-action-btn delete-btn"
                onClick={onDelete}
                title="刪除"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
        <div className="product-card-container-grid">
          {/* 左側圖片區域 */}
          <div className="product-card-image-section">
            <div className="product-card-image-wrapper">
              <img
                src={image}
                alt={name}
                className="product-card-image"
              />
            </div>
            <span className="product-card-info-label">{translateType(type)}</span>
          </div>

          {/* 右側資訊區域 */}
          <div className="product-card-info-section">
            <div className="product-card-name">{name}</div>
            <div className="product-card-description">
              {description}
            </div>
            <div className="product-card-price">
              ${price}
            </div>
          </div>
        </div>

    </div>
  );
};
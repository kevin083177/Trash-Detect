import React from 'react';
import './styles/ProductCard.css';
import { FaTrashAlt } from "react-icons/fa";
import { PRODUCT_TYPE_LABELS, type ProductType } from '../../interfaces/product';

interface ProductCardProps {
  name: string;
  description: string;
  price: number;
  type: ProductType;
  image: string;
  onEdit?: () => void;
  onDelete?: () => void;
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
  
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.delete-btn')) {
      return;
    }
    onEdit?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEdit?.();
    }
  };

  return (
    <div 
      className="product-card" 
      onClick={handleCardClick}
      onKeyDown={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label={`編輯產品 ${name}`}
    >
      <div className="product-card-header">
        <div className="product-card-actions">
          {onDelete && (
            <button
              className="product-card-action-btn delete-btn"
              onClick={handleDeleteClick}
              title="刪除"
              aria-label={`刪除產品 ${name}`}
            >
              <FaTrashAlt color='#ea4888'/>
            </button>
          )}
        </div>
      </div>
      <div className="product-card-container-grid">
        <div className="product-card-image-section">
          <div className="product-card-image-wrapper">
            <img
              src={image}
              alt={name}
              className="product-card-image"
            />
          </div>
          <span className="product-card-info-label">{PRODUCT_TYPE_LABELS[type]}</span>
        </div>

        <div className="product-card-info-section">
          <div className="product-card-name">{name}</div>
          <div className="product-card-description">
            {description}
          </div>
          <div className="product-card-price">
            <img
              src="coin.png"
              alt='coin'
              className='product-card-price-image'
            />
            <p>{price}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
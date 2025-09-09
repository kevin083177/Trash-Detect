import React from "react";
import "./styles/VoucherCard.css";
import type { Voucher } from "../../interfaces/vocher";
import { MdModeEdit } from "react-icons/md";

interface VoucherCardProps {
  voucher: Voucher;
  onEdit: () => void;
}

export const VoucherCard: React.FC<VoucherCardProps> = ({
  voucher,
  onEdit
}) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString("zh-TW");
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  return (
    <div className="voucher-card">
      <div className="voucher-card-image-container">
        <img 
          src={voucher.image.url} 
          alt={voucher.name}
          className="voucher-card-image"
        />
        <button 
          onClick={handleEdit}
          className="voucher-card-overlay"
        >
          <MdModeEdit size={24} color="white"/>
          <label>編輯票券</label>
        </button>
      </div>
      
      <div className="voucher-card-content">
        <h3 className="voucher-card-name">{voucher.name}</h3>
        
        <div className="voucher-card-info">
          <div className="voucher-card-price">
            <span className="voucher-price-label-container">
              <img
                src="coin.png"
                alt="coin"
                className="voucher-price-label-image"
              />
              <div className="voucher-price-label">狗狗幣</div>
            </span>
            <span className="voucher-price-value">{formatPrice(voucher.price)}</span>
          </div>
          
          <div className="voucher-card-quantity">
            <span className="voucher-quantity-label">剩餘庫存</span>
            <span className={`voucher-quantity-value ${voucher.quantity <= 10 ? 'low-stock' : ''}`}>
              {voucher.quantity} 個
            </span>
          </div>
        </div>

        <p className="voucher-card-description">
          {voucher.description.length > 100 
            ? `${voucher.description.substring(0, 100)}...` 
            : voucher.description}
        </p>
      </div>
    </div>
  );
};
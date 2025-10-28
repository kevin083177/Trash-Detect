import React, { useState } from 'react';
import { RECYCLABLE_CATEGORIES, type Station, type StationType } from '../../interfaces/station';
import './styles/StationModal.css';
import { IoLocationSharp } from "react-icons/io5";
import { createPortal } from "react-dom";

interface StationModalProps {
  station?: Station;
  stationTypes: StationType[];
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const StationModal: React.FC<StationModalProps> = ({ 
  station, 
  stationTypes, 
  onClose, 
  onSubmit 
}) => {
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    station_id: station?._id || '',
    name: station?.name || '',
    latitude: station?.latitude || 25.0330,
    longitude: station?.longitude || 121.5654,
    address: station?.address || '',
    station_type: station?.station_type.name || '',
    category: station?.category || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');

    if (!formData.name || formData.name.trim() === '') {
      setError('請輸入站點名稱');
      return;
    }

    if (!formData.address || formData.address.trim() === '') {
      setError('請輸入站點地址');
      return;
    }

    if (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90) {
      setError('請輸入有效的緯度( -90 到 90 之間 )');
      return;
    }

    if (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180) {
      setError('請輸入有效的經度( -180 到 180 之間 )');
      return;
    }

    if (!formData.station_type || formData.station_type.trim() === '') {
      setError('請選擇站點類型');
      return;
    }

    if (!Array.isArray(formData.category) || formData.category.length === 0) {
      setError('請至少選擇一個可回收類別');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCategoryToggle = (categoryValue: string) => {
    const currentCategories = Array.isArray(formData.category) ? formData.category : [];
    const updatedCategories = currentCategories.includes(categoryValue)
      ? currentCategories.filter(c => c !== categoryValue)
      : [...currentCategories, categoryValue];
    
    setFormData({ ...formData, category: updatedCategories });
    if (error) setError('');
  };

  const handleCancel = () => {
    onClose();
  };

  const getStationTypeImage = () => {
    const selectedType = stationTypes.find(type => type.name === formData.station_type);
    return selectedType?.image || '';
  };

  const stationImage = getStationTypeImage();

  return createPortal(
    <div className="station-modal-overlay" onClick={handleCancel}>
      <div className="station-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="station-modal-header">
          <h3>{station ? '編輯站點' : '新增站點'}</h3>
          <button
            className="station-modal-close"
            onClick={handleCancel}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="station-modal-card">
          <div className="station-modal-left">
            <div className="station-modal-field">
              <label>站點類型圖片</label>
              {stationImage ? (
                <div className="station-modal-image-container">
                  <img src={stationImage.url} alt="站點類型" className="station-modal-image" />
                </div>
              ) : (
                <div className="station-modal-image-placeholder">
                  <div className="station-modal-upload-icon">
                    <IoLocationSharp />
                  </div>
                  <label>請選擇站點類型</label>
                </div>
              )}
            </div>

            <div className="station-modal-field">
              <label>站點類型 <span className="required">*</span></label>
              <select
                className="station-modal-select"
                value={formData.station_type}
                onChange={e => handleInputChange('station_type', e.target.value)}
                required
              >
                <option value="">請選擇類型</option>
                {stationTypes.map((type) => (
                  <option key={type.name} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="station-modal-right">
            <div className="station-modal-field">
              <label>名稱 <span className="required">*</span></label>
              <input
                type="text"
                className="station-modal-input"
                placeholder="輸入站點名稱"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div className="station-modal-field">
              <label>地址 <span className="required">*</span></label>
              <input
                type="text"
                className="station-modal-input"
                placeholder="輸入站點地址"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
              />
            </div>

            <div className="station-modal-coordinates">
              <div className="station-modal-field">
                <label>緯度 <span className="required">*</span></label>
                <input
                  type="number"
                  step="0.000001"
                  className="station-modal-input"
                  placeholder="輸入緯度"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value))}
                  required
                />
              </div>
              <div className="station-modal-field">
                <label>經度 <span className="required">*</span></label>
                <input
                  type="number"
                  step="0.000001"
                  className="station-modal-input"
                  placeholder="輸入經度"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="station-modal-field">
              <label>可回收類別 <span className="required">*</span></label>
              <div className="station-modal-categories-grid">
               {RECYCLABLE_CATEGORIES.map((category) => (
                <label key={category.value} className="station-modal-category-item">
                  <input
                    type="checkbox"
                    checked={Array.isArray(formData.category) && formData.category.includes(category.value)}
                    onChange={() => handleCategoryToggle(category.value)}
                    className="station-modal-checkbox"
                  />
                  <span className="station-modal-category-label">{category.label}</span>
                </label>
              ))}
              </div>
            </div>
          </div>
        </form>
        {error && (
          <div className="station-modal-error">
            {error}
          </div>
        )}
        <div className="station-modal-actions">
          <button
            type="submit"
            className="station-modal-save-btn"
            onClick={handleSubmit}
          >
            {station ? '更新站點' : '新增站點'}
          </button>
        </div>
        
      </div>
      
    </div>,
    document.body
  );
};
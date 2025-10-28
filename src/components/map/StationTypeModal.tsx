import React, { useState } from 'react';
import type { StationType } from '../../interfaces/station';
import './styles/StationTypeModal.css';
import { FaPlus, FaArrowLeftLong, FaImage, FaTrash, FaPencil } from 'react-icons/fa6';
import { createPortal } from 'react-dom';
import { asyncPost, asyncPut } from '../../utils/fetch';
import { station_api } from '../../api/api';
import { useNotification } from '../../context/NotificationContext';

interface StationTypeModalProps {
  stationTypes: StationType[];
  onClose: () => void;
  onAddType: (typeData: { name: string; description: string; image_url: string }) => Promise<boolean>;
  onDeleteType: (typeName: string, typeId: string) => Promise<boolean>;
}

export const StationTypeModal: React.FC<StationTypeModalProps> = ({ 
  stationTypes, 
  onClose,
  onDeleteType,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingType, setEditingType] = useState<StationType | null>(null);
  const [newType, setNewType] = useState({ 
    name: '', 
    description: '', 
    image: null as File | null
  });
  const [editType, setEditType] = useState({
    station_types_id: '',
    name: '',
    description: '',
    image: null as File | null,
  });
  const [previewImage, setPreviewImage] = useState<string>('');
  const [editPreviewImage, setEditPreviewImage] = useState<string>('');
  const { showSuccess, showError } = useNotification();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('圖片大小不能超過5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        showError('請選擇有效的圖片檔案');
        return;
      }

      if (isEdit) {
        setEditType({ ...editType, image: file });
        const reader = new FileReader();
        reader.onloadend = () => setEditPreviewImage(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setNewType({ ...newType, image: file });
        const reader = new FileReader();
        reader.onloadend = () => setPreviewImage(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newType.image) {
      showError('請上傳類型圖片');
      return;
    }

    const formData = new FormData();
    formData.append('name', newType.name);
    formData.append('description', newType.description);
    formData.append('image', newType.image);

    try {
      const response = await asyncPost(station_api.add_types, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.status === 200) {
        setShowAddForm(false);
        setNewType({ name: '', description: '', image: null });
        setPreviewImage('');
        window.location.reload();
        showSuccess('新增類型成功');
      } else {
        showError('新增類型失敗');
      }
    } catch (error) {
      console.error('新增類型失敗:', error);
      showError('新增類型時發生錯誤');
    }
  };

  const handleEditClick = (type: StationType) => {
    setEditingType(type);
    setEditType({
      station_types_id: type._id,
      name: type.name,
      description: type.description || '',
      image: null,
    });
    setEditPreviewImage(type.image?.url || '');
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleUpdateType = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('station_types_id', editType.station_types_id);
    
    if (editType.name) {
      formData.append('name', editType.name);
    }
    
    if (editType.description) {
      formData.append('description', editType.description);
    }
    
    if (editType.image) {
      formData.append('image', editType.image);
    }

    try {
      const response = await asyncPut(station_api.update_types, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.status === 200) {
        setShowEditForm(false);
        setEditingType(null);
        setEditType({
          station_types_id: '',
          name: '',
          description: '',
          image: null,
        });
        setEditPreviewImage('');
        window.location.reload();
        showSuccess('更新類型成功');
      } else {
        showError('更新類型失敗');
      }
    } catch (error) {
      console.error('更新類型失敗:', error);
      showError('更新類型時發生錯誤');
    }
  };

  const handleDeleteType = async (typeName: string, typeId: string) => {
    const success = await onDeleteType(typeName, typeId);
    if (success) {
      window.location.reload();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingType(null);
    setEditType({
      station_types_id: '',
      name: '',
      description: '',
      image: null,
    });
    setEditPreviewImage('');
  };

  return createPortal(
    <div className="type-modal-overlay" onClick={handleCancel}>
      <div className="type-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="type-modal-header">
          <h3>站點類型管理</h3>
          <button
            className="type-modal-close"
            onClick={handleCancel}
          >
            ×
          </button>
        </div>

        <div className="type-modal-content">
          {!showEditForm && (
              <div className="type-list-header">
                <h4>現有站點類型 ({stationTypes.length})</h4>
                {!showAddForm ? (
                  <button
                    onClick={() => {
                      setShowAddForm(!showAddForm);
                      setShowEditForm(false);
                    }}
                    className="btn-add-type-header"
                  >
                    <FaPlus />
                    <span>新增類型</span>
                  </button>
                ) : (
                   <button
                    type="button"
                    className="btn-cancel-edit"
                    onClick={() => {
                      setShowAddForm(!showAddForm); 
                      setShowEditForm(false);
                    }}
                  >
                    <FaArrowLeftLong />
                  </button>
                )}
              </div>
          )}

          {showAddForm && !showEditForm && (
            <form onSubmit={handleAddType} className="add-type-form">
              <div className="type-form-with-image">
                <div className="type-form-image-section">
                  <label className="type-form-label">
                    類型圖片 <span className="required">*</span>
                  </label>
                  {previewImage ? (
                    <div className="type-modal-image-container">
                      <img 
                        src={previewImage} 
                        alt="預覽" 
                        className="type-modal-image" 
                      />
                      <div className="type-modal-image-overlay">
                        <div className="type-modal-change-icon">
                          <FaImage />
                          <span>更換圖片</span>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={(e) => handleImageChange(e, false)}
                        className="type-modal-image-input"
                      />
                    </div>
                  ) : (
                    <div className="type-modal-image-placeholder">
                      <div className="type-modal-upload-icon">
                        <FaImage />
                      </div>
                      <label>上傳類型圖片</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={(e) => handleImageChange(e, false)}
                      />
                    </div>
                  )}
                </div>

                <div className="type-form-fields-section">
                  <div className="type-form-group">
                    <label className="type-form-label">
                      類型名稱 <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={newType.name}
                      onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                      className="type-form-input"
                      placeholder="輸入類型名稱"
                      required
                    />
                  </div>

                  <div className="type-form-group">
                    <label className="type-form-label">
                      描述 <span className="required">*</span>
                    </label>
                    <textarea
                      value={newType.description}
                      onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                      className="type-form-textarea"
                      placeholder="輸入類型描述"
                      rows={4}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-submit-type">
                    確認新增
                  </button>
                </div>
              </div>
            </form>
          )}

          {showEditForm && editingType && (
            <form onSubmit={handleUpdateType} className="add-type-form edit-type-form">
              <div className="edit-form-header">
                <h4>編輯站點類型</h4>
                <button
                  type="button"
                  className="btn-cancel-edit"
                  onClick={handleCancelEdit}
                >
                  <FaArrowLeftLong />
                </button>
              </div>

              <div className="type-form-with-image">
                <div className="type-form-image-section">
                  <label className="type-form-label">站點類型圖片</label>
                  {editPreviewImage ? (
                    <div className="type-modal-image-container">
                      <img 
                        src={editPreviewImage} 
                        alt="預覽" 
                        className="type-modal-image" 
                      />
                      <div className="type-modal-image-overlay">
                        <div className="type-modal-change-icon">
                          <FaImage />
                          <span>更換圖片</span>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={(e) => handleImageChange(e, true)}
                        className="type-modal-image-input"
                      />
                    </div>
                  ) : (
                    <div className="type-modal-image-placeholder">
                      <div className="type-modal-upload-icon">
                        <FaImage />
                      </div>
                      <label>上傳類型圖片</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={(e) => handleImageChange(e, true)}
                      />
                    </div>
                  )}
                </div>

                <div className="type-form-fields-section">
                  <div className="type-form-group">
                    <label className="type-form-label">
                      站點類型名稱 <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={editType.name}
                      onChange={(e) => setEditType({ ...editType, name: e.target.value })}
                      className="type-form-input"
                      placeholder="輸入類型名稱"
                      required
                    />
                  </div>

                  <div className="type-form-group">
                    <label className="type-form-label">
                      站點描述 <span className="required">*</span>
                    </label>
                    <textarea
                      value={editType.description}
                      onChange={(e) => setEditType({ ...editType, description: e.target.value })}
                      className="type-form-textarea"
                      placeholder="輸入類型描述"
                      rows={4}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-submit-type">
                    確認更新
                  </button>
                </div>
              </div>
            </form>
          )}

          {!showEditForm && (
            <div className="type-list-container">
              <div className="type-list">
                {stationTypes.length === 0 ? (
                  <div className="type-list-empty">
                    <FaImage size={48} />
                    <p>尚無站點類型</p>
                    <span>點擊「新增類型」來建立第一個類型</span>
                  </div>
                ) : (
                  stationTypes.map((type) => (
                    <div key={type.name} className="type-item">
                      <div className="type-item-content">
                        {type.image?.url && (
                          <div className="type-item-image-wrapper">
                            <img 
                              src={type.image.url} 
                              alt={type.name} 
                              className="type-item-image" 
                            />
                          </div>
                        )}
                        <div className="type-item-info">
                          <h3 className="type-item-name">{type.name}</h3>
                          <p className="type-item-description">{type.description}</p>
                        </div>
                      </div>
                      <div className="type-item-actions">
                        <button
                          onClick={() => handleEditClick(type)}
                          className="btn-edit-type"
                        >
                          <FaPencil />
                          <span>編輯</span>
                        </button>
                        <button
                          onClick={() => handleDeleteType(type.name, type._id)}
                          className="btn-delete-type"
                        >
                          <FaTrash />
                          <span>刪除</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
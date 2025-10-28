import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import type { Station, StationType } from '../interfaces/station';
import { asyncGet, asyncPost, asyncPut, asyncDelete } from '../utils/fetch';
import { station_api } from '../api/api';
import { StationModal } from '../components/map/StationModal';
import { StationTypeModal } from '../components/map/StationTypeModal';
import { FaWrench, FaPlus, FaChevronLeft, FaChevronRight, FaLocationDot, FaRecycle, FaMapLocationDot, FaPencil, FaTrash } from "react-icons/fa6";
import '../styles/Maps.css';
import { useNotification } from '../context/NotificationContext';

export const MapsPage: React.FC = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
    preventGoogleFontsLoading: true,
  });

  const categoryMap: { [key: string]: string } = {
    'plastic': '塑膠',
    'cans': '鐵鋁罐',
    'containers': '紙容器',
    'battery': '電池',
    'paper': '紙類',
    'bottles': '寶特瓶'
  };

  const formatCategories = (categories: string[] | undefined): string => {
    if (!categories || categories.length === 0) return '';
    return categories.map(cat => categoryMap[cat] || cat).join(' · ');
  };

  const [stations, setStations] = useState<Station[]>([]);
  const [stationTypes, setStationTypes] = useState<StationType[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);

  const [mapsReady, setMapsReady] = useState(false);
  const { showSuccess, showError } = useNotification();
  
  useEffect(() => {
    if (isLoaded && window.google && window.google.maps) {
      setMapsReady(true);
    }
  }, [isLoaded]);

  const token = localStorage.getItem('token');

  const loadStations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await asyncGet(station_api.all, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.status === 200) {
        setStations(response.body || []);
      }
    } catch (error) {
      console.error('載入站點失敗:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadStationTypes = useCallback(async () => {
    try {
      const response = await asyncGet(station_api.all_types, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.status === 200) {
        setStationTypes(response.body || []);
      }
    } catch (error) {
      console.error('載入站點類型失敗:', error);
    }
  }, [token]);

  useEffect(() => {
    loadStations();
    loadStationTypes();
  }, [loadStations, loadStationTypes]);

  useEffect(() => {
    if (selectedStation) {
      const updatedStation = stations.find(s => s._id === selectedStation._id);
      if (updatedStation) {
        setSelectedStation(updatedStation);
      }
    }
  }, [stations]);

  const filteredStations = stations.filter(station => {
    const searchLower = searchTerm.toLowerCase();
    return (
      station.name.toLowerCase().includes(searchLower) ||
      station.address.toLowerCase().includes(searchLower) ||
      station.station_type?.name.toLowerCase().includes(searchLower)
    );
  });

  const handleStationClick = (station: Station) => {
    setSelectedStation(station);
    
    setTimeout(() => {
      const stationElement = document.querySelector(
        `.station-item[data-station-id="${station._id}"]`
      );
      if (stationElement) {
        stationElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }
    }, 100);
  };

  const handleEditClick = () => {
    if (selectedStation) {
      setEditingStation({
        ...selectedStation,
        station_type: selectedStation.station_type || { name: '', description: '', image: { url: '' } }
      });
      setShowEditModal(true);
    }
  };

  const handleAddStation = async (stationData: Partial<Station>) => {
    try {
      const response = await asyncPost(station_api.add, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: stationData,
      });
      if (response.status === 200) {
        setShowAddModal(false);
        loadStations();
        showSuccess('新增站點成功');
      } else {
        showError(`新增站點失敗: ${response.message}`);
      }
    } catch (error) {
      console.error('新增站點失敗:', error);
      showError('新增站點失敗');
    }
  };

  const handleUpdateStation = async (stationData: Partial<Station>) => {
    try {
      const response = await asyncPut(station_api.update, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: stationData,
      });
      if (response.status === 200) {
        setShowEditModal(false);
        setEditingStation(null);
        await loadStations();
        showSuccess('更新站點成功');
      } else {
        showError(`更新站點失敗: ${response.message}`);
      }
    } catch (error) {
      console.error('更新站點失敗:', error);
      showError('更新站點失敗');
    }
  };

  const handleDeleteStation = async (stationId: string) => {
    if (!confirm('確定要刪除此站點嗎?')) return;
    
    try {
      const response = await asyncDelete(station_api.delete, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: { 
          station_id: stationId 
        },
      });
      if (response.status === 200) {
        setSelectedStation(null);
        loadStations();
        showSuccess('刪除站點成功');
      } else {
        showError(`刪除站點失敗: ${response.message}`);
      }
    } catch (error) {
      console.error('刪除站點失敗:', error);
      showError('刪除站點失敗');
    }
  };

  const handleAddStationType = async (typeData: { name: string; description: string; image_url: string }) => {
    try {
      const response = await asyncPost(station_api.add_types, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: typeData,
      });
      if (response.status === 200) {
        showSuccess('新增站點類型成功');
        loadStationTypes();
        return true;
      } else {
        showError(`新增站點類型失敗: ${response.message}`);
        return false;
      }
    } catch (error) {
      console.error('新增類型失敗:', error);
      showError('新增站點類型失敗');
      return false;
    }
  };

  const handleDeleteStationType = async (typeName: string, typeId: string) => {
    if (!confirm(`確定要刪除類型 "${typeName}" 嗎?`)) return false;
    
    try {
      const response = await asyncDelete(station_api.delete_types, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: { 
          station_types_id: typeId 
        },
      });
      if (response.status === 200) {
        loadStationTypes();
        showSuccess('刪除站點類型成功');
        return true;
      } else {
        showError(`刪除站點類型失敗: ${response.message}`);
        return false;
      }
    } catch (error) {
      console.error('刪除類型失敗:', error);
      showError('刪除站點類型失敗');
      return false;
    }
  };

  return (
    <div className="maps-page-fullscreen">
      <div className={`sidebar ${!showSidebar ? 'sidebar-closed' : ''}`}>
        {showSidebar && (
          <>
            <div className="search-container">
              <FaLocationDot size={20} color="#9ca3af" />
              <input
                type="text"
                className="search-input"
                placeholder="搜尋站點名稱、地址或類型..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <>
                  <span className="search-count">
                    {filteredStations.length} 個結果
                  </span>
                  <button
                    className="search-clear"
                    onClick={() => setSearchTerm('')}
                  >
                    ✕
                  </button>
                </>
              )}
            </div>

            <div className="stations-list">
              {loading ? (
                <div className="loading-list">載入中...</div>
              ) : filteredStations.length === 0 ? (
                <div className="empty-list">沒有找到符合的站點</div>
              ) : (
                filteredStations.map((station) => (
                  <div
                    key={station._id}
                    data-station-id={station._id}
                    className={`station-item ${selectedStation?._id === station._id ? 'station-item-selected' : ''}`}
                    onClick={() => handleStationClick(station)}
                  >
                    <div className="station-item-icon">
                      {station.station_type?.image?.url && (
                        <img src={station.station_type.image.url} alt={station.station_type.name} />
                      )}
                    </div>
                    <div className="station-item-info">
                      <h3 className="station-item-name">{station.name}</h3>
                      <p className="station-item-address">{station.address}</p>
                      {station.category && station.category.length > 0 && (
                        <p className="station-item-categories">
                          {formatCategories(station.category)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <button 
        className="sidebar-toggle-btn"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        {showSidebar ? <FaChevronLeft size={18}/> : <FaChevronRight  size={18}/>}
      </button>

      <div className="map-controls">
        <button
          onClick={() => setShowTypeModal(true)}
          className="map-control-btn btn-primary"
        >
          <FaWrench size={20} />
          <span className="btn-text">管理站點類型</span>
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="map-control-btn btn-primary"
        >
          <FaPlus size={20} />
          <span className="btn-text">新增站點</span>
        </button>
      </div>

      <div className="map-wrapper">
        {loadError && (
          <div className="map-loading">
            <div className="loading-text" style={{ color: '#ef4444' }}>
              載入地圖時發生錯誤
            </div>
          </div>
        )}
        {loading ? (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">載入站點資料中...</div>
          </div>
        ) : !isLoaded || !mapsReady ? (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">載入 Google Maps 中...</div>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={
              selectedStation 
                ? { lat: selectedStation.latitude, lng: selectedStation.longitude }
                : { lat: 25.0330, lng: 121.5654 }
            }
            zoom={selectedStation ? 15 : 13}
            options={{
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
              clickableIcons: false,
              styles: [
                {
                  featureType: "poi",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "transit",
                  stylers: [{ visibility: "off" }]
                }
              ]
            }}
          >
            {stations.map((station) => (
              <Marker
                key={station._id}
                position={{ lat: station.latitude, lng: station.longitude }}
                onClick={() => handleStationClick(station)}
                icon={
                  station.station_type?.image?.url ? {
                    url: station.station_type.image.url,
                    scaledSize: new google.maps.Size(50, 105),
                  } : undefined
                }
              />
            ))}

            {selectedStation && (
              <InfoWindow
                position={{
                  lat: selectedStation.latitude,
                  lng: selectedStation.longitude
                }}
                options={{
                  pixelOffset: new google.maps.Size(0, 120)
                }}
                onCloseClick={() => setSelectedStation(null)}
              >
                <div className="info-window">
                  <div className="info-window-content">
                    <div className="info-window-title-section">
                      <h3 className="info-window-title">{selectedStation.name}</h3>
                      <span className="info-window-type-badge">
                        {selectedStation.station_type?.name || '未知'}
                      </span>
                    </div>

                    <div className="info-window-divider" />

                    <div className="info-window-details">
                      <div className="info-detail-row">
                        <FaLocationDot className="info-icon" />
                        <div className="info-detail-content">
                          <span className="info-detail-label">地址</span>
                          <span className="info-detail-value">{selectedStation.address}</span>
                        </div>
                      </div>

                      {selectedStation.category && selectedStation.category.length > 0 && (
                        <div className="info-detail-row">
                          <FaRecycle className="info-icon" />
                          <div className="info-detail-content">
                            <span className="info-detail-label">可回收類別</span>
                            <div className="info-categories-tags">
                              {selectedStation.category.map((cat, idx) => (
                                <span key={idx} className="category-tag">
                                  {categoryMap[cat] || cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="info-detail-row">
                        <FaMapLocationDot className="info-icon" />
                        <div className="info-detail-content">
                          <span className="info-detail-label">座標</span>
                          <span className="info-detail-value info-coords-value">
                            {`(${selectedStation.latitude.toFixed(6)}, ${selectedStation.longitude.toFixed(6)})`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="info-window-divider" />

                    <div className="info-window-actions">
                      <button
                        onClick={handleEditClick}
                        className="btn-info-action btn-info-edit"
                      >
                        <FaPencil />
                        <span>編輯</span>
                      </button>
                      <button
                        onClick={() => handleDeleteStation(selectedStation._id)}
                        className="btn-info-action btn-info-delete"
                      >
                        <FaTrash />
                        <span>刪除</span>
                      </button>
                    </div>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>

      {showAddModal && (
        <StationModal
          stationTypes={stationTypes}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddStation}
        />
      )}

      {showEditModal && editingStation && (
        <StationModal
          station={editingStation}
          stationTypes={stationTypes}
          onClose={() => {
            setShowEditModal(false);
            setEditingStation(null);
          }}
          onSubmit={handleUpdateStation}
        />
      )}

      {showTypeModal && (
        <StationTypeModal
          stationTypes={stationTypes}
          onClose={() => setShowTypeModal(false)}
          onAddType={handleAddStationType}
          onDeleteType={handleDeleteStationType}
        />
      )}
    </div>
  );
};
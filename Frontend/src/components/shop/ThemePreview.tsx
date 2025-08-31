import { View, Text, ImageBackground, StyleSheet, TouchableOpacity, Dimensions, Modal } from 'react-native';
import React, { ReactNode, useState, useEffect } from 'react';
import { tokenStorage } from '@/utils/tokenStorage';
import { theme_api } from '@/api/api';
import { asyncGet } from '@/utils/fetch';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/interface/Theme';

const { width, height } = Dimensions.get('window');

interface ThemePreviewProps {
  visible: boolean;
  theme: string | null;
  onClose: () => void;
}

export default function ThemePreview({ visible, theme, onClose }: ThemePreviewProps): ReactNode {
  const [token, setToken] = useState<string>();
  const [themeData, setThemeData] = useState<Theme | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThemePreview = async() => {
    if (!theme) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await asyncGet(`${theme_api.get_theme}/${encodeURIComponent(theme)}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response && response.body) {
        setThemeData(response.body);
      } else {
        setError('無法獲取主題資訊');
      }
    } catch (error) {
      console.error('Error fetching theme preview:', error);
      setError('取得主題資訊時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const getToken = async () => {
    try {
      const storedToken = await tokenStorage.getToken();
      setToken(storedToken as string);
    } catch (error) {
      console.error('Error getting token:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      getToken();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && token && theme) {
      fetchThemePreview();
    }
  }, [visible, token, theme]);

  useEffect(() => {
    if (!visible) {
      setThemeData(null);
      setError(null);
      setLoading(false);
    }
  }, [visible]);

  const shouldShowModal = visible && !!themeData && !loading && !error;

  const renderContent = () => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchThemePreview}
          >
            <Text style={styles.retryButtonText}>重試</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!themeData || !themeData.image) {
      return null;
    }

    return (
      <View>
        <ImageBackground 
          source={{ uri: themeData.image.url }} 
          style={styles.imageContainer}
          resizeMode="cover"
        >
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={28} color="#000000" />
          </TouchableOpacity>
        </ImageBackground>

        {themeData.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>{themeData.description}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={shouldShowModal}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalContainer} 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
        >
          {renderContent()}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.95,
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 41/59,
    justifyContent: 'space-between',
    borderRadius: 12,
    overflow: 'hidden'
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  descriptionContainer: {
    marginTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 12,
  },
  retryButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
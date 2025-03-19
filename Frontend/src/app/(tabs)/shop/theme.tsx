import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import React, { ReactNode, useState, useCallback, useEffect } from 'react';
import { useGlobalSearchParams, router } from 'expo-router';
import { tokenStorage } from '@/utils/storage';
import { theme_api } from '@/api/api';
import { asyncGet } from '@/utils/fetch';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ThemeData {
  name: string;
  description: string;
  image: {
    thumbnail_url: string;
    url: string;
  };
}

export default function Theme(): ReactNode {
  const { theme } = useGlobalSearchParams();
  const [token, setToken] = useState<string>();
  const [themeData, setThemeData] = useState<ThemeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageHeight, setImageHeight] = useState<number>(width / 9 * 16); // Default aspect ratio
  const decodedTheme = theme ? decodeURIComponent(theme as string) : null;

  const fetchThemePreview = async() => {
    if (!decodedTheme) return;
    
    try {
      setLoading(true);
      const response = await asyncGet(`${theme_api.get_theme}/${encodeURIComponent(decodedTheme)}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response && response.body) {
        setThemeData(response.body);
        
        // Get actual image dimensions to maintain aspect ratio
        if (response.body.image && response.body.image.url) {
          Image.getSize(response.body.image.url, (width, height) => {
            const screenWidth = Dimensions.get('window').width;
            const scaleFactor = screenWidth / width;
            setImageHeight(height * scaleFactor);
          }, (error) => {
            console.error('Error getting image size:', error);
          });
        }
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

  useEffect(() => {
    const getToken = async () => {
      try {
        const storedToken = await tokenStorage.getToken();
        setToken(storedToken as string);
      } catch (error) {
        console.error('Error getting token:', error);
        setLoading(false);
      }
    };
    
    getToken();
  }, []);

  useEffect(() => {
    if (token) {
      fetchThemePreview();
    }
  }, [token]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>讀取主題中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF3B30" />
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

  if (!themeData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>找不到主題資訊</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {themeData.image && (
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          <Image 
            source={{ uri: themeData.image.url }} 
            style={styles.themeImage}
            resizeMode="cover"
          />
        </View>
      )}
      
      <View style={styles.floatingContentContainer}>
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{themeData.description}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  imageContainer: {
    width: width,
  },
  themeImage: {
    width: '100%',
    height: '100%',
  },
  floatingContentContainer: {
    marginTop: 20,
  },
  descriptionContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 4,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    textAlign: 'center'
  }
});
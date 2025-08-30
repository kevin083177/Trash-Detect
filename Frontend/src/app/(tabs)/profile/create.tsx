import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, TextInput, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { Toast } from '@/components/Toast';
import LoadingModal from '@/components/LoadingModal';
import { asyncPost } from '@/utils/fetch';
import { tokenStorage } from '@/utils/tokenStorage';
import { feedback_api } from '@/api/api';

const { width } = Dimensions.get('window');

const FEEDBACK_CATEGORIES = [
  { label: '請選擇問題類型', value: '' },
  { label: '系統錯誤', value: 'bug' },
  { label: '辨識錯誤', value: 'detect' },
  { label: '改進建議', value: 'improvement' },
  { label: '其他', value: 'other' },
];

interface SelectedImage {
  uri: string;
  name: string;
  type: string;
}

export default function Create() {
  const [category, setCategory] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, message, type });
  };

  const handleImagePicker = async () => {
    if (selectedImages.length >= 3) {
      showToast('最多只能上傳3張圖片', 'error');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('權限被拒絕', '需要相簿權限才能選擇圖片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newImage: SelectedImage = {
          uri: asset.uri,
          name: `image_${Date.now()}.jpg`,
          type: 'image/jpeg',
        };
        
        setSelectedImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('選擇圖片時發生錯誤', 'error');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!category) {
      showToast('請選擇問題類型', 'error');
      return false;
    }
    
    if (!title.trim()) {
      showToast('請輸入問題標題', 'error');
      return false;
    }
    
    if (title.trim().length < 5) {
      showToast('標題至少需要5個字元', 'error');
      return false;
    }
    
    if (!content.trim()) {
      showToast('請輸入問題描述', 'error');
      return false;
    }
    
    if (content.trim().length < 10) {
      showToast('問題描述至少需要10個字元', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const token = await tokenStorage.getToken();
      
      if (!token) {
        showToast('請先登入', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('content', content.trim());

      selectedImages.forEach((image, index) => {
        formData.append(`images`, {
          uri: image.uri,
          name: image.name,
          type: image.type,
        } as any);
      });

      const response = await asyncPost(feedback_api.create_feedback, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response && response.body) {
        showToast('提交成功！感謝您的回饋', 'success');
        
        setCategory('');
        setTitle('');
        setContent('');
        setSelectedImages([]);
        
        setTimeout(() => {
          router.push('/(tabs)/profile/feedback');
        }, 1000);
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      console.error('Submit feedback error:', error);
      showToast('網路錯誤，請檢查連線後重試', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LoadingModal visible={isLoading} text="提交中..." />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>傳送意見回饋</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>問題類型</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
              >
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <Picker.Item
                    key={cat.value}
                    label={cat.label}
                    value={cat.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>問題標題</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="請輸入您的問題標題"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              editable={!isLoading}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>您的意見內容</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="請輸入您的問題或意見"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              maxLength={500}
              textAlignVertical="top"
              editable={!isLoading}
            />
            <Text style={styles.charCount}>{content.length}/500</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>相關圖片(最多3張)</Text>
            
            {selectedImages.length > 0 && (
              <View style={styles.imageGrid}>
                {selectedImages.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {selectedImages.length < 3 && (
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={handleImagePicker}
                disabled={isLoading}
              >
                <Ionicons name="camera-outline" size={24} color="#007AFF" />
                <Text style={styles.imagePickerText}>選擇圖片</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>
              通常會於2~3個工作天內回覆您的意見或問題
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? '提交中...' : '提交'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  required: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 2,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    backgroundColor: '#FAFBFC',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: 50,
    fontSize: 16,
    backgroundColor: '#FAFBFC',
    color: '#333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: '#FAFBFC',
  },
  imagePickerText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  noteContainer: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center'
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Dimensions, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import LoadingModal from '@/components/LoadingModal';
import Toast from '@/components/Toast';
import { asyncPost } from '@/utils/fetch';
import { theme_api } from '@/api/api';
import { tokenStorage } from '@/utils/storage';

interface ThemeFormData {
    name: string;
    description: string;
    image: string;
}

export default function AdminThemes() {
    const [token, setToken] = useState<String>()
    const [formData, setFormData] = useState<ThemeFormData>({
        name: '',
        description: '',
        image: '',
    });
    
    // 獲取屏幕寬度以便計算圖片高度
    const screenWidth = Dimensions.get('window').width;
    // 考慮容器的padding (16px * 2)
    const containerWidth = screenWidth - 32;
    // 圖片寬度設為容器寬度的95%
    const imageWidth = containerWidth * 0.95;
    // 根據55:81的比例計算高度
    const imageHeight = (imageWidth * 81) / 55;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [toast, setToast] = useState({
        visible: false,
        message: '',
        type: 'info' as 'success' | 'error' | 'info'
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({
            visible: true,
            message,
            type
        });
    };

    const handleImagePick = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('Sorry, we need camera roll permissions to make this work!');
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [55, 81], // 保持55:81的比例
            quality: 1,
        });

        if (!result.canceled) {
            setFormData({ ...formData, image: result.assets[0].uri });
        }
    };

    const handleSubmit = async () => {
        // 檢查必要欄位
        if (!formData.name || !formData.description || !formData.image) {
            showToast('請填寫必要欄位！', 'error');
            return;
        }
        
        try {
            setIsLoading(true);
            const formDataToSend = new FormData();

            // 添加基本資訊
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description);

            // 處理圖片
            const imageUri = formData.image;
            const imageName = imageUri.split('/').pop() || 'image.jpg';
            
            formDataToSend.append('image', {
                uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
                type: 'image/jpeg',
                name: imageName,
            } as any);

            // console.log('準備上傳數據:', JSON.stringify({
            //     name: formData.name,
            //     description: formData.description,
            //     imageUri: imageUri
            // }));

            const response = await asyncPost(theme_api.add_theme, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                },
                body: formDataToSend
            });
            
            console.log('上傳響應:', response);
            
            if (response.status === 200) {
                showToast('主題創建成功！', 'success');
                
                setFormData({
                    name: '',
                    description: '',
                    image: '',
                });
            } else {
                showToast(`上傳失敗: ${response.status}`, 'error');
                console.log(response);
            }
        } catch (error) {
            showToast('上傳過程中發生錯誤', 'error');
            console.error('上傳錯誤詳情:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            const storedToken = await tokenStorage.getToken();
            if (storedToken) {
                setToken(storedToken);
            }
        }
        fetchUserProfile();
    }, [token])

    return (
        <ScrollView style={styles.container}>
            <LoadingModal visible={isLoading} text='主題創建中...' />
            <Toast 
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />
            
            <Text style={styles.label}>主題名稱</Text>
            <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="輸入主題名稱"
            />

            <Text style={styles.label}>主題介紹</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="輸入主題介紹"
                multiline
                numberOfLines={4}
            />

            <Text style={styles.label}>主題預覽圖</Text>
            <TouchableOpacity style={styles.imageButton} onPress={handleImagePick}>
                <Text style={styles.imageButtonText}>
                    {formData.image ? '變更圖片' : '選擇圖片'}
                </Text>
            </TouchableOpacity>
            {formData.image && (
                <View style={styles.imageContainer}>
                    <Image 
                        source={{ uri: formData.image }} 
                        style={[
                            styles.previewImage,
                            { width: imageWidth, height: imageHeight }
                        ]} 
                        resizeMode="contain"
                    />
                </View>
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>創建主題</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    imageButton: {
        backgroundColor: '#e1e1e1',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    imageButtonText: {
        fontSize: 16,
        color: '#333',
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    previewImage: {
        borderRadius: 8,
    },
    submitButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 32,
    },
    submitButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
});
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Category, RecycleRequirement, RecycleType, RecycleValues, RECYCLE_TYPE_LABELS } from '@/interface/Recycle';
import { asyncPost } from '@/utils/fetch';
import { product_api } from '@/api/api';
import { tokenStorage } from '@/utils/storage';
import LoadingModal from '@/components/LoadingModal';
import Toast from '@/components/Toast';

interface FormData {
    name: string;
    description: string;
    price: string;
    category: Category;
    image: string;
    recycle_requirement: RecycleRequirement;
}

export default function AdminProducts() {
    const RECYCLE_TYPES: RecycleType[] = ['plastic', 'cans', 'paper', 'containers', 'bottles'];
    const CATEGORIES: Category[] = ['主題1', '主題2', '主題3', '主題4', '主題5'];
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        price: '',
        category: CATEGORIES[0],
        image: '',
        recycle_requirement: {},
    });

    const [recycleValues, setRecycleValues] = useState<RecycleValues>({
        plastic: 0,
        cans: 0,
        paper: 0,
        containers: 0,
        bottles: 0,
    });

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
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setFormData({ ...formData, image: result.assets[0].uri });
        }
    };

    const updateRecycleRequirement = (type: RecycleType, value: number) => {
        setRecycleValues({ ...recycleValues, [type]: value });
        
        const newRecycleRequirement = { ...recycleValues, [type]: value };
        const filteredRequirement = Object.entries(newRecycleRequirement)
            .reduce<RecycleRequirement>((acc, [key, val]) => {
                if (val > 0) {
                    acc[key as RecycleType] = val;
                }
                return acc;
            }, {});
        
        setFormData({
            ...formData,
            recycle_requirement: filteredRequirement,
        });
    };

    const handleSubmit = async () => {
        // 檢查必要欄位
        if (!formData.name || !formData.description || !formData.price || !formData.image) {
            showToast('請填寫必要欄位！', 'error');
            return;
        }
    
        try {
            setIsLoading(true);
            // 準備 FormData 對象
            const formDataToSend = new FormData();
            
            // 添加基本資訊
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('price', formData.price);
            formDataToSend.append('category', formData.category);
            
            formDataToSend.append('recycle_requirement', JSON.stringify(formData.recycle_requirement));
    
            // 處理圖片
            // 從 file:/// URI 創建檔案
            const imageUri = formData.image;
            const imageName = imageUri.split('/').pop();
            
            // 在 React Native 中，我們需要指定 uri、type 和 name
            formDataToSend.append('image', {
                uri: imageUri,
                type: 'image/jpeg', // 或根據實際圖片類型設置
                name: imageName,
            } as any);
    
            // 發送請求
            const response = await asyncPost(product_api.add_product, {
                headers: {
                    "Authorization": `Bearer ${await tokenStorage.getToken()}`,
                    "Content-Type": "multipart/form-data",
                },
                body: formDataToSend
            });
            console.log(response);
            if (response.status === 200) {
                showToast('商品上傳成功！', 'success');
                setFormData({
                    name: '',
                    description: '',
                    price: '',
                    category: CATEGORIES[0],
                    image: '',
                    recycle_requirement: {},
                });
                setRecycleValues({
                    plastic: 0,
                    cans: 0,
                    paper: 0,
                    containers: 0,
                    bottles: 0,
                });
            }
        } catch (error) {
            console.error('上傳失敗:', error);
            showToast('商品上傳失敗！', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <LoadingModal visible={isLoading} text='商品上傳中...' />
            <Toast 
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />
            <Text style={styles.label}>商品名稱</Text>
            <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="輸入商品名稱"
            />

            <Text style={styles.label}>商品介紹</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="輸入商品介紹"
                multiline
                numberOfLines={4}
            />

            <Text style={styles.label}>價格</Text>
            <TextInput
                style={styles.input}
                value={formData.price}
                defaultValue='0'
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="輸入商品價格"
                keyboardType="numeric"
            />

            <Text style={styles.label}>主題</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={formData.category}
                    onValueChange={(itemValue: Category) =>
                        setFormData({ ...formData, category: itemValue })
                    }
                    style={styles.picker}
                >
                    {CATEGORIES.map((category) => (
                        <Picker.Item key={category} label={category} value={category} />
                    ))}
                </Picker>
            </View>

            <Text style={styles.label}>回收需求</Text>
            {RECYCLE_TYPES.map((type) => (
                <View key={type} style={styles.recycleRow}>
                    <Text style={styles.recycleLabel}>{RECYCLE_TYPE_LABELS[type]}</Text>
                    <TextInput
                        style={styles.recycleInput}
                        value={recycleValues[type].toString()}
                        onChangeText={(value) => updateRecycleRequirement(type, Number(value))}
                        keyboardType="numeric"
                    />
                </View>
            ))}

            <Text style={styles.label}>商品照片</Text>
            <TouchableOpacity style={styles.imageButton} onPress={handleImagePick}>
                <Text style={styles.imageButtonText}>
                    {formData.image ? '變更圖片' : '選擇圖片'}
                </Text>
            </TouchableOpacity>
            {formData.image && (
                <Image source={{ uri: formData.image }} style={styles.previewImage} />
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>商品上架</Text>
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
        height: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 16,
    },
    picker: {
        height: 55,
    },
    recycleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    recycleLabel: {
        flex: 1,
        fontSize: 16,
    },
    recycleInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        width: 100,
        marginLeft: 16,
        textAlign: 'center',
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
    previewImage: {
        width: '100%',
        height: 400,
        borderRadius: 8,
        marginBottom: 16,
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
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ClearableInput from '@/components/auth/ClearableInput';
import PasswordInput from '@/components/auth/PasswordInput';
import LoadingModal from '@/components/LoadingModal';
import { Toast } from '@/components/Toast';
import { useUser } from '@/hooks/user';

type SettingType = 'username' | 'password' | 'email' | null;

export default function Settings() {
  const { 
    user, 
    updateUsername, 
    updatePassword, 
    updateEmail,
    refreshUserData 
  } = useUser();
  
  const [editingType, setEditingType] = useState<SettingType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [newUsername, setNewUsername] = useState<string>('');
  
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  const [newEmail, setNewEmail] = useState<string>('');
  
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, message, type });
  };

  const resetForm = () => {
    setNewUsername('');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setNewEmail('');
    setEditingType(null);
  };

  const handleUpdateUsername = async () => {
    try {
      setIsLoading(true);
      const result = await updateUsername(newUsername);
      
      if (result.success) {
        showToast(result.message, 'success');
        resetForm();
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('網路錯誤，請稍後再試', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast('新密碼與確認密碼不一致', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const result = await updatePassword(oldPassword, newPassword);
      
      if (result.success) {
        showToast(result.message, 'success');
        resetForm();
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('網路錯誤，請稍後再試', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    try {
      setIsLoading(true);
      const result = await updateEmail(newEmail);
      
      if (result.success) {
          router.push({
            pathname: "/(tabs)/profile/verification",
            params: { 
              newEmail: newEmail
            }
          });
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('網路錯誤，請稍後再試', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshUserData();
    }
  }, []);

  const renderSettingItem = (
    title: string,
    currentValue: string,
    type: SettingType,
    icon: keyof typeof Ionicons.glyphMap
  ) => {
    const isEditing = editingType === type;

    return (
      <View style={styles.settingItem}>
        <View style={styles.settingHeader}>
          <View style={styles.settingInfo}>
            <Ionicons name={icon} size={24} color="#007AFF" style={styles.settingIcon} />
            <View>
              <Text style={styles.settingTitle}>{title}</Text>
              <Text style={styles.settingValue}>{currentValue}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (isEditing) {
                resetForm();
              } else {
                setEditingType(type);
                if (type === 'username') setNewUsername(currentValue);
                if (type === 'email') setNewEmail(currentValue);
              }
            }}
          >
            <Ionicons 
              name={isEditing ? "close" : "pencil"} 
              size={20} 
              color={isEditing ? "#FF3B30" : "#007AFF"} 
            />
          </TouchableOpacity>
        </View>

        {isEditing && renderEditForm(type)}
      </View>
    );
  };

  const renderEditForm = (type: SettingType) => {
    switch (type) {
      case 'username':
        return (
          <View style={styles.editForm}>
            <ClearableInput
              placeholder="輸入使用者名稱"
              value={newUsername}
              onChangeText={setNewUsername}
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateUsername}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? '更新中...' : '保存'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'password':
        return (
          <View style={styles.editForm}>
            <PasswordInput
              placeholder="輸入目前密碼"
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <PasswordInput
              placeholder="輸入新密碼"
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <PasswordInput
              placeholder="輸入確認密碼"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdatePassword}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? '更新中...' : '保存'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'email':
        return (
          <View style={styles.editForm}>
            <ClearableInput
              placeholder="輸入新電子郵件"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateEmail}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? '更新中...' : '發送驗證碼'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              更新電子郵件時將發送驗證碼
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return <LoadingModal visible={true} text="載入設定中..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={router.back} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>個人設定</Text>
      </View>
      <LoadingModal visible={isLoading} text="處理中..." />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>帳號設定</Text>
        
        {renderSettingItem(
          '使用者名稱',
          user.username,
          'username',
          'person-outline'
        )}
        
        {renderSettingItem(
          '密碼',
          '••••••••••••',
          'password',
          'lock-closed-outline'
        )}
        
        {renderSettingItem(
          '電子郵件',
          user.email,
          'email',
          'mail-outline'
        )}
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  editForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign:'center'
  },
});
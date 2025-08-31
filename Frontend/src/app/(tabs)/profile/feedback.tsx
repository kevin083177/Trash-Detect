import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import React, { useEffect, useState } from "react"
import { SafeAreaView, TouchableOpacity, View, Text, StyleSheet, FlatList, Modal, ScrollView, Image, Dimensions, TouchableWithoutFeedback } from "react-native"
import { asyncGet } from "@/utils/fetch"
import { feedback_api } from "@/api/api"
import { tokenStorage } from "@/utils/tokenStorage"
import { Feedback, CATEGORIES, STATUS_TYPES} from "@/interface/Feedback"

const { width, height } = Dimensions.get('window');

export default function FeedbackPage() {
  const [token, setToken] = useState<string>();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');

  useEffect(() => {
    const initializeData = async() => {
      try {
        const storedToken = await tokenStorage.getToken();
        if (storedToken) {
          setToken(storedToken);
          const response = await asyncGet(feedback_api.get_user_feedbacks, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            }
          });
          
          if (response) {
            setFeedbacks(response.body);
          }
        } 
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    }
    initializeData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'processing':
        return '#007AFF';
      case 'resolved':
        return '#34C759';
      case 'closed':
        return '#ce2727ff';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    return STATUS_TYPES[status as keyof typeof STATUS_TYPES] || '未知';
  };

  const getCategoryText = (category: string) => {
    return CATEGORIES[category as keyof typeof CATEGORIES] || '未知';
  };

  const handleFeedbackPress = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setModalVisible(true);
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageViewerVisible(true);
  };

   const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = date.getUTCHours();
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const formattedHours = String(displayHours).padStart(2, '0');
    
    return `${month}/${day}/${year}, ${formattedHours}:${minutes} ${ampm}`;
  };

  const renderFeedbackItem = ({ item, index }: { item: Feedback; index: number }) => (
    <TouchableOpacity 
      style={styles.feedbackItem}
      onPress={() => handleFeedbackPress(item)}
    >
      <View style={styles.feedbackContent}>
        <View style={styles.feedbackLeft}>
          <Text style={styles.sequenceNumber}>{String(index + 1).padStart(2, '0')}</Text>
          <Text style={styles.feedbackTitle} numberOfLines={1}>{item.title}</Text>
        </View>
        <View style={styles.feedbackRight}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>意見回饋中心</Text>
      </View>
      <TouchableOpacity style={styles.addButtonContainer} onPress={() => {router.push('/profile/create')}}>
        <Ionicons name='add' color="#fff" size={36}/>
      </TouchableOpacity>
      <FlatList
        data={feedbacks}
        renderItem={renderFeedbackItem}
        keyExtractor={(item) => item._id}
        style={styles.feedbackList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>意見回饋詳情</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody} 
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {selectedFeedback && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>標題：</Text>
                    <Text style={styles.detailValue}>{selectedFeedback.title}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>類別：</Text>
                    <Text style={styles.detailValue}>{getCategoryText(selectedFeedback.category)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>狀態：</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedFeedback.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(selectedFeedback.status)}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>提交時間：</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedFeedback.created_at)}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>內容：</Text>
                    <Text style={styles.contentText}>{selectedFeedback.content}</Text>
                  </View>

                  {selectedFeedback.images && selectedFeedback.images.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>附件圖片：</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.imagesContainer}>
                          {selectedFeedback.images.map((image, index) => (
                            <TouchableOpacity 
                              key={index}
                              onPress={() => handleImagePress(image.url)}
                              activeOpacity={0.8}
                            >
                              <Image 
                                source={{ uri: image.url }}
                                style={styles.attachmentImage}
                                resizeMode="cover"
                              />
                              <View style={styles.imageOverlay}>
                                <Ionicons name="expand" size={16} color="#FFF" />
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  )}

                  {selectedFeedback.reply_content && (
                    <View style={styles.replySection}>
                      <Text style={styles.detailLabel}>{`管理員(${selectedFeedback.admin_name})回覆：`}</Text>
                      <View style={styles.replyContainer}>
                        <Text style={styles.replyText}>{selectedFeedback.reply_content}</Text>
                        {selectedFeedback.reply_at && (
                          <Text style={styles.replyDate}>
                            回覆時間：{formatDate(selectedFeedback.reply_at)}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity 
            style={styles.imageCloseButton}
            onPress={() => setImageViewerVisible(false)}
          >
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>

          <TouchableWithoutFeedback onPress={() => setImageViewerVisible(false)}>
            <View style={styles.imageViewerBackdrop}>
              <TouchableWithoutFeedback>
                <Image 
                  source={{ uri: selectedImageUrl }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    </SafeAreaView>
  )
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
  addButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: '50%',
    transform: [{ translateX: -30 }],
    zIndex: 20,
    width: 60,
    height: 60,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  addButton: {
    fontSize: 55,
    color: '#fff',
    textAlignVertical: 'center',
  },
  feedbackList: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  feedbackItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  feedbackContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackLeft: {
    flex: 1,
    marginRight: 16,
    flexDirection: 'row',
  },
  sequenceNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginRight: 16,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
    width: width - 200
  },
  feedbackRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginBottom: 4,
    marginLeft: 8,
  },
  contentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  attachmentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  imageOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  replySection: {
    marginVertical: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  replyContainer: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  replyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  replyDate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  imageViewerBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: 10,
  },
  fullScreenImage: {
    width: width,
    height: height * 0.8,
  },
});
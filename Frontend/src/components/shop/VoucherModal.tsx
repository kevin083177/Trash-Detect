import React, { useState } from 'react';
import { View, Text, Modal, Image, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VoucherType } from '@/interface/Voucher';
import VoucherConfirmModal from './VoucherConfirmModal';

const { width } = Dimensions.get('window');

interface VoucherDetailProps {
  voucher: VoucherType;
  visible: boolean;
  canAfford: boolean;
  canRedeem: boolean;
  userCoins: number;
  onClose: () => void;
  onRedeem: (count: number) => void;
}

export default function VoucherModal({
  voucher,
  visible,
  canAfford,
  canRedeem,
  userCoins,
  onClose,
  onRedeem
}: VoucherDetailProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleRedeem = () => {
    if (!canRedeem) {
      Alert.alert('錯誤', '暫時無法兌換');
      return;
    }
    
    if (!canAfford) {
      Alert.alert('錯誤', '金額不足');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmRedeem = (count: number) => {
    setShowConfirmModal(false);
    onRedeem(count);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>票券詳情</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.imageContainer}>
              {voucher.image.url && (
                <Image
                  source={{ uri: voucher.image.url }}
                  style={styles.voucherImage}
                  resizeMode="contain"
                />
              )}
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.voucherName}>{voucher.name}</Text>
              
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <View style={styles.priceContainer}>
                    <Ionicons name="logo-usd" size={20} color="#FFD700" />
                    <Text style={styles.priceText}>{voucher.price}</Text>
                  </View>
                  <Text style={styles.detailValue}>剩下 {voucher.quantity} 個</Text>
                </View>
              </View>
            </View>
            <View style={styles.descriptionContainer}>
              <View style={styles.descriptionTitleContainer}>
                <Text style={{marginRight: 8, fontSize: 12}}>●</Text>
                <Text style={styles.descriptionTitle}>注意事項</Text>
              </View>
              <Text style={styles.voucherDescription}>{voucher.description}</Text>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            {!canRedeem ? (
              <View style={styles.unavailableContainer}>
                <Text style={styles.unavailableText}>
                  {voucher.quantity <= 0 ? '已兌換完畢' : '暫時無法兌換'}
                </Text>
              </View>
            ) : !canAfford ? (
              <View style={styles.unavailableContainer}>
                <Text style={styles.unavailableText}>金額不足</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.redeemButton} onPress={handleRedeem}>
                <Text style={styles.redeemButtonText}>立即兌換</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <VoucherConfirmModal
        visible={showConfirmModal}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmRedeem}
        userCoins={userCoins}
        voucherPrice={voucher.price}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: "#fff"
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: "#fff",
  },
  voucherImage: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 20,
    paddingTop: 0,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  voucherName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionContainer: {
    marginTop: 12,
    padding: 20,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  descriptionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: 600
  },
  voucherDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginTop: 8,
  },
  detailsContainer: {
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: 600,
    color: '#000',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#B7791F',
    marginLeft: 4,
  },
  termsContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  quantityContainer: {
    flex: 1,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  quantityInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
  },
  redeemButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    alignItems: 'center',
  },
  redeemButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  unavailableContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
});
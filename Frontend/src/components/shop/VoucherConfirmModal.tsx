import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Coin } from '@/components/Coin';

interface VoucherConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  userCoins: number;
  voucherPrice: number;
}

export default function VoucherConfirmModal({
  visible,
  onClose,
  onConfirm,
  userCoins,
  voucherPrice,
}: VoucherConfirmModalProps) {
  const [quantity, setQuantity] = useState(1);

  const totalCost = quantity * voucherPrice;
  const canAfford = totalCost <= userCoins;
  const maxQuantity = Math.floor(userCoins / voucherPrice);
  const isAtMaxQuantity = quantity >= maxQuantity;

  useEffect(() => {
    if (visible) {
      setQuantity(1);
    }
  }, [visible]);

  const increaseQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleConfirm = () => {
    if (canAfford) {
      onConfirm(quantity);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.coinsSection}>
              <Text style={styles.coinsLabel}>持有狗狗幣</Text>
              <Coin value={userCoins} size="medium" />
            </View>

            <View style={styles.divider} />

            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>兌換數量</Text>
              
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={[
                    styles.quantityButton, 
                    quantity <= 1 && styles.quantityButtonDisabled
                  ]}
                  onPress={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <Ionicons name="remove" size={24} color={"#ffffff"} />
                </TouchableOpacity>

                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityNumber}>{quantity}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.quantityButton, 
                    (isAtMaxQuantity || !canAfford) && styles.quantityButtonDisabled
                  ]}
                  onPress={increaseQuantity}
                  disabled={isAtMaxQuantity || !canAfford}
                >
                  <Ionicons name="add" size={24} color={"#ffffff"} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.costSection}>
              <Text style={styles.costLabel}>將扣除</Text>
              <View style={styles.costContainer}>
                <Coin value={totalCost} size="large" />
              </View>
            </View>

            {!canAfford && (
              <Text style={styles.errorText}>狗狗幣不足</Text>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, !canAfford && styles.confirmButtonDisabled]}
                onPress={handleConfirm}
                disabled={!canAfford}
              >
                <Text style={[styles.confirmButtonText, !canAfford && styles.confirmButtonTextDisabled]}>
                  確認
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 350,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  coinsSection: {
    alignItems: 'center',
  },
  coinsLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  quantitySection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  quantityContainer: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  quantityButtonDisabled: {
    backgroundColor: '#ccc',
  },
  quantityDisplay: {
    marginVertical: 12,
  },
  quantityNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginHorizontal: 24,
  },
  costSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  confirmButtonTextDisabled: {
    color: '#999',
  },
});
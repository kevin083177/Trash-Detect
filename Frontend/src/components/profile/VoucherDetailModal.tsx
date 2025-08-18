import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Voucher, VoucherType } from '@/interface/Voucher';
import { Barcode } from './BarCode';

export interface GroupedVoucher {
  voucherType: VoucherType;
  vouchers: Voucher[];
  counts: {
    unused: number;
    used: number;
    expired: number;
  };
}

interface VoucherDetailModalProps {
  visible: boolean;
  groupedVoucher: GroupedVoucher | null;
  onClose: () => void;
}

type VoucherStatus = 'active' | 'used' | 'expired';

export default function VoucherDetailModal({ visible, groupedVoucher, onClose }: VoucherDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<VoucherStatus>('active');
  
  useEffect(() => {
    if (visible && groupedVoucher) {
      if (groupedVoucher.counts.unused > 0) {
        setSelectedStatus('active');
      } else if (groupedVoucher.counts.used > 0) {
        setSelectedStatus('used');
      } else if (groupedVoucher.counts.expired > 0) {
        setSelectedStatus('expired');
      } else {
        setSelectedStatus('active');
      }
    }
  }, [visible, groupedVoucher]);

  if (!groupedVoucher) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const getFilteredVouchers = () => {
    switch (selectedStatus) {
      case 'active':
        return groupedVoucher.vouchers.filter(v => v.status === 'active');
      case 'used':
        return groupedVoucher.vouchers.filter(v => v.status === 'used');
      case 'expired':
        return groupedVoucher.vouchers.filter(v => v.status === 'expired');
      default:
        return groupedVoucher.vouchers.filter(v => v.status === 'active');
    }
  };

  const renderVoucherCodes = () => {
    const filteredVouchers = getFilteredVouchers();
    
    return filteredVouchers.map((voucher, index) => {
      const isInactive = voucher.status !== 'active';
      const statusText = voucher.status === 'used' ? '已兌換' : voucher.status === 'expired' ? '已過期' : '';

      return (
        <View key={voucher._id} style={styles.voucherCodeContainer}>
          <Text style={styles.orderNumber}>訂單編號 {voucher._id.slice(-12)}</Text>
          <Text style={styles.dateInfo}>
            購買日期 {formatDate(voucher.issued_at)} | 
            兌換期限 {formatDate(voucher.expires_at)}
          </Text>
          <Text style={styles.serialNumber}>
            票券序號{String(index + 1).padStart(2, '0')} {voucher.voucher_code}
          </Text>
          
          {/* QR Code */}
          <View style={styles.qrCodeContainer}>
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={voucher.voucher_code}
                size={120}
                backgroundColor="white"
                color="black"
                logoSize={0}
              />
              {isInactive && (
                <View style={styles.codeOverlay}>
                  <View style={styles.overlayBackground} />
                  <Text style={styles.overlayText}>{statusText}</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Barcode */}
          <View style={styles.barcodeContainer}>
            <View style={[styles.barcodeRelativeContainer]}>
              <Barcode value={voucher.voucher_code} />
              {isInactive && (
                <View style={styles.barcodeOverlay}>
                  <View style={styles.overlayBackground} />
                  <Text style={styles.overlayText}>{statusText}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      );
    });
  };

  const renderStatusButton = (status: VoucherStatus, label: string, count: number) => {
    const isActive = selectedStatus === status;
    return (
      <TouchableOpacity 
        key={status}
        style={[styles.statusItem, isActive && styles.activeStatusItem]}
        onPress={() => setSelectedStatus(status)}
      >
        <Text style={[styles.statusText, isActive && styles.activeStatusText]}>
          {label}({count})
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>電子票券管理</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.voucherCard}>
          <View style={styles.voucherInfo}>
            <Image
              source={{ uri: groupedVoucher.voucherType.image?.url }}
              style={styles.voucherImage}
              resizeMode="contain"
            />
            <View style={styles.voucherTextContainer}>
              <Text style={styles.voucherCode}>{groupedVoucher.vouchers[0].voucher_type_id.slice(-10)}</Text>
              <Text style={styles.voucherTitle}>{groupedVoucher.voucherType.name}</Text>
              <Text style={styles.voucherExpiry}>
                兌換期限：每張票券自購買日起 90 天
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailContent}>
          <View style={styles.statusContainer}>
            {renderStatusButton('active', '未兌換', groupedVoucher.counts.unused)}
            {renderStatusButton('used', '已兌換', groupedVoucher.counts.used)}
            {renderStatusButton('expired', '已過期', groupedVoucher.counts.expired)}
          </View>
          
          <ScrollView 
            style={styles.voucherScrollView}
            contentContainerStyle={styles.voucherScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderVoucherCodes()}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  modalHeader: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 32,
  },
  voucherCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voucherInfo: {
    flexDirection: 'row',
  },
  voucherImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  voucherTextContainer: {
    flex: 1,
  },
  voucherCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  voucherExpiry: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  detailContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  statusContainer: {
    flexDirection: 'row',
    backgroundColor: '#ddd',
    borderRadius: 8,
    marginVertical: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  voucherScrollView: {
    flex: 1,
  },
  voucherScrollContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  statusItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeStatusItem: {
    backgroundColor: '#007AFF',
  },
  statusText: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    fontWeight: '500',
  },
  activeStatusText: {
    color: '#fff',
    fontWeight: '600',
  },
  voucherCodeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  dateInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  serialNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  qrCodeContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  qrCodeWrapper: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  barcodeContainer: {
    width: '100%',
    alignItems: 'center',
  },
  barcodeRelativeContainer: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
   codeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    zIndex: 10,
  },
  barcodeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    zIndex: 10,
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 4,
  },
  overlayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4444',
    textAlign: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#ff4444',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tabContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  tabContentText: {
    fontSize: 16,
    color: '#666',
  },
});
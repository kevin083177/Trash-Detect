import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'recycle' | 'question';
}

export const HelpModal: React.FC<HelpModalProps> = ({ visible, onClose, type }) => {
  const getModalConfig = () => {
    if (type === 'recycle') {
        return {
          title: '回收統計說明',
          imagePath: require("@/assets/images/recycle_helper2.png"),
          helpText: `圓餅圖為您的各類回收物品數量分布\n回收量顯示各類別的具體數量\n百分比顯示該類別佔總回收量的比例`,
        };
    }
    else {
        return {
          title: '答題統計說明',
          imagePath: require("@/assets/images/question_helper2.png"),
          helpText: `根據圖表了解自己對於回收的知識掌握度\n圖中顯示您在各類別問題的答對率\n圖形越大表示該類別答對率越高`,
        };
    }
  };

  const config = getModalConfig();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{config.title}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          
          <View style={styles.modalBody}>
            <View style={styles.imageContainer}>
                <Image
                    source={config.imagePath}
                    style={styles.helpImage}
                    resizeMode='contain'
                />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.helpText}>
                {config.helpText}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: screenWidth * 0.85,
    maxHeight: screenHeight * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  modalBody: {
    alignItems: 'center',
  },
  imageContainer: {
    width: '90%',
    marginBottom: 16,
    alignItems: 'center',
  },
  helpImage: {
    width: '100%',
    height: 300,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    lineHeight: 30,
    color: '#555',
    textAlign: 'center',
  },
});
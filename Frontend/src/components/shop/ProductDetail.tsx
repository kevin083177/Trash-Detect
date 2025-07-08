import React from "react";
import { View, Text, Image, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { Product } from "@/interface/Product";
import { Ionicons } from "@expo/vector-icons";

interface ProductDetailProps {
  product: Product;
  visible: boolean;
  purchased: boolean;
  canAfford: boolean;
  onClose: () => void;
  onBuy?: () => void;
}

const { width, height } = Dimensions.get("window");

export default function ProductDetail({ product, visible, purchased, canAfford, onClose, onBuy }: ProductDetailProps) {
  if (!product || purchased) return null;
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {/* Header with close button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.productContainer}>
            {/* Product Image */}
            <Image
              source={{ uri: product.image?.url }}
              style={styles.productImage}
              resizeMode="contain"
            />
            
            {/* Product Name */}
            <Text style={styles.productName}>{product.name}</Text>
            
            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>
                {product.description || "暫無描述"}
              </Text>
            </View>
            
          </View>
          
          {/* Buy Button */}
          <TouchableOpacity 
            style={styles.buyButton}
            onPress={onBuy}
            disabled={!canAfford}
          >
            <View style={styles.priceContainer}>
              <Ionicons name="logo-usd" size={24} color="#FFD700" />
              { canAfford ? (
                <Text style={styles.priceText}>{product.price}</Text>
                ) : (
                  <Text style={styles.priceNotEnough}>餘額不足</Text>
                )
              }
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: width * 0.85,
    maxHeight: height * 0.6,
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  closeButton: {
    padding: 4,
  },
  productContainer: {
    alignItems: 'center'
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: 'center',
    color: "#333",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#B7791F",
    marginLeft: 8,
  },
  priceNotEnough: {
    fontSize: 18,
    fontWeight: "600", 
    color: "gray",
    marginLeft: 8,
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    textAlign: 'center',
  },
  buyButton: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderColor: '#eee',
  },
});
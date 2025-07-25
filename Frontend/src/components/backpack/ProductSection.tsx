import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Product } from '@/interface/Product';

interface ProductSectionProps {
  products: Product[];
  onProductPress?: (product: Product) => void;
  selectedProduct?: Product | null;
}

const { width } = Dimensions.get('window');

export default function ProductSection({ products, onProductPress, selectedProduct }: ProductSectionProps) {
  const renderProduct = (item: Product) => {
    const isSelected = selectedProduct?._id === item._id;
    
    return (
      <TouchableOpacity
        key={item._id}
        style={[
          styles.productItem,
          isSelected && styles.selectedProductItem
        ]}
        onPress={() => onProductPress?.(item)}
      >
        {isSelected && (
            <View style={styles.selectedOverlay}>
              <Text style={styles.selectedText}>已放置</Text>
            </View>
        )}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.image?.url }}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.productName}>
          {item.name}
        </Text>
        <Text style={styles.productTheme}>
          {item.theme}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.scrollView} horizontal>
      <View style={styles.container}>
        {products.map(renderProduct)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
  },
  productItem: {
    width: 100,
    height: 120,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    elevation: 2,
  },
  selectedProductItem: {
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  imageContainer: {
    width: 80,
    height: 80,
    padding: 10,
    alignSelf: 'center',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 40,
    height: 20,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  selectedText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  productName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  productTheme: {
    fontSize: 10,
    color: '#aaa',
    textAlign: 'center',
    paddingBottom: 4,
  }
});
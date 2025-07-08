import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductCategory } from '@/interface/Product';

interface CategoryInfo {
  key: ProductCategory;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface CategorySelectorProps {
  selectedCategory: ProductCategory;
  onCategoryChange: (category: ProductCategory) => void;
}

const CATEGORIES: CategoryInfo[] = [
    { key: 'wallpaper', name: '壁紙', icon: 'image-outline'},
    { key: 'box', name: '對話框', icon: 'chatbox-outline'},
    { key: 'bookshelf', name: '書櫃', icon: 'library-outline'},
    { key: 'table', name: '桌子', icon: 'tablet-landscape-outline'},
    { key: 'carpet', name: '地毯', icon: 'grid-outline'},
    { key: 'calendar', name: '時間', icon: 'time-outline'},
    { key: 'lamp', name: '燈具', icon: 'bulb-outline'},
    { key: 'pendant', name: '吊飾', icon: 'diamond-outline'},
];

export default function CategorySelector({ 
  selectedCategory, 
  onCategoryChange, 
}: CategorySelectorProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.key;
          
          return (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                isSelected && styles.selectedCategoryButton,
              ]}
              onPress={() => onCategoryChange(category.key)}
            >
              <View style={styles.categoryContent}>
                <Ionicons 
                  name={category.icon}
                  size={24}
                  color={isSelected ? 'white' : '#007AFF'} 
                />
                <Text style={[
                  styles.categoryText,
                  isSelected && styles.selectedCategoryText
                ]}>
                  {category.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    minWidth: 70,
    minHeight: 70,
    alignItems: 'center',
  },
  selectedCategoryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryContent: {
    alignItems: 'center',
    position: 'relative',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: 'white',
  },
});
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
              <Ionicons 
                name={category.icon}
                size={24}
                color={isSelected ? '#007AFF' : '#8E8E93'} 
              />
              <Text style={[
                styles.categoryText,
                isSelected && styles.selectedCategoryText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 8,
  },
  scrollContainer: {
    paddingHorizontal: 8,
    alignItems: 'center',
    minWidth: '100%',
    justifyContent: 'space-around',
  },
  categoryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginHorizontal: 8,
    minWidth: 50,
    flex: 1,
  },
  selectedCategoryButton: {
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 2,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
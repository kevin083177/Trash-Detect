import { View, Text, Image, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { Product, useProducts } from '@/hooks/product';
import React, { ReactNode, useState, useCallback, useEffect } from 'react';
import { useGlobalSearchParams, router } from 'expo-router';
import { tokenStorage } from '@/utils/storage';
import { user_api } from '@/api/api';
import { asyncGet } from '@/utils/fetch';

const { width } = Dimensions.get('window');

export default function Theme(): ReactNode {
  const { theme } = useGlobalSearchParams();
  const decodedTheme = theme ? decodeURIComponent(theme as string) : null;

  return (
    <View>
      <Text>這裡會預覽主題</Text>
      <Text>並提供主題介紹</Text>
    </View>
  );
}
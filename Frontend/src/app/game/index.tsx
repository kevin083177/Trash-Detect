import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Headers from '@/components/Headers';
import { asyncGet } from '@/utils/fetch';
import { chapter_api, user_api } from '@/api/api';
import { tokenStorage } from '@/utils/storage';
import { ChapterButton } from '@/components/game/ChapterButton';
import { Chapter } from '@/interface/Chapter';
import { router } from 'expo-router';
import { ChapterDots } from '@/components/game/ChapterDots';
import { LevelSelector } from '@/components/game/LevelSelector';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = 500;

export default function GameChapterScreen() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [money, setMoney] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Chapter>>(null);
  const [levelSelectorVisible, setLevelSelectorVisible] = useState(false);
  const [selectedChapterName, setSelectedChapterName] = useState<string>('');
  const [selectChapterBackground, setSelectChapterBackground] = useState<string>('');
  const [selectChapterSequence, setSelectChapterSequence] = useState<number>(0);

  const fetchUserProfile = async () => {
    if (!token) return;
    
    try {
      const response = await asyncGet(user_api.get_user, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });
      
      if (response) {
        setUsername(response.body.username);
        setMoney(response.body.money);
      }
      else {
        Alert.alert("錯誤", "無法連接至伺服器");
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchChapters = async () => {
    setLoading(true);
    try {
      const response = await asyncGet(chapter_api.get_all_chapters, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.status === 200) {
        const chaptersData = response.body;
        setChapters(chaptersData);
        setError(null);
      } else {
        console.error('Error fetching chapters:', response.statusText);
        setError('無法載入章節，請稍後再試');
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
      setError('發生錯誤，請檢查網路連接');
    } finally {
      setLoading(false);
    }
  }; 

  useEffect(() => {
    const getToken = async () => {
      try {
        const storedToken = await tokenStorage.getToken();
        setToken(storedToken as string);
      } catch (error) {
        console.error('Error getting token:', error);
        setLoading(false);
      }
    };
    
    getToken();
  }, []);
  
  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchChapters();
    }
  }, [token]);

  const handleChapterPress = (chapter_name: string, chapter_sequence: number, chapter_background: string) => {
      setSelectedChapterName(chapter_name);
      setSelectChapterSequence(chapter_sequence);
      setSelectChapterBackground(chapter_background);
      setLevelSelectorVisible(true);
  };

  // 處理非激活卡片的點擊，滾動至該卡片位置
  const handleNonActiveCardPress = (index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  const handleViewableItemsChanged = ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  };

  const renderItem = ({ item, index }: { item: Chapter, index: number}) => {
    const isActive = index === activeIndex;
    
    return (
      <View style={styles.cardContainer}>
        <View style={styles.chapterBackground}>
          <View style={styles.cardContent}>
            <ChapterButton 
              chapter={item} 
              unlocked={true} 
              isActive={isActive}
              onPress={() => isActive
                ? handleChapterPress(item.name, item.sequence, item.background_image.url) 
                : handleNonActiveCardPress(index)}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Headers router={router} username={username} money={money} showBackpack={false} showShop={false} showBackButton={true}/>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>載入中...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchChapters}>
            <Text style={styles.retryButtonText}>重試</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={chapters}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH} // Width of card without adding spacing
            decelerationRate="fast"
            contentContainerStyle={styles.flatListContent}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
          
          {/* Floating dot indicator component */}
          <ChapterDots 
            totalDots={chapters.length} 
            activeDotIndex={activeIndex} 
          />
        </View>
      )}
      <LevelSelector 
        router={router}
        visible={levelSelectorVisible}
        chapter_sequence={selectChapterSequence}
        chapter_name={selectedChapterName}
        chapter_background={selectChapterBackground}
        onClose={() => setLevelSelectorVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', // For absolute positioning of the dots
  },
  flatListContent: {
    paddingHorizontal: width * 0.1, // To center the first and last cards
    alignItems: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: 0, // No horizontal margin to show next card
    borderRadius: 15,
    overflow: 'hidden',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  chapterBackground: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#ff0000',
  },
  retryButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import Headers from '@/components/Headers';
import { ChapterButton } from '@/components/game/ChapterButton';
import { Chapter } from '@/interface/Chapter';
import { router } from 'expo-router';
import { ChapterDots } from '@/components/game/ChapterDots';
import { LevelSelector } from '@/components/game/LevelSelector';
import { useUserLevel } from '@/hooks/userLevel';
import { useUser } from '@/hooks/user';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = 500;

export default function GameChapterScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Chapter>>(null);
  const [levelSelectorVisible, setLevelSelectorVisible] = useState(false);
  const [selectedChapterName, setSelectedChapterName] = useState<string>('');
  const [selectChapterBackground, setSelectChapterBackground] = useState<string>('');
  const [selectChapterSequence, setSelectChapterSequence] = useState<number>(0);

  const { 
    userLevelProgress, 
    loading, 
    error,
    isChapterUnlocked,
    getChaptersToRender,
    fetchChapters
  } = useUserLevel();

  const { getUsername, getMoney, getTrashStats } = useUser();

  // 計算垃圾總數
  const calculateTotalTrash = (): number => {
    const stats = getTrashStats();
    return stats.bottles + stats.cans + stats.containers + stats.paper + stats.plastic;
  };

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
    const unlocked = isChapterUnlocked(item.sequence);
    const totalTrash = calculateTotalTrash();
    
    // 判斷是否因為前章節未完成而無法解鎖
    const hasEnoughTrash = totalTrash >= item.trash_requirement;
    const requiresPreviousChapter = item.sequence > 1 && hasEnoughTrash && !unlocked;
    
    return (
      <View style={styles.cardContainer}>
        <View style={styles.chapterBackground}>
          <View style={styles.cardContent}>
            <ChapterButton 
              chapter={item} 
              unlocked={unlocked} 
              isActive={isActive}
              requiresPreviousChapter={requiresPreviousChapter}
              onPress={() => {
                if (unlocked) {
                  if (isActive) {
                    handleChapterPress(item.name, item.sequence, item.image.url);
                  } else {
                    handleNonActiveCardPress(index);
                  }
                }
              }}
            />
          </View>
        </View>
      </View>
    );
  };

  const chaptersToRender = getChaptersToRender();

  return (
    <SafeAreaView style={styles.container}>
      <Headers 
        router={router} 
        username={getUsername()} 
        money={getMoney()} 
        showBackpack={false} 
        showShop={false} 
        showBackButton={true}
      />
      
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
            data={chaptersToRender}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH}
            decelerationRate="fast"
            contentContainerStyle={styles.flatListContent}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
          
          {/* Floating dot indicator component */}
          <ChapterDots 
            totalDots={chaptersToRender.length} 
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
        userLevelProgress={userLevelProgress}
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
    position: 'relative',
  },
  flatListContent: {
    paddingHorizontal: width * 0.1,
    alignItems: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: 0,
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
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView, FlatList, ImageBackground } from 'react-native';
import { ChapterButton } from '@/components/game/ChapterButton';
import { Chapter } from '@/interface/Chapter';
import { router, useFocusEffect } from 'expo-router';
import { ChapterDots } from '@/components/game/ChapterDots';
import { LevelSelector } from '@/components/game/LevelSelector';
import { useUserLevel } from '@/hooks/userLevel';
import { useUser } from '@/hooks/user';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = 350;
const CARD_HEIGHT = height * 0.7;
const CARD_SPACE = (width - CARD_WIDTH) / 2;

export default function GameChapterScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Chapter>>(null);
  const [levelSelectorVisible, setLevelSelectorVisible] = useState<boolean>(false);
  const [selectedChapterName, setSelectedChapterName] = useState<string>('');
  const [selectChapterBackground, setSelectChapterBackground] = useState<string>('');
  const [selectChapterSequence, setSelectChapterSequence] = useState<number>(0);

  const { 
    userLevelProgress, 
    loading, 
    error,
    isChapterUnlocked,
    isChapterCompleted,
    getChaptersToRender,
    fetchChapters,
    getRemainingTimes,
    getChallengeHighestScore,
    refreshAll,
    setChapterUnlocked
  } = useUserLevel();

  const { getTotalTrash } = useUser();

  useFocusEffect(
    useCallback(() => {
      refreshAll()
    }, [refreshAll])
  );

  useEffect(() => {
    const checkAndUnlockChapters = async () => {
      const chapters = getChaptersToRender();
      const totalTrash = getTotalTrash();
      
      for (const chapter of chapters) {
        if (chapter.sequence === 1) continue;
        
        if (isChapterUnlocked(chapter.sequence)) continue;
        
        const hasEnoughTrash = totalTrash >= chapter.trash_requirement;
        const previousChapterCompleted = isChapterCompleted(chapter.sequence - 1);
        
        if (hasEnoughTrash && previousChapterCompleted) {
          await setChapterUnlocked(chapter.sequence);
        }
      }
    };

    if (!loading && getChaptersToRender().length > 0) {
      checkAndUnlockChapters();
    }
  }, [userLevelProgress, loading, isChapterCompleted, isChapterUnlocked, setChapterUnlocked, getTotalTrash, getChaptersToRender]);

  const handleChapterPress = (chapter_name: string, chapter_sequence: number, chapter_background: string) => {
    setSelectedChapterName(chapter_name);
    setSelectChapterSequence(chapter_sequence);
    setSelectChapterBackground(chapter_background);
    setLevelSelectorVisible(true);
  };

  const handleNonActiveCardPress = (index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
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
    const totalTrash = getTotalTrash();
    
    const hasEnoughTrash = totalTrash >= item.trash_requirement;
    const previousChapterCompleted = item.sequence > 1 ? isChapterCompleted(item.sequence - 1) : true;
    
    let lockReason = '';
    if (!unlocked) {
      if (!hasEnoughTrash) {
        lockReason = 'trash';
      } else if (!previousChapterCompleted) {
        lockReason = 'previous';
      }
    }
    
    const chapterCompleted = isChapterCompleted(item.sequence);

    return (
      <View style={styles.cardContainer}>
        <View style={styles.chapterBackground}>
          <View style={styles.cardContent}>
            <ChapterButton 
              chapter={item}
              completed={chapterCompleted}
              unlocked={unlocked}
              remaining={getRemainingTimes(item.sequence)}
              isActive={isActive}
              lockReason={lockReason}
              onPress={() => {
                if (unlocked) {
                  if (isActive) {
                    handleChapterPress(item.name, item.sequence, item.image.url);
                  } else {
                    handleNonActiveCardPress(index);
                  }
                }
              }}
              style={{ width: CARD_WIDTH, height: CARD_HEIGHT,  }}
            />
          </View>
        </View>
      </View>
    );
  };

  const chaptersToRender = getChaptersToRender();

  const currentChapterBackground = chaptersToRender.length > 0 && chaptersToRender[activeIndex] 
    ? chaptersToRender[activeIndex].image.url 
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={{ uri: currentChapterBackground }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="cover"
        blurRadius={5}
      >
      <View style={styles.overlay} />
      {error ? (
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
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + 50}
              decelerationRate="fast"
              contentContainerStyle={styles.flatListContent}
              onViewableItemsChanged={handleViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              ItemSeparatorComponent={() => <View style={{ width: 50 }} />}
            />
            
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
        remainingTimes={getRemainingTimes(selectChapterSequence)}
        challengeHighestScore={getChallengeHighestScore(selectChapterSequence)}
        onClose={() => setLevelSelectorVisible(false)}
      />
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    opacity: 0.7,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)'
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatListContent: {
    paddingHorizontal: CARD_SPACE,
    alignItems: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    marginTop: -80,
    borderRadius: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    margin: 20,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#ff0000',
    fontSize: 16,
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
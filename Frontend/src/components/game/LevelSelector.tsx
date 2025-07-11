import React, { useEffect, useState } from "react";
import { View, Image, Modal, TouchableOpacity, StyleSheet, Dimensions, Text, ScrollView } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { asyncGet } from "@/utils/fetch";
import { level_api, question_api } from "@/api/api";
import { tokenStorage } from "@/utils/tokenStorage";
import { LevelButton } from "./LevelButton";
import { LevelDetail } from "./LevelDetail";
import { Router } from "expo-router";
import { Question } from "@/interface/Question";
import { Stars } from "@/components/game/Stars";
import { UserLevel } from "@/interface/UserLevel";
import { Level } from "@/interface/Level";

// 隨機選取問題
function getRandomQuestions(allQuestions: Question[], count: number): Question[] {
  const shuffled = [...allQuestions];
  
  // Fisher-Yates
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, count);
}

// 隨機排序問題選項
function shuffleOptions(questions: Question[]): Question[] {
  return questions.map(question => {
    const questionCopy = { ...question };
    
    const correctOption = questionCopy.options[questionCopy.correctOptionIndex];
    
    const optionsCopy = [...questionCopy.options];
    
    for (let i = optionsCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionsCopy[i], optionsCopy[j]] = [optionsCopy[j], optionsCopy[i]];
    }
    
    const newCorrectIndex = optionsCopy.findIndex(option => 
      option.id === correctOption.id
    );
    
    return {
      ...questionCopy,
      options: optionsCopy,
      correctOptionIndex: newCorrectIndex
    };
  });
}

export function LevelSelector({ 
  router, 
  visible, 
  chapter_name, 
  chapter_sequence, 
  chapter_background, 
  userLevelProgress,
  onClose, 
  onSelectLevel 
}: { 
  router: Router
  visible: boolean;
  chapter_name: string;
  chapter_sequence: number;
  chapter_background: string;
  userLevelProgress: UserLevel;
  onClose(): void;
  onSelectLevel?(levelSequence: number): void;
}) {
  const [userScores, setUserScores] = useState<number[]>([]);
  const [userStars, setUserStars] = useState<number[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);

  const extractQuestions = (questions: any[], levelSequence: number): Question[] => {
    const startIndex = (levelSequence - 1) * 20;
    const endIndex = startIndex + 20;
    
    // 提取範圍內的問題
    const levelQuestions = questions.slice(startIndex, endIndex);
    
    return levelQuestions.map(q => {
      const correctOptionIndex = q.options.findIndex(
        (option: any) => option.id === q.correct_answer
      );
      
      return {
        id: q._id,
        content: q.content,
        category: q.category,
        options: q.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text
        })),
        correctOptionIndex: correctOptionIndex
      };
    });
  };

  const processUserProgress = () => {
    if (userLevelProgress.level_progress && typeof userLevelProgress.level_progress === 'object') {
      const scores: number[] = [];
      const stars: number[] = [];
      
      const levelNumbers = Object.keys(userLevelProgress.level_progress)
        .map(key => parseInt(key))
        .sort((a, b) => a - b);
      
      levelNumbers.forEach(levelNum => {
        const levelProgress = userLevelProgress.level_progress[levelNum];
        scores[levelNum - 1] = levelProgress.score || 0;
        stars[levelNum - 1] = levelProgress.stars || 0;
      });
      
      setUserScores(scores);
      setUserStars(stars);
    }
  };
  
  const fetchChaptersLevelInformation = async() => {
    try {
      const response = await asyncGet(`${level_api.get_chapters_level}${chapter_name}`, {
        headers: {  
          "Authorization": `Bearer ${await tokenStorage.getToken()}`
        }
      });
      setLevels(response.body);
    } catch (error) {
      console.error("Error fetching chapter levels:", error);
    }
  };

  useEffect(() => {
    if (visible) {
      processUserProgress();
      fetchChaptersLevelInformation();
    }
  }, [visible, userLevelProgress]);

  // LevelButton 定點位置
  const getPositionForSequence = (sequence: number) => {
    const positionIndex = (sequence - 1) % 5;
    const positions = [
      { x: 95, y: -50 },    // Level 1 6 11 ...
      { x: 145, y: 80 },    // Level 2 7 12 ...
      { x: 205, y: 200 },   // Level 3 8 13 ...
      { x: 105, y: 330 },   // Level 4 9 14 ...
      { x: 80, y: 480 },    // Level 5 10 15 ...
    ];

    return positions[positionIndex];
  };

  // 用於設定選擇的關卡資料
  const handleLevelSelect = (level: Level) => {
    setSelectedLevel(level);
    setDetailModalVisible(true);
  };

  const handleStartLevel = async () => {
    if (selectedLevel) {
      try {
        const response = await asyncGet(`${question_api.get_question_by_category}${chapter_name.substring(0, 3)}`, {
          headers: {
            "Authorization": `Bearer ${await tokenStorage.getToken()}`
          }
        });
        
        if (response.status === 200) {
          // 提取該關卡的問題 (所有20題)
          const allLevelQuestions = extractQuestions(response.body, selectedLevel.sequence);
          
          // 從20題中隨機選取10題
          const selectedQuestions = getRandomQuestions(allLevelQuestions, 10);
          
          // 為每一題隨機排序選項
          const gameQuestions = shuffleOptions(selectedQuestions);
          
          handleCloseDetail();
          onClose();
          
          router.replace({
            pathname: '/game/gameplay',
            params: {
              levelId: selectedLevel.sequence,
              levelName: selectedLevel.name,
              levelBackground: chapter_background,
              levelDescription: selectedLevel.description,
              questions: JSON.stringify(gameQuestions),
            }
          });
        } else {
          console.error("獲取問題失敗:", response.message);
        }
      } catch (error) {
        console.error("獲取問題時發生錯誤:", error);
      }
    }
  };

  // 關閉 LevelDetail
  const handleCloseDetail = () => {
    setDetailModalVisible(false);
    setSelectedLevel(null);
  };

  // 渲染每個關卡及其星星
  const renderLevelWithStars = (level: Level) => {
    const isUnlocked = userLevelProgress.highest_level >= level.unlock_requirement;
    const position = getPositionForSequence(level.sequence);
    const levelStars = userStars[level.sequence - 1] || 0;
    
    return (
      <View 
        key={level._id}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          alignItems: 'center',
        }}
      >
        <LevelButton
          sequence={level.sequence}
          name={level.name}
          unlock_requirement={level.unlock_requirement}
          isUnlocked={isUnlocked}
          onPress={() => isUnlocked && handleLevelSelect(level)}
        />
        
        {/* 星星渲染器 */}
        {isUnlocked && (
          <Stars
            stars={levelStars} 
            style={styles.starsContainer} 
            size={26}
          />
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Image 
            source={require('@/assets/images/Level_Background.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          {/* Level map with fixed positions */}
          <ScrollView 
            contentContainerStyle={styles.levelMapContainer}
            horizontal={true}
            scrollEnabled={false}
          >
            <View style={styles.levelMapContent}>
              {levels.map(renderLevelWithStars)}
            </View>
          </ScrollView>

          {/* Level detail modal */}
          {selectedLevel && (
            <LevelDetail 
              visible={detailModalVisible}
              level_name={selectedLevel.name}
              level_description={selectedLevel.description}
              user_scores={userScores[selectedLevel.sequence - 1] || 0}
              user_stars={userStars[selectedLevel.sequence - 1] || 0}
              onClose={handleCloseDetail}
              onStart={handleStartLevel}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContainer: {
    width: width * 0.9,
    height: height * 0.8,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'white',
    position: 'relative'
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute'
  },
  backButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  chapterTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 25,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    zIndex: 5
  },
  levelMapContainer: {
    width: 1100,
    height: '100%',
    marginTop: 60
  },
  levelMapContent: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  starsContainer: {
    position: 'absolute',
    bottom: -5,
  }
});
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ImageBackground, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Router } from 'expo-router';
import { asyncGet } from "@/utils/fetch";
import { question_api } from "@/api/api";
import { tokenStorage } from "@/utils/tokenStorage";
import { Question } from "@/interface/Question";

interface ChallengeModalProps {
  router: Router;
  visible: boolean;
  chapterName: string;
  chapterSequence: number;
  chapterBackground: string;
  remainingTimes?: number;
  highestScore?: number;
  onClose: () => void;
}

function getRandomQuestions(allQuestions: Question[], count: number): Question[] {
  const shuffled = [...allQuestions];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, count);
}

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

export function ChallengeModal({
  router,
  visible,
  chapterName,
  chapterSequence,
  chapterBackground,
  remainingTimes,
  highestScore = 0,
  onClose,
}: ChallengeModalProps) {
  const isChallengeAvailable = !!remainingTimes;

  const convertToQuestions = (questions: any[]): Question[] => {
    return questions.map(q => {
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

  const handleChallengeStart = async () => {
    if (!isChallengeAvailable) return;

    try {
      const categoryName = chapterName.slice(0, -2);
      
      const response = await asyncGet(`${question_api.get_question_by_category}${encodeURIComponent(categoryName)}`, {
        headers: {
          "Authorization": `Bearer ${await tokenStorage.getToken()}`
        }
      });
      
      if (response.status === 200 && response.body && response.body.length > 0) {
        const allQuestions = convertToQuestions(response.body);
        
        const selectedQuestions = getRandomQuestions(allQuestions, 10);
        
        const gameQuestions = shuffleOptions(selectedQuestions);
        
        onClose();
        
        router.replace({
          pathname: '/(tabs)/game/gameplay',
          params: {
            isChallenge: 'true',
            chapterSequence: chapterSequence,
            chapterName: chapterName,
            levelBackground: chapterBackground,
            questions: JSON.stringify(gameQuestions),
          }
        });
      } else {
        Alert.alert("錯誤", `無法載入 "${categoryName}" 的題目，請稍後再試。`);
      }
    } catch (error) {
      Alert.alert("錯誤", "載入題目失敗，請檢查網路連接後再試。");
    }
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
          <ImageBackground
            source={{ uri: chapterBackground }}
            style={styles.backgroundImage}
            imageStyle={styles.backgroundImageStyle}
            blurRadius={10}
          >
            <View style={styles.overlay} />
            
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>

            <View style={styles.contentContainer}>
              <View style={styles.headerSection}>
                <Text style={styles.challengeTitle}>挑戰模式</Text>
              </View>

              <View style={styles.statusSection}>
                <View
                  style={styles.statusCard}
                >
                  <View style={styles.glassOverlay} />
                  <View style={styles.scoreContainer}>
                    <Image source={require('@/assets/images/trophy.png')} style={styles.trophyImage}/>
                    <Text style={styles.scoreText}>最高分</Text>
                    <View style={{flexDirection: "row", alignItems: 'center'}}>
                      <Ionicons name='star' size={32} color={"#feac00"} style={{marginRight: 4}}/>
                      <Text style={styles.score}>{highestScore.toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.buttonSection}>
                {isChallengeAvailable ? (
                  <TouchableOpacity
                    style={styles.challengeButton}
                    onPress={handleChallengeStart}
                  >
                    <Text style={styles.challengeButtonText}>開始挑戰</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.disabledButton}
                    disabled={true}
                  >
                    <Text style={styles.disabledButtonText}>沒有挑戰次數</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.remainingText}>
                    剩餘次數: {remainingTimes || 0} / 20
                </Text>
              </View>
            </View>
          </ImageBackground>
        </View>
          <Text style={styles.descriptionText}>
            {'從所有題目隨機選取 10 題\n每獲得 200 分即可獲得 10 金錢獎勵'}
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    height: '47%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'space-between',
  },
  backgroundImageStyle: {
    borderRadius: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  headerSection: {
    alignItems: 'center',
  },
  challengeTitle: {
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statusSection: {
    alignItems: 'center',
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 200,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  remainingText: {
    fontSize: 16,
    color: 'white',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scoreContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1,
  },
  trophyImage: {
    width: 90,
    height: 90
  },
  scoreText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  score: {
    fontSize: 48,
    fontWeight: 800,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  descriptionText: {
    fontSize: 14,
    marginTop: 12,
    color: '#e9e9e9',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonSection: {
    alignItems: 'center',
  },
  challengeButton: {
    backgroundColor: '#1b9121ff',
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  challengeButtonText: {
    color: 'white',
    fontSize: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  disabledButton: {
    backgroundColor: '#666',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    justifyContent: 'center',
  },
  disabledButtonText: {
    color: '#999',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
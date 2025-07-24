import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ResultModalProps {
  visible: boolean;
  isChallenge: boolean;
  score: number;
  stars: number;
  money: number;
  currentLevelId?: number;
  hasNextLevel?: boolean;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onNextLevel?: () => void;
}

export function ResultModal({
  visible,
  isChallenge,
  score,
  stars,
  money,
  currentLevelId,
  hasNextLevel = false,
  onPlayAgain,
  onBackToMenu,
  onNextLevel,
}: ResultModalProps) {
  const isSuccess = stars >= 1;
  const showNextLevelButton = !isChallenge && isSuccess && hasNextLevel && onNextLevel;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.modalContainer, 
          !isSuccess && !isChallenge && styles.failedModalContainer
        ]}>
          <View style={[
            styles.innerBorder,
            !isSuccess && !isChallenge && styles.failedInnerBorder
          ]} />

          { (isSuccess || isChallenge) && (
            <View style={styles.backgroundDecorations}>
              <View style={styles.decoration1} />
              <View style={styles.decoration2} />
              <View style={styles.decoration3} />
              <View style={styles.decoration4} />
              <View style={styles.decoration5} />
              <View style={styles.decoration6} />
              <View style={styles.decoration7} />
              <View style={styles.decoration8} />
            </View>
          )}

          { (!isSuccess && !isChallenge) && (
            <View style={styles.backgroundDecorations}>
              <View style={[styles.failureLine1, styles.failureLine]} />
              <View style={[styles.failureLine2, styles.failureLine]} />
              <View style={[styles.failureLine3, styles.failureLine]} />
              <View style={[styles.failureLine4, styles.failureLine]} />
              <View style={[styles.failureLine5, styles.failureLine]} />
              <View style={[styles.failureLine6, styles.failureLine]} />
              <View style={[styles.failureLine7, styles.failureLine]} />
              <View style={[styles.failureLine8, styles.failureLine]} />
            </View>
          )}

          <View style={styles.starsSection}>
            <View style={styles.starsContainer}>
              {[1, 2, 3].map((star) => {
                const isStarActive = () => {
                  if (stars === 1) return star === 1;
                  if (stars === 2) return star === 1 || star === 3;
                  if (stars >= 3 || isChallenge) return true;
                  return false;
                };
                
                const isActive = isStarActive();
                
                return (
                  <View 
                    key={star}
                    style={[
                      styles.starWrapper,
                      star === 2 && styles.starCenter,
                    ]}
                  >
                    <Image 
                      source={
                        isActive
                          ? require('@/assets/images/Star.png')
                          : require('@/assets/images/Star_Disable.png')
                      }
                      style={[
                        styles.starImage,
                        star === 2 && styles.centerStarImage
                      ]}
                      resizeMode="contain"
                    />
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.titleContainer}>
            <Text style={[
              styles.resultTitle,
              !isSuccess && !isChallenge && styles.failedResultTitle
            ]}>
              { isChallenge ? `挑戰結果: $${money.toLocaleString()}` : (isSuccess ? '關卡完成' : "關卡失敗") }
            </Text>
          </View>
          <View style={styles.resultSection}>
            <View style={styles.scoreSection}>
              <Text style={[styles.resultLabel, !isSuccess && styles.failedText]}>獲得分數</Text>
              <Text style={[styles.scoreText, !isSuccess && styles.failedText]}>{score.toLocaleString()}</Text>
            </View>

          </View>       
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={[styles.button, styles.homeButton]} onPress={onBackToMenu}>
              <Ionicons name="home" size={32} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.reloadButton]} onPress={onPlayAgain}>
              <Ionicons name="reload" size={32} color="white" />
            </TouchableOpacity>
            {showNextLevelButton && (
              <TouchableOpacity style={[styles.button, styles.nextLevelButton]} onPress={onNextLevel}>
                <Ionicons name="play-forward" size={32} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: '#F5E6D3',
    borderRadius: 25,
    position: 'relative',
    paddingVertical: 30,
    paddingHorizontal: 25,
    maxHeight: height * 0.85,
  },
  failedModalContainer: {
    backgroundColor: '#D6E3F0',
  },
  innerBorder: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 2,
    borderColor: '#8B5A3C',
    borderRadius: 17,
    pointerEvents: 'none',
  },
   failedInnerBorder: {
    borderColor: '#7A9BC4',
  },
  backgroundDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decoration1: {
    position: 'absolute',
    top: 100,
    left: 30,
    width: 20,
    height: 6,
    backgroundColor: '#FF8C42',
    borderRadius: 3,
    transform: [{ rotate: '25deg' }],
  },
  decoration2: {
    position: 'absolute',
    top: 80,
    right: 40,
    width: 15,
    height: 6,
    backgroundColor: '#4A90E2',
    borderRadius: 3,
    transform: [{ rotate: '-15deg' }],
  },
  decoration3: {
    position: 'absolute',
    top: '30%',
    left: 20,
    width: 12,
    height: 6,
    backgroundColor: '#FFD93D',
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
  },
  decoration4: {
    position: 'absolute',
    top: '35%',
    right: 30,
    width: 18,
    height: 6,
    backgroundColor: '#FF8C42',
    borderRadius: 3,
    transform: [{ rotate: '-30deg' }],
  },
  decoration5: {
    position: 'absolute',
    bottom: '30%',
    left: 40,
    width: 16,
    height: 6,
    backgroundColor: '#4A90E2',
    borderRadius: 3,
    transform: [{ rotate: '20deg' }],
  },
  decoration6: {
    position: 'absolute',
    bottom: '25%',
    right: 25,
    width: 14,
    height: 6,
    backgroundColor: '#FFD93D',
    borderRadius: 3,
    transform: [{ rotate: '-40deg' }],
  },
  decoration7: {
    position: 'absolute',
    bottom: 60,
    left: 35,
    width: 20,
    height: 6,
    backgroundColor: '#FF8C42',
    borderRadius: 3,
    transform: [{ rotate: '35deg' }],
  },
  decoration8: {
    position: 'absolute',
    bottom: 80,
    right: 45,
    width: 16,
    height: 6,
    backgroundColor: '#4A90E2',
    borderRadius: 3,
    transform: [{ rotate: '-25deg' }],
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#3b8132',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    elevation: 3,
  },
  failedResultTitle: {
    backgroundColor: '#d34747ff',
  },
  resultSection: {
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 32,
    flexDirection: 'column',
  },
  scoreSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5A3C',
  },
  scoreText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#8B5A3C',
  },
  failedText: {
    color: '#506780ff',
  },
  starsSection: {
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  starWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  starCenter: {
    marginBottom: 30,
  },
  starImage: {
    width: 80,
    height: 80,
  },
  centerStarImage: {
    width: 100,
    height: 100,
  },
  moneySection: {
    alignItems: 'center',
    marginTop: 20,
  },
  moneyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moneyText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#b67d5aff',
  },
  buttonsContainer: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    padding: 18,
    borderRadius: 50,
    elevation: 3,
  },
  nextLevelButton: {
    backgroundColor: '#2196F3',
  },
  reloadButton: {
    backgroundColor: '#47a03bff',
  },
  homeButton: {
    backgroundColor: '#876D5A',
  },
  failureLine: {
    backgroundColor: '#7A9BC4'
  },
  failureLine1: {
    position: 'absolute',
    top: 8,
    left: 40,
    width: 2,
    height: 180,
  },
  failureLine2: {
    position: 'absolute',
    top: 8,
    left: 70,
    width: 2,
    height: 80,
  },
  failureLine3: {
    position: 'absolute',
    top: 8,
    left: 100,
    width: 2,
    height: 60,
  },
  failureLine4: {
    position: 'absolute',
    top: 8,
    left: 130,
    width: 2,
    height: 140,
  },
  failureLine5: {
    position: 'absolute',
    top: 8,
    right: 130,
    width: 2,
    height: 90,
  },
  failureLine6: {
    position: 'absolute',
    top: 8,
    right: 100,
    width: 2,
    height: 110,
  },
  failureLine7: {
    position: 'absolute',
    top: 8,
    right: 70,
    width: 2,
    height: 70,
  },
  failureLine8: {
    position: 'absolute',
    top: 8,
    right: 40,
    width: 2,
    height: 130,
  },
});
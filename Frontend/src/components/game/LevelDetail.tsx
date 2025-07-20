import React from "react";
import { Modal, Text, View, StyleSheet, TouchableOpacity, Image, Dimensions } from "react-native";
import { Ionicons } from '@expo/vector-icons';

interface LevelDetailProps {
  visible: boolean;
  level_name: string;
  level_description: string;
  user_scores: number;
  user_stars: number;
  onClose: () => void;
  onStart: () => void;
}

export function LevelDetail({ 
  visible, 
  level_name, 
  level_description, 
  user_scores, 
  user_stars,
  onClose,
  onStart,
}: LevelDetailProps) {
    return (
        <Modal
          visible={visible}
          transparent={true}
          animationType="fade"
          onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Inner border */}
                    <View style={styles.innerBorder} />
                    
                    {/* Background decorations */}
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

                    {/* Close button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#8B5A3C" />
                    </TouchableOpacity>
                    
                    {/* Level title */}
                    <View style={styles.levelTitleContainer}>
                        <Text style={styles.levelTitle}>{level_name}</Text>
                    </View>
                    
                    {/* Stars Section */}
                    <View style={styles.starsSection}>
                        <View style={styles.starsContainer}>
                            {[1, 2, 3].map((star) => {
                                // 自定義星星亮起邏輯
                                const isStarActive = () => {
                                    if (user_stars === 1) return star === 1; // 只亮左邊
                                    if (user_stars === 2) return star === 1 || star === 3; // 亮左右邊
                                    if (user_stars >= 3) return true; // 全亮
                                    return false;
                                };
                                
                                // 星星分數要求
                                const getStarRequirement = (starNumber: number) => {
                                    switch(starNumber) {
                                        case 1: return 600;
                                        case 2: return 1600;
                                        case 3: return 1000;
                                        default: return 0;
                                    }
                                };
                                
                                const starRequirement = getStarRequirement(star);
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
                                        
                                        {!isActive && (
                                            <Text style={styles.scoreRequirementText}>
                                                {starRequirement}
                                            </Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                                       
                    {/* Score section */}
                    <View style={styles.scoreSection}>
                        <Text style={styles.scoreTitle}>最高得分</Text>
                        <Text style={styles.scoreText}>{user_scores}</Text>
                    </View>
                    
                    <View style={styles.divider} />

                    {/* Description */}
                    <View style={styles.descriptionSection}>
                        <Text style={styles.descriptionText}>{level_description}</Text>
                    </View>
                    
                    {/* Start Game Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.startButton} onPress={onStart}>
                            <View style={styles.buttonGradient}>
                                <Text style={styles.startButtonText}>開始遊戲</Text>
                            </View>
                        </TouchableOpacity>
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
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    container: {
        width: width * 0.85,
        height: height * 0.55,
        backgroundColor: '#F5E6D3',
        borderRadius: 25,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        position: 'relative',
        paddingVertical: 30,
        paddingHorizontal: 25,
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
        zIndex: 1,
        pointerEvents: 'none',
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
    closeButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 8,
    },
    levelTitleContainer: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: -60,
        zIndex: 15,
        position: 'relative',
    },
    levelTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: '#3b8132',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 25,
        shadowRadius: 4,
    },
    starsSection: {
        alignItems: 'center',
        marginTop: 30,
        zIndex: 10,
        position: 'relative',
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        height: 80,
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
        width: 70,
        height: 70,
    },
    centerStarImage: {
        width: 85,
        height: 85,
    },
    scoreRequirementText: {
        color: 'gray'
    },
    divider: {
        height: 3,
        borderColor: '#5e4436d8',
        marginHorizontal: 60,
        marginBottom: 25,
        borderWidth: 2,
        borderRadius: 50,
        zIndex: 10,
        position: 'relative',
    },
    scoreSection: {
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        position: 'relative',
    },
    scoreTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#8B5A3C',
    },
    scoreText: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#8B5A3C',
    },
    descriptionSection: {
        paddingHorizontal: 10,
        marginBottom: 30,
        zIndex: 10,
        position: 'relative',
    },
    descriptionText: {
        fontSize: 16,
        color: '#8B5A3C',
        textAlign: 'center',
        lineHeight: 24,
        fontWeight: '500',
    },
    footer: {
        marginTop: 'auto',
        zIndex: 10,
        position: 'relative',
    },
    startButton: {
        width: "60%",
        alignSelf: 'center',
        borderRadius: 25,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        elevation: 3,
    },
    buttonGradient: {
        backgroundColor: '#72bf6a',
        paddingVertical: 12,
        alignItems: 'center',
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    
});
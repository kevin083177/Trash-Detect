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
                    {/* Header with title and close button */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{level_name}</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color="#444" />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Level details section */}
                    <View style={styles.content}>
                        <View style={styles.descriptionContainer}>
                            <Text style={styles.descriptionTitle}>關卡介紹</Text>
                            <Text style={styles.description}>{level_description}</Text>
                        </View>
                        
                        {/* Stats section */}
                        <View style={styles.statsContainer}>
                            <Text style={styles.statsTitle}>歷史紀錄</Text>
                            
                            <View style={styles.statItem}>
                                <View style={styles.statIconContainer}>
                                    <Ionicons name="trophy" size={28} color="#FF9500" />
                                </View>
                                <View style={styles.statTextContainer}>
                                    <Text style={styles.statLabel}>最高分數</Text>
                                    <Text style={styles.statValue}>{user_scores}</Text>
                                </View>
                            </View>
                            
                            <View style={styles.statItem}>
                                <View style={styles.statIconContainer}>
                                    <Ionicons name="star" size={28} color="#FF9500" />
                                </View>
                                <View style={styles.statTextContainer}>
                                    <Text style={styles.statLabel}>獲得星星</Text>
                                    <View style={styles.starsContainer}>
                                        {[1, 2, 3].map((star) => (
                                            <Ionicons 
                                                key={star}
                                                name={star <= user_stars ? "star" : "star-outline"} 
                                                size={22} 
                                                color={star <= user_stars ? "#FF9500" : "#CCC"} 
                                                style={styles.starIcon}
                                            />
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                    
                    {/* Footer with start button */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.startButton} onPress={onStart}>
                            <Text style={styles.startButtonText}>開始遊戲</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E7FF',
    },
    title: {
        color: '#4A6CFA',
        fontSize: 22,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 5,
    },
    content: {
        padding: 20,
    },
    descriptionContainer: {
        marginBottom: 25,
    },
    descriptionTitle: {
        color: '#4A6CFA',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    description: {
        color: '#444',
        fontSize: 16,
        lineHeight: 24,
    },
    statsContainer: {
        backgroundColor: '#F7F9FF',
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    statsTitle: {
        color: '#4A6CFA',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    statIconContainer: {
        width: 50,
        height: 50,
        backgroundColor: '#FFF5E6',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    statTextContainer: {
        flex: 1,
    },
    statLabel: {
        color: '#777',
        fontSize: 14,
    },
    statValue: {
        color: '#333',
        fontSize: 20,
        fontWeight: 'bold',
    },
    starsContainer: {
        flexDirection: 'row',
        marginTop: 5,
    },
    starIcon: {
        marginRight: 5,
    },
    footer: {
        padding: 20,
        backgroundColor: '#F7F9FF',
        borderTopWidth: 1,
        borderTopColor: '#E0E7FF',
    },
    startButton: {
        backgroundColor: '#4A6CFA',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    startButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
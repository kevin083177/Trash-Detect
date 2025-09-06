import { Chapter } from "@/interface/Chapter";
import React from "react";
import { TouchableOpacity, View, StyleSheet, Text, Image, Dimensions, ImageBackground } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

export function ChapterButton({ 
  chapter, 
  unlocked,
  completed,
  remaining,
  isActive = true,
  onPress,
  lockReason = '',
  style = {},
}: {
  chapter: Chapter, 
  unlocked: boolean,
  completed: boolean,
  remaining?: number,
  isActive?: boolean, 
  onPress: () => void,
  lockReason?: string,
  style?: object,
}) {
    
    const getLockText = () => {
        switch (lockReason) {
            case 'trash':
                return {
                    title: '需要更多回收統計',
                    subtitle: `${chapter.trash_requirement} 次的回收紀錄`
                };
            case 'previous':
                return {
                    title: '需完成前一章節',
                    subtitle: '完成前一章節的所有關卡'
                };
            default:
                return {
                    title: '',
                    subtitle: ''
                };
        }
    };

    const lockText = getLockText();

    return (
        <TouchableOpacity 
            onPress={onPress} 
            disabled={!unlocked}
            style={[
                style,
                !isActive && styles.inactiveButton,
                !unlocked && styles.disabledButton
            ]}
            activeOpacity={unlocked ? 0.8 : 1}
        >
            <ImageBackground 
                source={{ uri: chapter.image.url }} 
                style={styles.banner}
                imageStyle={styles.bannerImage}
            >
                {!unlocked && (
                    <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={50} color="white" style={styles.lockIcon} />
                        <Text style={styles.lockText}>
                            {lockText.title}
                        </Text>
                        {lockText.subtitle && (
                            <Text style={styles.requirementText}>
                                {lockText.subtitle}
                            </Text>
                        )}
                    </View>
                )}

                {completed && (
                    <View style={styles.completionBadge}>
                        <Ionicons name="checkmark-circle" size={18} color="green" />
                        <Text style={styles.completionText}>已完成</Text>
                    </View>
                )}
                
                {remaining !== undefined && (
                    <View style={[
                        styles.remainingBadge,
                        remaining < 1 ? styles.remainingBadgeEnded : styles.remainingBadgeActive
                    ]}>
                        <Ionicons 
                            name="trophy" 
                            size={16} 
                            color={remaining < 1 ? "#FF6B6B" : "#FFD700"} 
                        />
                        <Text style={[
                            styles.remainingText,
                        ]}>
                            {remaining < 1 ? '挑戰結束' : '可挑戰'}
                        </Text>
                    </View>
                )}

                {unlocked && !isActive && (
                    <View style={styles.inactiveOverlay}>
                    </View>
                )}
                
                <View style={styles.textContainer}>
                    <Text style={[
                        styles.chapterName,
                        !unlocked && styles.lockedChapterName
                    ]}>
                        {chapter.name}
                    </Text>
                </View>
            </ImageBackground>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    banner: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        justifyContent: 'flex-end',
    },
    bannerImage: {
        borderRadius: 12,
    },
    textContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignSelf: 'flex-end',
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    chapterName: {
        color: 'white',
        fontSize: 22,
        textAlign: 'right',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    lockedChapterName: {
        opacity: 0.7,
    },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(128, 128, 128, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lockIcon: {
        opacity: 0.9,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 16,
        borderRadius: 50,
        marginBottom: 16,
    },
    lockText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    requirementText: {
        color: 'white',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    inactiveButton: {
        opacity: 0.8,
    },
    disabledButton: {
        opacity: 0.9,
    },
    inactiveOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    completionBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    completionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    remainingBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    remainingBadgeActive: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    remainingBadgeEnded: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    remainingText: {
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 4,
        color: 'white'
    },
});
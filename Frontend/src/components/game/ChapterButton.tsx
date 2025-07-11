import { Chapter } from "@/interface/Chapter";
import React from "react";
import { TouchableOpacity, View, StyleSheet, Text, Image, Dimensions, ImageBackground } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');
const button_width = width * 0.65;
const button_height = 450;

export function ChapterButton({ 
    chapter, 
    unlocked, 
    isActive = true,
    onPress,
    requiresPreviousChapter = false
}: {
    chapter: Chapter, 
    unlocked: boolean, 
    isActive?: boolean, 
    onPress: () => void,
    requiresPreviousChapter?: boolean
}) {
    return (
        <TouchableOpacity 
            onPress={onPress} 
            disabled={!unlocked}
            style={[
                styles.buttonContainer,
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
                {/* 未解鎖遮罩 */}
                {!unlocked && (
                    <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={50} color="white" style={styles.lockIcon} />
                        <Text style={styles.lockText}>
                            {requiresPreviousChapter ? '需完成前一章節' : '需要更多回收統計'}
                        </Text>
                        <Text style={styles.requirementText}>
                            {requiresPreviousChapter 
                                ? '' 
                                : `${chapter.trash_requirement} 次的回收紀錄`
                            }
                        </Text>
                    </View>
                )}
                
                {/* 非激活狀態遮罩 */}
                {unlocked && !isActive && (
                    <View style={styles.inactiveOverlay}>
                    </View>
                )}
                
                {/* 章節名稱 */}
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
    buttonContainer: {
        width: button_width,
        height: button_height,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 5, // Android 陰影
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        marginVertical: 8,
    },
    banner: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end', // 確保文字在底部
    },
    bannerImage: {
        height: button_height,
        borderRadius: 12,
    },
    textContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignSelf: 'flex-end',
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent background for better text visibility
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
        ...StyleSheet.absoluteFillObject, // 填滿整個容器
        backgroundColor: 'rgba(128, 128, 128, 0.8)', // 半透明灰色，更明顯
        justifyContent: 'center',
        alignItems: 'center',
    },
    lockIcon: {
        opacity: 0.9,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
        opacity: 0.9,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    // 非激活狀態的按鈕樣式
    inactiveButton: {
        opacity: 0.8, // 略微降低不活躍章節的不透明度
    },
    // 禁用狀態的按鈕樣式
    disabledButton: {
        opacity: 0.9,
    },
    // 非激活狀態的遮罩
    inactiveOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // 輕微灰暗，但仍然可見
    },
});
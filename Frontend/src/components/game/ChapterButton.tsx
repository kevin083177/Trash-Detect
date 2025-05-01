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
    onPress 
}: {
    chapter: Chapter, 
    unlocked: boolean, 
    isActive?: boolean, 
    onPress: () => void
}) {
    return (
        <TouchableOpacity 
            onPress={onPress} 
            disabled={!unlocked}
            style={[
                styles.buttonContainer,
                !isActive && styles.inactiveButton
            ]}
            activeOpacity={0.8}
        >
            <ImageBackground 
                source={{ uri: chapter.banner_image.url }} 
                style={styles.banner}
                imageStyle={styles.bannerImage}
            >
                {/* 未解鎖遮罩 */}
                {!unlocked && (
                    <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={50} color="white" style={styles.lockIcon} />
                    </View>
                )}
                
                {/* 非激活狀態遮罩 */}
                {!isActive && (
                    <View style={styles.inactiveOverlay}>
                    </View>
                )}
                
                {/* 章節名稱 */}
                <View style={styles.textContainer}>
                    <Text style={styles.chapterName}>
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
    lockOverlay: {
        ...StyleSheet.absoluteFillObject, // 填滿整個容器
        backgroundColor: 'rgba(128, 128, 128, 0.7)', // 半透明灰色
        justifyContent: 'center',
        alignItems: 'center',
    },
    lockIcon: {
        opacity: 0.9,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: 16,
        borderRadius: 50,
    },
    // 新增：非激活狀態的按鈕樣式
    inactiveButton: {
        opacity: 0.8, // 略微降低不活躍章節的不透明度
    },
    // 新增：非激活狀態的遮罩
    inactiveOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // 輕微灰暗，但仍然可見
    },
});
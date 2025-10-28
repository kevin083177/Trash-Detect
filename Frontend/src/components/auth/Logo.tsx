import React, { useEffect, useState } from "react";
import { View, Image, Text, StyleSheet, Keyboard } from "react-native";

export default function Logo ({ fontColor }: { fontColor?: string }){
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setTimeout(() => {
                    setKeyboardVisible(false);
                }, 200);
            }
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    if (isKeyboardVisible) return null;

    return (
        <View style={styles.logoRow}>
            <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logoImage}
            />
            <Text style={[styles.logoText, { color: fontColor || '#000'}]}>Garbi</Text>
        </View>
    ) 
}

const styles = StyleSheet.create({
    logoRow: {
        position: 'relative',
        marginBottom: 24,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    logoImage: {
        width: 40,
        height: 40,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 600,
        fontFamily: "sans-serif-medium",
    },
})
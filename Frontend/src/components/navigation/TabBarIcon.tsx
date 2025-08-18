import React from "react";
import { Image, ImageSourcePropType, StyleSheet } from "react-native";
import { Grayscale } from 'react-native-color-matrix-image-filters';

interface TabBarIconProps {
    source: ImageSourcePropType;
    size?: number;
    focused?: boolean;
    isCamera?: boolean;
};

export function TabBarIcon({ size = 24, source, focused, isCamera }: TabBarIconProps) {
    const imageSource = typeof source === 'string' 
        ? { uri: source } 
        : source;
    
    if (isCamera) {
        return (
            <Image 
                source={imageSource}
                style={[
                    styles.icon, 
                    { 
                        width: size, 
                        height: size,
                        tintColor: '#FFFFFF'
                    }
                ]}
                resizeMode="contain"
            />
        );
    }
    
    const icon = (
        <Image 
            source={imageSource}
            style={[
                styles.icon, 
                { 
                    width: size, 
                    height: size,
                }
            ]}
            resizeMode="contain"
        />
    );

    return focused ? icon : <Grayscale>{icon}</Grayscale>;
}

const styles = StyleSheet.create({
    icon: {}
});
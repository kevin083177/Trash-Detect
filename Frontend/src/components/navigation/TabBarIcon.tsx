import React from "react";
import { Image, ImageSourcePropType, StyleSheet } from "react-native";

interface TabBarIconProps {
    source: ImageSourcePropType | string;
    color: string;
    size?: number;
    focused?: boolean;
};
  
export function TabBarIcon({ size, source, color, focused }: TabBarIconProps) {
    const imageSource = typeof source === 'string' 
        ? { uri: source } 
        : source;
        
    return (
        <Image 
            source={imageSource}
            style={[
                styles.icon, 
                { 
                    width: focused ? 40 : 36, 
                    height: focused ? 40 : 36,
                }
            ]}
            resizeMode="contain"
        />
    );
}

const styles = StyleSheet.create({
    icon: {
    }
});
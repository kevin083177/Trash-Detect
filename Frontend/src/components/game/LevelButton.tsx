import React from "react-native";
import { Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";

interface LevelButtonProps {
  sequence: number;
  name: string;
  unlock_requirement: number;
  isUnlocked: boolean;
  style?: object;
  onPress?: () => void;
}

export function LevelButton({ sequence, name, unlock_requirement, isUnlocked, style, onPress }: LevelButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={isUnlocked ? onPress : undefined}
      disabled={!isUnlocked}
    >
      <Image 
        source={isUnlocked ? require('@/assets/images/Level_Button.png') : require('@/assets/images/Level_Button_Disable.png')}
        style={[
          styles.levelImage,
        ]}
      />
      <Text style={styles.levelNumber}>{sequence}</Text>
      {/* <Text style={styles.levelName}>{name}</Text> */}
    </TouchableOpacity>
  );
}
    
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: 10,
  },
  levelImage: {
    width: 85,
    height: 85,
    resizeMode: 'contain'
  },
  levelNumber: {
    position: 'absolute',
    top: 15,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24
  },
  levelName: {
    position: 'absolute',
    top: 70,
    color: 'white',
    fontSize: 20,
    textAlign: 'center'
  }
});
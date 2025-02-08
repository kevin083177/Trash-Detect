import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [torch, setTorch] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();

  const toggleTorch = () => {
    setTorch(prev => !prev);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} enableTorch={torch}>
        {/* 半透明上部分 */}
        <View style={styles.overlaySection} />
        
        <View style={styles.centerRow}>
          {/* 半透明左側 */}
          <View style={styles.overlaySection} />
          
          {/* 掃描框 */}
          <View style={styles.scanFrame}>
            {/* 四個角落 */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          
          {/* 半透明右側 */}
          <View style={styles.overlaySection} />
        </View>
        
        {/* 半透明下部分 */}
        <View style={[styles.overlaySection, styles.bottomSection]}>
          <TouchableOpacity 
            style={[styles.flashlightContainer, torch && styles.flashlightActive]} 
            onPress={toggleTorch}
          >
            <Ionicons 
              name={torch ? "flashlight" : "flashlight-outline"} 
              size={28} 
              color={torch ? "#000" : "#FFF"} 
            />
            <Text style={[styles.flashlightText, torch && styles.flashlightTextActive]}>
              {torch ? '關閉手電筒' : '開啟手電筒'}
            </Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlaySection: {
    flex: 1,
  },
  centerRow: {
    flexDirection: 'row',
    height: 300,
  },
  scanFrame: {
    width: 300,
    height: '100%',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#fff',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderLeftWidth: 3,
    borderTopWidth: 3,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderRightWidth: 3,
    borderTopWidth: 3,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  bottomSection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  flashlightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(75, 75, 75, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  flashlightActive: {
    backgroundColor: '#FFFFFF',
  },
  flashlightText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  flashlightTextActive: {
    color: '#000000',
  },
});
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Dimensions, SafeAreaView, TouchableOpacity} from 'react-native';
import io, { Socket } from 'socket.io-client';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useFocusEffect } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import { Detection, DetectionResult } from '@/interface/Detection';
import { ControlButton, ConnectionStatus } from '@/components/scanner/ControlButton';
import { BoundingBox } from '@/components/scanner/BoundingBox';
import { ResultDisplay, translateCategory } from '@/components/scanner/ResultDisplay';
import { Timer } from '@/components/scanner/Timer';
import { Toast } from '@/components/Toast';
import { socket_url } from '@/api/api';
import { useUser } from '@/hooks/user';
import { useUserLevel } from '@/hooks/userLevel';
import { RecycleTipsType, RecycleValues } from '@/interface/Recycle';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { recycleTips } from '@/constants/recycleTips';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const detectSpeed = 100; // 1000 divide detectSpeed = fps
const detectTime = 2;

export default function Scanner() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [clientId, setClientId] = useState<string>('');

  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isDetectionLoading, setIsDetectionLoading] = useState<boolean>(false);
  
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [autoDetection, setAutoDetection] = useState<boolean>(true);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [boundingBoxEnabled, setBoundingBoxEnabled] = useState<boolean>(false);
  const [uploadEnabled, setUploadEnabled] = useState<boolean>(true);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const [detectionResults, setDetectionResults] = useState<Detection[]>([]);
  const [imageSize, setImageSize] = useState<{width: number, height: number} | null>(null);

  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [countdownTime, setCountdownTime] = useState(detectTime);
  const [targetItem, setTargetItem] = useState<string>('');
  const [canStartNewCountdown, setCanStartNewCountdown] = useState(true);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info'
  });

  const { addTrashStat } = useUser();
  const { setChapterUnlocked } = useUserLevel();

  const translateCategoryToAPI = (category: string): string => {
    const translations: { [key: string]: string } = {
      '鐵鋁罐': 'cans',
      '寶特瓶': 'bottles', 
      '紙容器': 'containers',
      '紙張': 'paper',
      '塑膠': 'plastic'
    };
    return translations[category] || category;
  };

  const getRandomRecycleTip = (trashType: keyof RecycleValues): string => {
    const tips = recycleTips[trashType];
    const randomIndex = Math.floor(Math.random() * tips.length);
    return tips[randomIndex];
  };

  const cropImageToSize = async (imagePath: string): Promise<string> => {
    try {
      const base64 = await RNFS.readFile(imagePath, 'base64');
      const dataUri = `data:image/jpeg;base64,${base64}`;
      return dataUri;
    } catch (error) {
      throw error;
    }
  };

  // 開始倒數計時
  const startCountdown = (itemName: string) => {
    if (!uploadEnabled) return;
    setIsCountdownActive(true);
    setTargetItem(itemName);
    setCountdownTime(detectTime);
    setCanStartNewCountdown(false);

    countdownInterval.current = setInterval(() => {
      if (!autoDetection || !uploadEnabled) {
        resetCountdown();
        return;
      }
      setCountdownTime(prev => {
        const newTime = prev - 1;

        if (newTime < 0) {
          clearInterval(countdownInterval.current!);
          countdownInterval.current = null;
          completeCountdown(itemName);
          return 0;
        }

        return newTime;
      });
    }, 1000);
  };

  // 重置倒數計時
  const resetCountdown = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    setIsCountdownActive(false);
    setCountdownTime(detectTime);
    setTargetItem('');
  };

  const completeCountdown = async (itemName: string) => {
    resetCountdown();
    try {
      const trashType = translateCategoryToAPI(itemName) as keyof RecycleValues;
      const totalTrash = await addTrashStat(trashType);
      
      if (totalTrash === 1) {
        await setChapterUnlocked(1);
      }

      const randomTip = getRandomRecycleTip(trashType);
      setNotification({
        visible: true,
        message: randomTip,
        type: 'success'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      setNotification({
        visible: true,
        message: `更新失敗: ${errorMessage}`,
        type: 'error'
      });
    }
  };

  useEffect(() => {
    if (!autoDetection || !isCountdownActive) return;

    const currentDetection = detectionResults.length === 1 ? detectionResults[0] : null;
    const currentItemName = currentDetection ? translateCategory(currentDetection.category) : null;

    if (!currentItemName || currentItemName !== targetItem) {
      resetCountdown();
    }
  }, [detectionResults, targetItem, isCountdownActive, autoDetection]);

  useEffect(() => {
    if (!autoDetection || !uploadEnabled) {
      setCanStartNewCountdown(true);
      resetCountdown();
      return;
    }

    const currentDetection = detectionResults.length === 1 ? detectionResults[0] : null;
    
    if (!currentDetection) {
      setCanStartNewCountdown(true);
      return;
    }

    if (currentDetection && canStartNewCountdown && !isCountdownActive) {
      const itemName = translateCategory(currentDetection.category);
      startCountdown(itemName);
    }
  }, [detectionResults, canStartNewCountdown, isCountdownActive, autoDetection]);

  const initializeSocket = () => {
    return new Promise<Socket>((resolve, reject) => {
      setStatus('connecting');
      const sock = io(socket_url, { 
        transports: ['websocket'], 
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      sock.on('connect', () => {
        setStatus('connected');
        resolve(sock);
      });
      
      sock.on('connected', (data: { client_id: string }) => {
        setClientId(data.client_id);
      });
      
      sock.on('connect_error', err => {
        setStatus('error');
        setIsCapturing(false);
        reject(err);
      });
      
      sock.on('disconnect', (reason) => {
        setStatus('disconnected');
        setIsCapturing(false);
      });
      
      sock.on('reconnect', (attemptNumber) => {
        setStatus('connected');
      });
      
      sock.on('reconnect_error', (error) => {
        setStatus('error');
      });
      
      sock.on('detection_result', (res: DetectionResult) => {
        setDetectionResults(res.detections);
        setImageSize(res.image_size);
        setIsCapturing(false);
      });
      
      sock.on('error', err => {
        setIsCapturing(false);
      });

      setSocket(sock);
    });
  };

  useFocusEffect(
    useCallback(() => {
      const initialize = async () => {
        try {
          if (!hasPermission) {
            const permission = await requestPermission();
            if (!permission) {
              Alert.alert('權限被拒絕', '需要相機權限才能使用');
              return;
            }
          }

          if (hasPermission && device) {
            setIsCameraActive(true);
            
            try {
              await initializeSocket();
            } catch (error) {
              console.warn('自動連接socket失敗:', error);
            }
          }
        } catch (error) {
          Alert.alert('錯誤', '初始化相機失敗');
        }
      };

      initialize();

      return () => {
        if (detectionInterval.current) {
          clearInterval(detectionInterval.current);
          detectionInterval.current = null;
        }
        
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
          countdownInterval.current = null;
        }
        
        if (socket) {
          socket.disconnect();
        }
        setSocket(null);
        
        setIsCameraActive(false);
        setStatus('disconnected');
        setDetectionResults([]);
        setImageSize(null);
        setIsCapturing(false);
        setIsDetectionLoading(false);
        
        setIsCountdownActive(false);
        setCountdownTime(detectTime);
        setTargetItem('');
        setCanStartNewCountdown(true);
      };
    }, [hasPermission, device, requestPermission])
  );

  const captureAndDetect = async () => {
    if (
        !autoDetection ||
        !socket ||
        status !== 'connected' ||
        !cameraRef.current ||
        isCapturing ||
        notification.visible
    ) {
      if (!autoDetection) {
        setDetectionResults([]);
      }
      return;
    }
    try {
      setIsCapturing(true);
      
      const photo = await cameraRef.current.takeSnapshot({
        quality: 50,
      });
      
      if (!photo.path) {
        throw new Error('拍照沒有返回路徑');
      }

      if (!socket.connected) {
        throw new Error('Socket 連接已斷開');
      }
      
      const processedImage = await cropImageToSize(photo.path);
      const imageSize = processedImage.length;
      
      socket.emit('detect_image', { 
        image: processedImage, 
        timestamp: Date.now(),
        size: imageSize
      });
      
      try {
        await RNFS.unlink(photo.path);
      } catch (unlinkError) {
      }
      
    } catch (error) {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    if (isCameraActive && socket && status === 'connected' && autoDetection) {
      
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }

      detectionInterval.current = setInterval(() => {
        captureAndDetect();
      }, detectSpeed);

    }

    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
        detectionInterval.current = null;
      }
    };
  }, [isCameraActive, socket, status, autoDetection, notification.visible]);

  const handleAutoDetection = async () => {
    const nextState = !autoDetection;
    
    if (nextState) {
      if (socket && socket.connected) {
        setAutoDetection(true);
        return;
      }
      
      setIsDetectionLoading(true);
      
      try {
        await initializeSocket();
        setAutoDetection(true);
      } catch (error) {
        Alert.alert('連接失敗', '無法連接到檢測服務器');
      } finally {
        setIsDetectionLoading(false);
      }
    } else {
      setAutoDetection(false);
      setUploadEnabled(false);
      setBoundingBoxEnabled(false);
      setDetectionResults([]);
      
      if (socket) {
        socket.disconnect();
      }
      setSocket(null);
      setStatus('disconnected');
    }
  };

  const buttonPress = (buttonType: 'upload' | 'boundingBox') => {
    if (!autoDetection) {
      handleAutoDetection();
      return;
    }

    if (buttonType === 'upload') {
      setUploadEnabled(prev => !prev);
    } else if (buttonType === 'boundingBox') {
      setBoundingBoxEnabled(prev => !prev);
    }
  };

  const handleToastHide = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      {!hasPermission ? (
        <View style={styles.loadingCamera}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>正在請求相機權限...</Text>
        </View>
      ) : !isCameraActive || !device ? (
        <View style={styles.loadingCamera}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>正在啟動相機...</Text>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={device}
            isActive={true}
            photo={true}
            torch={torchEnabled ? 'on' : 'off'}
            photoQualityBalance={"speed"}
          />
          
          {isDetectionLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.overlayLoadingText}>正在啟動檢測功能...</Text>
              </View>
            </View>
          )}
          
          {autoDetection && boundingBoxEnabled && detectionResults.map((detection, index) => (
            <BoundingBox 
              key={index} 
              detection={detection}
              imageSize={imageSize}
            />
          ))}

          <Timer
            detectTime={detectTime}
            timeLeft={countdownTime}
            targetItem={targetItem}
            isActive={isCountdownActive}
          />

          <SafeAreaView style={styles.rightControlsContainer}>
            <View style={styles.controlButtonsColumn}>
              <ControlButton 
                iconOn="toggle"
                iconOff="toggle-outline" 
                name="辨識"
                status={autoDetection} 
                onPress={handleAutoDetection}
              />
              <ControlButton
                iconOn="cloud-upload"
                iconOff="cloud-upload-outline"
                name="回收紀錄"
                status={uploadEnabled}
                onPress={() => buttonPress('upload')}
              />
              <ControlButton 
                iconOn="flashlight"
                iconOff='flashlight-outline'
                name="手電筒"
                status={torchEnabled} 
                onPress={() => setTorchEnabled(!torchEnabled)}
              />
              <ControlButton
                iconOn="eye"
                iconOff='eye-outline'
                name="預覽"
                status={boundingBoxEnabled}
                onPress={() => buttonPress('boundingBox')}
              />
            </View>
          </SafeAreaView>

          <ResultDisplay detections={detectionResults} />

          <Toast
            visible={notification.visible}
            position='bottom'
            message={notification.message}
            onHide={handleToastHide}
            style={styles.toast}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 20,
    zIndex: 1,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 50,
  },
  cameraContainer: { 
    flex: 1,
    position: 'relative',
  },
  camera: { 
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  overlayLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  rightControlsContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingTop: 12,
    paddingRight: 12,
  },
  controlButtonsColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  toast: {
    zIndex: 1000,
    elevation: 10,
  },
  loadingCamera: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
  },
});
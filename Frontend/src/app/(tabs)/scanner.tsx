import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Dimensions, SafeAreaView} from 'react-native';
import io, { Socket } from 'socket.io-client';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useFocusEffect } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import { Detection, DetectionResult } from '@/interface/Detection';
import { ControlButton, ConnectionStatus } from '@/components/scanner/ControlButton';
import { BoundingBox } from '@/components/scanner/BoundingBox';
import { StatusDot } from '@/components/scanner/StatusDot';
import { ResultDisplay, translateCategory } from '@/components/scanner/ResultDisplay';
import { Timer } from '@/components/scanner/Timer';
import Toast from '@/components/Toast';
import { socket_url, user_api } from '@/api/api';
import { asyncPost } from '@/utils/fetch';
import { tokenStorage } from '@/utils/tokenStorage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const detectSpeed = 100; // divide 1 = fps

export default function Scanner() {
  // Socket state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [clientId, setClientId] = useState<string>('');

  // Camera setup
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // Detection state
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [autoDetection, setAutoDetection] = useState<boolean>(true);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [boundingBoxEnabled, setBoundingBoxEnabled] = useState<boolean>(false);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const [detectionResults, setDetectionResults] = useState<Detection[]>([]);
  const [imageSize, setImageSize] = useState<{width: number, height: number} | null>(null);

  // Countdown timer state
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [countdownTime, setCountdownTime] = useState(3.0);
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

  // 文字轉換函數
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
    setIsCountdownActive(true);
    setTargetItem(itemName);
    setCountdownTime(3.0);
    setCanStartNewCountdown(false);

    countdownInterval.current = setInterval(() => {
      setCountdownTime(prev => {
        const newTime = prev - 0.1;
        if (newTime <= 0) {
          completeCountdown(itemName);
          return 0;
        }
        return newTime;
      });
    }, 100);
  };

  // 重置倒數計時
  const resetCountdown = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    setIsCountdownActive(false);
    setCountdownTime(3.0);
    setTargetItem('');
  };

  const completeCountdown = async (itemName: string) => {
    resetCountdown();
    
    try {
      const token = await tokenStorage.getToken();
      const trashType = translateCategoryToAPI(itemName);
      
      const response = await asyncPost(user_api.add_trash_stats, {
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: {
          "trash_type": trashType,
          "count": 1 
        }
      });

      if (response.status === 200) {
        setNotification({
          visible: true,
          message: '成功更新回收紀錄',
          type: 'success'
        });
      } else {
        setNotification({
          visible: true,
          message: `更新失敗 ${response.message}`,
          type: 'error'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      setNotification({
        visible: true,
        message: `更新失敗: ${errorMessage}`,
        type: 'error'
      });
    }
  };

  // 檢查倒數計時邏輯
  useEffect(() => {
    if (!autoDetection || !isCountdownActive) return;

    const currentDetection = detectionResults.length === 1 ? detectionResults[0] : null;
    const currentItemName = currentDetection ? translateCategory(currentDetection.category) : null;

    // 如果當前檢測到的物體與目標物體不符，重置倒數計時
    if (!currentItemName || currentItemName !== targetItem) {
      resetCountdown();
    }
  }, [detectionResults, targetItem, isCountdownActive, autoDetection]);

  // 檢查是否可以開始新的倒數計時
  useEffect(() => {
    if (!autoDetection) {
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

  useFocusEffect(
    useCallback(() => {
      let sock: Socket | null = null;
      
      const initialize = async () => {
        setStatus('connecting');
        setAutoDetection(true);
        sock = io(socket_url, { 
          transports: ['websocket'], 
          timeout: 10000,
          forceNew: true,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
        });
        setSocket(sock);

        sock.on('connect', () => {
          setStatus('connected');
        });
        
        sock.on('connected', (data: { client_id: string }) => {
          setClientId(data.client_id);
        });
        
        sock.on('connect_error', err => {
          setStatus('error');
          setIsCapturing(false);
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

        try {
          if (!hasPermission) {
            const permission = await requestPermission();
            if (!permission) {
              Alert.alert('權限被拒絕', '需要相機權限才能使用應用');
              return;
            }
          }

          if (hasPermission && device) {
            setIsCameraActive(true);
          }
        } catch (error) {
          Alert.alert('錯誤', '初始化相機失敗');
        }
      };

      initialize();

      return () => {
        // 清理檢測間隔
        if (detectionInterval.current) {
          clearInterval(detectionInterval.current);
          detectionInterval.current = null;
        }
        
        // 清理倒數計時
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
          countdownInterval.current = null;
        }
        
        // 斷開 Socket 連線
        if (sock) {
          sock.disconnect();
        }
        setSocket(null);
        
        // 停用相機
        setIsCameraActive(false);
        setStatus('disconnected');
        setDetectionResults([]);
        setImageSize(null);
        setIsCapturing(false);
        
        // 重置倒數計時狀態
        setIsCountdownActive(false);
        setCountdownTime(3.0);
        setTargetItem('');
        setCanStartNewCountdown(true);
      };
    }, [hasPermission, device, requestPermission])
  );

  // 拍照並發送檢測
  const captureAndDetect = async () => {
    if (
        !autoDetection ||
        !socket ||
        status !== 'connected' ||
        !cameraRef.current ||
        isCapturing
    ) {
      if (!autoDetection) {
        setDetectionResults([]);
      }
      return;
    }
    try {
      setIsCapturing(true);
      
      const photo = await cameraRef.current.takeSnapshot({
        quality: 10,
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
      
      // 清理臨時文件
      try {
        await RNFS.unlink(photo.path);
      } catch (unlinkError) {
      }
      
    } catch (error) {
      setIsCapturing(false);
    }
  };

  // 自動啟動即時檢測
  useEffect(() => {
    if (isCameraActive && socket && status === 'connected') {
      
      // 清理之前的間隔
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
  }, [isCameraActive, socket, status, autoDetection]);

  // 手動重連
  const reconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
  };

  return (
    <View style={styles.container}>
      {isCameraActive && device && hasPermission ? (
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
          
          {autoDetection && boundingBoxEnabled && detectionResults.map((detection, index) => (
            <BoundingBox 
              key={index} 
              detection={detection}
              imageSize={imageSize}
            />
          ))}

          {/* 倒數計時器 */}
          <Timer 
            timeLeft={countdownTime}
            targetItem={targetItem}
            isActive={isCountdownActive}
          />

          {/* 上方控制按鈕容器 */}
          <SafeAreaView style={styles.topContainer}>
            <View style={styles.controlContainer}>
              {/* 連接狀態圓點 */}
              <StatusDot status={status} onPress={reconnectSocket} />
              
              {/* 控制按鈕 */}
                <ControlButton 
                  type="auto" 
                  status={autoDetection} 
                  onPress={() => setAutoDetection(!autoDetection)} 
                />
                <ControlButton 
                  type="torch" 
                  status={torchEnabled} 
                  onPress={() => setTorchEnabled(!torchEnabled)} 
                />
                <ControlButton
                  type='bounding'
                  status={boundingBoxEnabled}
                  onPress={() => setBoundingBoxEnabled(!boundingBoxEnabled)}
                />
            </View>
          </SafeAreaView>

          {/* 結果顯示 */}
          <ResultDisplay detections={detectionResults} />

          <Toast
            visible={notification.visible}
            message={notification.message}
            type={notification.type}
            onHide={() => setNotification(prev => ({ ...prev, visible: false }))}
            style={styles.toast}
          />
        </View>
      ) : (
        <View style={styles.loadingCamera}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>
            {!hasPermission ? '正在請求相機權限...' : '正在啟動相機...'}
          </Text>
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
  
  cameraContainer: { 
    flex: 1,
    position: 'relative',
  },
  camera: { 
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  
  toast: {
    zIndex: 1000,
    elevation: 10,
  },
  
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
  },
  controlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
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
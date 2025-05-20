import React, { useState, useEffect, useRef } from "react";
import { Text, View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { useTensorflowModel } from 'react-native-fast-tflite';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { ActivityIndicator } from "react-native";
import { Canvas, Rect, Text as SkiaText, Group, useFont } from '@shopify/react-native-skia';
import { Worklets } from 'react-native-worklets-core';
import { useIsFocused } from '@react-navigation/native'; // 導入這個 Hook

// 取得螢幕尺寸
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// 模型輸入尺寸
const MODEL_IN_W = 640;
const MODEL_IN_H = 640;

// 偵測框型別
interface Detection { 
  x1: number; 
  y1: number; 
  x2: number; 
  y2: number; 
  score: number; 
  classId: number; 
}

// 定義物體類別名稱映射
const CLASS_NAMES = [
  "can", "container", "plastic", "plasticbottle"
];

export default function ScannerWithSkiaOverlay() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isResultsVisible, setResultsVisible] = useState(true);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const isFocused = useIsFocused(); // 使用這個 Hook 來追蹤 screen 是否處於焦點狀態

  // 不修改模型載入部分
  const model = useTensorflowModel(require('@/assets/model/v2.tflite'), 'android-gpu');
  const actualModel = model.state === 'loaded' ? model.model : undefined;
  const { resize } = useResizePlugin();

  // Skia 字型
  const font = useFont(require('@/assets/fonts/SpaceMono-Regular.ttf'), 14);
  
  // 追蹤相機和處理器的活躍狀態
  const [isCameraActive, setCameraActive] = useState(true);
  
  // 使用 ref 來追蹤組件掛載狀態
  const isMounted = useRef(true);

  useEffect(() => { 
    // 請求相機權限
    requestPermission(); 
    
    // 在組件卸載時設置為 false
    return () => {
      isMounted.current = false;
      
      // 確保在組件卸載時清空偵測結果
      setDetections([]);
    };
  }, [requestPermission]);

  // 追蹤頁面焦點和處理相機開關
  useEffect(() => {
    // 當頁面失去焦點時，關閉相機
    setCameraActive(isFocused);
    
    // 如果頁面失去焦點，清空偵測結果
    if (!isFocused) {
      setDetections([]);
    }
  }, [isFocused]);

  // JS callback: 更新 state
  function onDetect(dets: Detection[]) {
    // 確保組件還掛載著，避免在組件卸載後更新狀態
    if (isMounted.current && isCameraActive) {
      setDetections(dets);
    }
  }
  // 包裝成 worklet 可呼叫的 JS 函數
  const onDetectJS = Worklets.createRunOnJS(onDetect);

  // Frame Processor
  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      // 只在相機活躍且有模型時處理影格
      if (!actualModel || !isCameraActive) return;

      const resized = resize(frame, {
        scale: { width: MODEL_IN_W, height: MODEL_IN_H },
        pixelFormat: 'rgb',
        dataType: 'float32',
      });

      const outputs = actualModel.runSync([resized]) as Float32Array[];
      if (outputs.length === 0) return;

      const data = outputs[0];
      const [_, channels, numBoxes] = actualModel.outputs[0].shape;
      const dets: Detection[] = [];
      
      for (let i = 0; i < numBoxes; i++) {
        const score = data[4 * numBoxes + i];
        // 提高信心閾值到0.5以過濾低質量檢測
        if (score < 0.5) continue;
        
        // 直接從模型獲取座標點 (xyxy 格式)
        const x1 = data[0 * numBoxes + i];
        const y1 = data[1 * numBoxes + i];
        const x2 = data[2 * numBoxes + i];
        const y2 = data[3 * numBoxes + i];
        
        // 獲取class ID - 確保是整數
        const classId = Math.round(data[5 * numBoxes + i]);
        
        // 存儲原始座標值，不做任何轉換
        dets.push({ x1, y1, x2, y2, score, classId });
      }
      
      // 呼叫 JS 更新
      onDetectJS(dets);
    },
    [actualModel, isCameraActive] // 添加 isCameraActive 作為依賴，當相機狀態變化時重新創建處理器
  );

  return (
    <View style={styles.container}>
      {hasPermission && device ? (
        <>
          <Camera
            device={device}
            style={StyleSheet.absoluteFill}
            isActive={isCameraActive && isFocused} // 根據頁面焦點和活躍狀態決定相機是否活躍
            frameProcessor={isCameraActive ? frameProcessor : undefined} // 只在相機活躍時使用 frameProcessor
            pixelFormat="yuv"
          />
          {/* Skia Overlay - 只在相機活躍時渲染 */}
          {isCameraActive && (
            <Canvas style={StyleSheet.absoluteFill}>
              {font && detections.map((d, i) => {
                // 模型輸出的座標是相對於輸入尺寸的，所以需要正確映射到螢幕尺寸
                const left = d.x1 * SCREEN_W;
                const top = d.y1 * SCREEN_H;
                const right = d.x2 * SCREEN_W;
                const bottom = d.y2 * SCREEN_H;
                const boxW = right - left;
                const boxH = bottom - top;
                
                // 線條顏色基於類別（示例）
                const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"];
                const color = colors[d.classId % colors.length];
                
                // 獲取類別名稱（如果可用）
                const className = CLASS_NAMES[d.classId] || `Class ${d.classId}`;
                
                return (
                  <Group key={i}>
                    <Rect
                      x={left}
                      y={top}
                      width={boxW}
                      height={boxH}
                      style="stroke"
                      strokeWidth={2}
                      color={color}
                    />
                    <SkiaText
                      x={left + 4}
                      y={top - 4}  // 將標籤放在框的上方
                      text={`${className} (${(d.score * 100).toFixed(0)}%)`}
                      font={font}
                      color={color}
                    />
                  </Group>
                );
              })}
            </Canvas>
          )}
          
          {/* 辨識結果面板 - 只在相機活躍和結果可見時渲染 */}
          {isCameraActive && isResultsVisible && (
            <View style={styles.resultsPanel}>
              <Text style={styles.resultTitle}>辨識結果</Text>
              <ScrollView style={styles.resultScroll}>
                {detections.length === 0 ? (
                  <Text style={styles.noResultText}>尚未偵測到物體</Text>
                ) : (
                  detections.map((d, i) => {
                    const className = CLASS_NAMES[d.classId] || `Class ${d.classId}`;
                    return (
                      <View key={i} style={styles.resultItem}>
                        <Text style={styles.resultText}>
                          {className} - 置信度: {(d.score * 100).toFixed(1)}%
                        </Text>
                        <Text style={styles.resultDetail}>
                          位置: ({(d.x1 * SCREEN_W).toFixed(0)}, {(d.y1 * SCREEN_H).toFixed(0)}) 
                          至 ({(d.x2 * SCREEN_W).toFixed(0)}, {(d.y2 * SCREEN_H).toFixed(0)})
                        </Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}
        </>
      ) : (
        <Text>No Camera available.</Text>
      )}

      {model.state === 'loading' && (
        <ActivityIndicator size="small" color="white" />
      )}
      {model.state === 'error' && (
        <Text>Failed to load model! {model.error.message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    maxHeight: SCREEN_H * 0.3,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  resultTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  resultScroll: {
    maxHeight: SCREEN_H * 0.25,
  },
  resultItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    padding: 8,
    marginVertical: 4,
  },
  resultText: {
    color: 'white',
    fontSize: 14,
  },
  resultDetail: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  noResultText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    padding: 10,
  }
});

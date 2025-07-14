import cv2
import numpy as np
from ultralytics import YOLO
from models import DetectionResult, DetectionResponse
import base64
from pathlib import Path

class DetectionService:
    def __init__(self):
        self.model = None
        self.confidence_threshold = 0.85
        self.dir = Path(__file__).resolve().parent
        self._load_model()
        
    def _load_model(self):
        """載入YOLO模型"""
        try:
            dir = Path(__file__).resolve().parent
            model_path = dir.parent / "detect_models" / "yolov8m.pt"
            self.model = YOLO(model_path)
            print("YOLO model loaded successfully")
        except Exception as e:
            print(f"Error loading YOLO model: {str(e)}")
            raise e
        
    def detect_objects(self, image_base64: str) -> DetectionResponse:
        """
        辨識圖像中的物體
        Args:
            image_base64: base64編碼的圖像
        Returns:
            DetectionResponse: 辨識結果
        """
        try:
            # 解碼base64圖像
            image = self._decode_base64_image(image_base64)
            
            # 執行辨識
            results = self.model(image, imgsz=640, verbose=False)
            
            # 處理結果
            detections = self._process_results(results)
            
            # 獲取圖像尺寸
            height, width = image.shape[:2]
            image_size = {"width": width, "height": height}
            
            return DetectionResponse(detections, image_size)
        
        except Exception as e:
            print(f"Detection error: {str(e)}")
            raise e
        
    def _decode_base64_image(self, image_base64: str):
        """解碼base64圖像"""
        try:
            # 移除base64前綴
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            
            # 解碼
            image_data = base64.b64decode(image_base64)
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            return image
        except Exception as e:
            raise ValueError(f"Invalid base64 image: {str(e)}")
        
    def _process_results(self, results) -> list:
        """處理YOLO辨識結果"""
        detections = []
        
        if results and len(results[0].boxes) > 0:
            for box in results[0].boxes:
                conf = box.conf.item()
                
                # 過濾低置信度的結果
                if conf < self.confidence_threshold:
                    continue
                
                cls_id = int(box.cls.item())
                cls_name = self.model.names[cls_id]
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                
                detection = DetectionResult(
                    category=cls_name,
                    confidence=round(conf, 2),
                    bbox=[x1, y1, x2, y2],
                )
                
                detections.append(detection)
        
        return detections
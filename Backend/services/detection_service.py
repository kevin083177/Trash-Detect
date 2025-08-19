from typing import Any, Dict, List
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
        self.iou_threshold = 0.7
        
        self.aggregation_mode = 'noisy_or' # Options: 'noisy_or', 'max', 'lse', 'sum', or None
        self.agg_iou_threshold = 0.4
        self.agg_lse_r = 4.0
        
        self.dir = Path(__file__).resolve().parent
        self.model_version = "l"
        
        self.child_to_parent_name_map = {
            'can': 'can',
            'container_foil_packaging': 'container', 
            'paper': 'paper',
            'paper_box': 'container',
            'paper_cup': 'container',
            'plastic_box': 'plastic',
            'plastic_cup': 'plastic',
            'plastic_cup_lid': 'plastic',
            'plastic_toiletry_bottle': 'plastic',
            'plastic_washbasin': 'plastic',
            'plasticbottle': 'plasticbottle'
        }
        
        self.parent_names = ['plastic', 'paper', 'can', 'container', 'plasticbottle']
       
        self._load_model()
        self._build_class_mapping()
        
    def _load_model(self):
        """載入YOLO模型"""
        try:
            model_path = self.dir.parent / "detect_models" / f"yolov11{self.model_version}.pt"
            self.model = YOLO(model_path)
        except Exception as e:
            print(f"Error loading YOLO model: {str(e)}")
            raise e
    
    def _build_class_mapping(self):
        """建立類別映射表 (11 -> 5)"""
        try:
            child_names = self.model.names
            
            child_name_to_id = {name: i for i, name in child_names.items()}
            parent_name_to_id = {name: i for i, name in enumerate(self.parent_names)}
            
            self.child_to_parent_id_map = {}
            for child_name, parent_name in self.child_to_parent_name_map.items():
                if child_name in child_name_to_id:
                    child_id = child_name_to_id[child_name]
                    parent_id = parent_name_to_id[parent_name]
                    self.child_to_parent_id_map[child_id] = parent_id
                    
        except Exception as e:
            print(f"Error building class mapping: {str(e)}")
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
            iou_for_predict = 0.95 if self.aggregation_mode else self.iou_threshold # 聚合模式 iou 調整至 95 %
            results = self.model.predict(
                source=image, 
                verbose=False,
                augment=False,
                imgsz=896,
                conf=self.confidence_threshold,
                iou=iou_for_predict
            )
            
            # 處理結果
            detections = self._process_and_aggregate_results(results, image.shape)
            
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
        
    def _process_and_aggregate_results(self, results, image_shape) -> List[DetectionResult]:
        """處理並聚合YOLO辨識結果"""
        if not results or len(results[0].boxes) == 0:
            return []
        
        boxes = results[0].boxes
        
        aggregated_results = self._aggregate_boxes(boxes)
        
        detections = []
        for box_data in aggregated_results:
            conf = float(box_data["conf"])
            
            # 過濾低置信度結果
            if conf < self.confidence_threshold:
                continue
            
            # 檢查面積閾值
            x1, y1, x2, y2 = map(int, box_data["xyxy"])
            area_ratio = ((x2 - x1) * (y2 - y1)) / (image_shape[0] * image_shape[1])
            if area_ratio < 0.005:
                continue
            
            parent_cls_id = int(box_data["cls"])
            if parent_cls_id < len(self.parent_names):
                category = self.parent_names[parent_cls_id]
            else:
                continue
            
            detection = DetectionResult(
                category=category,
                confidence=round(conf, 2),
                bbox=[x1, y1, x2, y2]
            )
            
            detections.append(detection)
        
        return detections
    
    def _aggregate_boxes(self, boxes) -> List[Dict[str, Any]]:
        if self.aggregation_mode is None or not len(boxes):
            return [{"xyxy": box.xyxy[0], "conf": box.conf[0], "cls": box.cls[0]} for box in boxes]

        dets = sorted(
            [{"xywh": b.xywh[0].cpu().numpy(), "conf": float(b.conf[0]), "cls": int(b.cls[0])} for b in boxes],
            key=lambda d: -d["conf"]
        )
        
        aggregated_results = []
        taken = set()
        
        for i in range(len(dets)):
            if i in taken:
                continue
            
            child_i_id = dets[i]["cls"]
            parent_i_id = self.child_to_parent_id_map.get(child_i_id)
            
            if parent_i_id is None:
                continue

            cluster = [dets[i]]
            taken.add(i)
            
            # 尋找相同父類別且 iou 重疊的檢測框
            for j in range(i + 1, len(dets)):
                if j in taken:
                    continue
                
                child_j_id = dets[j]["cls"]
                parent_j_id = self.child_to_parent_id_map.get(child_j_id)
                if parent_j_id is None:
                    continue

                if parent_i_id == parent_j_id:
                    iou = self._box_iou(dets[i]["xywh"], dets[j]["xywh"])
                    if iou > self.agg_iou_threshold:
                        cluster.append(dets[j])
                        taken.add(j)
            
            # 聚合分數
            scores = [d["conf"] for d in cluster]
            new_score = self._agg_scores(scores, self.aggregation_mode, self.agg_lse_r) if len(cluster) > 1 else scores[0]
            
            # 使用分數最高的那個為檢測框的位置
            final_box_pos = cluster[0] 
            x, y, w, h = final_box_pos["xywh"]

            aggregated_results.append({
                "xyxy": np.array([x - w/2, y - h/2, x + w/2, y + h/2]),
                "conf": new_score,
                "cls": parent_i_id
            })
            
        return aggregated_results
    
    def _box_iou(self, box1: np.ndarray, box2: np.ndarray) -> float:
        """計算兩個框的 iou"""
        def to_xyxy(box):
            x, y, w, h = box
            return np.array([x, y, x + w, y + h])
        
        b1, b2 = to_xyxy(box1), to_xyxy(box2)
        inter_x1, inter_y1 = max(b1[0], b2[0]), max(b1[1], b2[1])
        inter_x2, inter_y2 = min(b1[2], b2[2]), min(b1[3], b2[3])
        inter_area = max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)
        b1_area = (b1[2] - b1[0]) * (b1[3] - b1[1])
        b2_area = (b2[2] - b2[0]) * (b2[3] - b2[1])
        return inter_area / (b1_area + b2_area - inter_area + 1e-6)

    def _agg_scores(self, scores: List[float], mode: str, r: float) -> float:
        scores_np = np.asarray(scores, dtype=float)
        if mode == "sum": 
            return float(np.sum(scores_np))
        if mode == "max": 
            return float(np.max(scores_np))
        if mode == "lse": 
            return float((1.0 / r) * np.log(np.exp(r * scores_np).sum()))
        if mode == "noisy_or": 
            return float(1.0 - np.prod(1.0 - scores_np))
        raise ValueError(f"Unknown aggregation: {mode}")
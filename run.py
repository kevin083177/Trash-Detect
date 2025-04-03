import cv2, time, threading, queue
import numpy as np
from PIL import Image
from predict import TFLiteObjectDetection
from concurrent.futures import ThreadPoolExecutor

class VideoCapture:
    def __init__(self, camera_source):
        if isinstance(camera_source, str) and camera_source.startswith('http'):
            print(f"嘗試連接 IP 相機: {camera_source}")
            self.cap = cv2.VideoCapture(camera_source, cv2.CAP_FFMPEG)
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)
        else:
            print(f"嘗試連接本地相機: {camera_source}")
            self.cap = cv2.VideoCapture(camera_source)
            self.cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
            self.cap.set(cv2.CAP_PROP_FPS, 30)
        
        if not self.cap.isOpened():
            raise ValueError(f"無法開啟相機源: {camera_source}")
            
        self.q = queue.Queue(maxsize=3)
        self.stop_threads = False
        
        self.th = threading.Thread(target=self._reader)
        self.th.daemon = True
        self.th.start()

    def _reader(self):
        while not self.stop_threads:
            ret, frame = self.cap.read()
            if not ret:
                time.sleep(0.01)
                continue
                
            if not self.q.empty():
                try:
                    self.q.get_nowait()
                except queue.Empty:
                    pass
            self.q.put(frame)

    def read(self):
        try:
            return True, self.q.get(timeout=1.0)
        except queue.Empty:
            return False, None

    def terminate(self):
        self.stop_threads = True
        if self.th.is_alive():
            self.th.join()  
        self.cap.release()

class ObjectDetection():
    def __init__(self):
        self.model_version = 'v2'
        self.model_path = self.model_version + '/model.tflite'
        self.labels_path = self.model_version + '/labels.txt'
        self.camera_ip = 'http://192.168.67.55:8081'
        
        # 設定相機原始解析度
        self.camera_width = 1920
        self.camera_height = 1080
        
        # 設定目標解析度（保持16:9比例）
        self.scale_factor = 0.9
        self.target_height = int(self.camera_width * self.scale_factor)
        self.target_width = int(self.camera_height * self.scale_factor)
        
        # 處理用的解析度
        self.process_width = 3200
        self.process_height = 1800  # 保持16:9
        
        # 創建線程池
        self.executor = ThreadPoolExecutor(max_workers=3)
        self.last_predictions = []
        self.prediction_lock = threading.Lock()

        # 信心度閾值（初始值）
        self.confidence_threshold = 50  # 用於trackbar的整數值(0-100)
        
        self.color_map = {
            "Plastic" :(255, 0, 0),
            "Bottle" : (0, 255, 0),
            "Paper": (0, 0, 255),
            "Container": (25, 225, 220),
            "Can": (255, 192, 0)
        }
        
    def create_camera_capture(self):
        """嘗試創建相機捕捉"""
        try:
            # 首先嘗試 IP 相機
            print("嘗試連接 IP 相機...")
            cap = VideoCapture(self.camera_ip)
            print("成功連接 IP 相機")
            return cap
        except Exception as e:
            print(f"IP 相機連接失敗: {e}")
            print("嘗試切換到內建相機...")
            try:
                # 如果 IP 相機失敗，切換到內建相機
                cap = VideoCapture(0)
                print("成功連接內建相機")
                return cap
            except Exception as e:
                print(f"內建相機也連接失敗: {e}")
                return None
            
    def load_model(self):
        try:
            with open(self.labels_path, 'r', encoding='utf-8') as f:
                labels = [label.strip() for label in f.readlines()]
            return TFLiteObjectDetection(self.model_path, labels)
        except Exception as e:
            print(f"載入模型時發生錯誤: {e}")
            return None

    def process_frame(self, frame, model: TFLiteObjectDetection):
        # 保持長寬比的縮放
        small_frame = cv2.resize(frame, (self.process_width, self.process_height),
                               interpolation=cv2.INTER_AREA)
        pil_image = Image.fromarray(cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB))
        predictions = model.predict_image(pil_image)
        
        with self.prediction_lock:
            self.last_predictions = predictions
            
        return predictions

    def on_trackbar(self, value):
        """Trackbar 回調函數"""
        self.confidence_threshold = value

    def draw_predictions(self, frame: np.ndarray, predictions):
        """根據當前信心度閾值繪製預測結果"""
        height, width = frame.shape[:2]
        # 將 trackbar 的值轉換為 0-1 範圍
        threshold = self.confidence_threshold / 100.0
        
        high_confidence_preds = [pred for pred in predictions 
                               if pred['probability'] >= threshold]
        
        for pred in high_confidence_preds:
            box = pred['boundingBox']
            x = int(box['left'] * width)
            y = int(box['top'] * height)
            w = int(box['width'] * width)
            h = int(box['height'] * height)
            
            tagName = pred['tagName']
            
            color = self.color_map.get(tagName, (255, 255, 255))
            confidence = pred['probability']
            
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
            
            label = f"{pred['tagName']}: {confidence:.2f}"
            cv2.putText(frame, label, (x, y - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 2, color, 2)
        
        return frame

    def resize_frame(self, frame: np.ndarray):
        """保持長寬比的調整大小"""
        # 先旋轉90度
        frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
        
        # 計算新的尺寸
        h, w = frame.shape[:2]
        aspect_ratio = w / h
        
        # 根據旋轉後的長寬比計算新尺寸
        if w > h:
            new_width = self.target_width
            new_height = int(new_width / aspect_ratio)
        else:
            new_height = self.target_height
            new_width = int(new_height * aspect_ratio)
            
        # 重新調整大小
        return cv2.resize(frame, (new_width, new_height), 
                         interpolation=cv2.INTER_AREA)

    def run_webcam_detection(self):
        model = self.load_model()
        if model is None:
            return
        
        cap = self.create_camera_capture()
        if cap is None:
            return
        
        # 創建視窗和 Trackbar
        window_name = 'Object Detection'
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(window_name, int(self.target_width // 2), int(self.target_height // 2))
        cv2.setWindowProperty(window_name, cv2.WND_PROP_TOPMOST, 1)
        
        # 創建 Trackbar
        cv2.createTrackbar('Confidence', window_name, 
                          self.confidence_threshold, 100, self.on_trackbar)
        
        processing_times = []
        future = None
        
        try:
            while True:
                loop_start = time.time()
                
                ret, frame = cap.read()
                if not ret or frame is None:
                    time.sleep(0.01)
                    continue
                
                # 調整影像大小
                frame = self.resize_frame(frame)
                
                # 異步處理預測
                if future is None or future.done():
                    future = self.executor.submit(self.process_frame, frame.copy(), model)
                
                # 使用上一幀的預測結果
                with self.prediction_lock:
                    predictions = self.last_predictions
                    for pred in predictions:
                        if pred['probability'] > (self.confidence_threshold / 100.0):
                            print(pred['tagName'], pred['probability'])
                # 根據當前閾值繪製結果
                frame = self.draw_predictions(frame, predictions)
                
                # 計算並顯示 FPS
                processing_time = time.time() - loop_start
                processing_times.append(processing_time)
                if len(processing_times) > 30:
                    processing_times.pop(0)
                
                fps = 1.0 / np.mean(processing_times)
                cv2.putText(frame, f"FPS: {fps:.1f}", (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                
                cv2.imshow(window_name, frame)
                
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                    
        finally:
            cap.terminate()
            cv2.destroyAllWindows()
            self.executor.shutdown()

if __name__ == "__main__":
    detector = ObjectDetection()
    detector.run_webcam_detection()
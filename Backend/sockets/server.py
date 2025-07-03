from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import uuid
from utils import logger
from services import DetectionService

def start_server(port, detection_service: DetectionService=None):
    """啟動 Socket 服務器"""
    
    socket_app = Flask(__name__)
    CORS(socket_app, resources={r"/*": {"origins": "*"}})
    
    # 創建SocketIO
    socketio = SocketIO(socket_app, cors_allowed_origins="*", logger=False, engineio_logger=False)
    
    @socket_app.route('/')
    def test():
        try:
            return send_from_directory('', 'test.html')
        except Exception as e:
            return f"測試頁面載入失敗: {str(e)}"
    
    # SocketIO 事件處理
    @socketio.on('connect')
    def handle_connect():
        client_id = str(uuid.uuid4())
        logger.info(f"Client connected: {client_id}")
        emit('connected', {'client_id': client_id})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        logger.info("Client disconnected")
    
    @socketio.on('detect_image')
    def handle_detect_image(data):
        """處理圖像檢測請求"""
        image_data = data.get('image')
        timestamp = data.get('timestamp')
        
        if not image_data:
            emit('error', {'message': 'No image data'})
            return
        
        # 執行檢測
        detection_response = detection_service.detect_objects(image_data)
        
        # 準備結果
        result = {
            'timestamp': timestamp,
            'detections': [
                {
                    'category': det.category,
                    'confidence': det.confidence,
                    'bbox': det.bbox
                }
                for det in detection_response.detections
            ],
            'image_size': detection_response.image_size
        }
        
        # 發送結果
        emit('detection_result', result)
        
        # logger.info(f"Detection completed: {len(detection_response.detections)} objects")
    try:
        socketio.run(
            socket_app,
            host='0.0.0.0',
            port=port,
            debug=False,
            use_reloader=False
        )
    except Exception as e:
        logger.error(f"WebRTC Server error: {str(e)}")
        raise e
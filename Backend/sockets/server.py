from flask import Flask, send_from_directory, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import uuid
from utils import logger, verify_token
from services import DetectionService, SystemService

def start_server(port, detection_service: DetectionService=None):
    """啟動 Socket 服務器"""
    
    socket_app = Flask(__name__)
    CORS(socket_app, resources={r"/*": {"origins": "*"}})
    
    socketio = SocketIO(socket_app, cors_allowed_origins="*", logger=False, engineio_logger=False)
    
    system_service = SystemService(socketio)
    
    @socket_app.route('/')
    def test():
        try:
            return send_from_directory('', 'test.html')
        except Exception as e:
            return f"測試頁面載入失敗: {str(e)}"
    
    @socketio.on('connect')
    def handle_connect():
        client_id = request.sid
        logger.info(f"Client connected: {client_id}")
        emit('connected', {'client_id': client_id})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        client_id = request.sid
        logger.info(f"Client disconnected: {client_id}")
        if hasattr(request, 'sid'):
            system_service.remove_admin_connection(request.sid)
    
    @socketio.on('detect_image')
    def handle_detect_image(data):
        """處理圖像檢測請求"""
        image_data = data.get('image')
        timestamp = data.get('timestamp')
        
        if not image_data:
            emit('error', {'message': 'No image data'})
            return
        
        detection_response = detection_service.detect_objects(image_data)
        
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
        
        emit('detection_result', result)
        
    @socketio.on('start_monitoring')
    def handle_start_monitoring(data):
        try:
            token = data.get("token")
            if not token:
                emit('monitoring error', {'message': '缺少 Token'})
                return
            
            token_data = verify_token(token)
            if not token_data:
                emit('monitoring error', {'message': '權限不足'})
                return
            
            join_room("monitor")
            system_service.add_admin_connection(request.sid)
            
            emit('monitoring started', {
                'message': "系統監控啟動",
            })
        except Exception as e:
            emit('monitoring error', {'message': f'啟動系統監控失敗: {str(e)}'})
            
    @socketio.on('stop_monitoring')
    def handle_stop_monitoring():
        try:
            leave_room("monitor")
            system_service.remove_admin_connection(request.sid)
            
            emit('monitoring stop', {'message': '系統監控已停止'})
            
        except Exception as e:
            emit('monitoring error', {'message': f'停止系統監控失敗: {str(e)}'})
            
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
import threading
from datetime import datetime
import time
import psutil
import platform
from datetime import datetime
from config import Config
import GPUtil
from .detection_service import DetectionService

class SystemService:
    def __init__(self, socketio):
        self.socketio = socketio
        self.monitoring = False
        self.monitor_thread = None
        self.connected_admins = set()
        
    def start_monitoring(self):
        if self.monitoring:
            return

        self.monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
        
    def stop_monitoring(self):
        self.monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=1)
            
    def add_admin_connection(self, session_id):
        self.connected_admins.add(session_id)
        if not self.monitoring:
            self.start_monitoring()
            
    def remove_admin_connection(self, session_id):
        self.connected_admins.discard(session_id)
        if not self.connected_admins:
            self.stop_monitoring()
    
    def _monitor_loop(self):
        while self.monitoring and self.connected_admins:
            try:
                system_data = self._get_data()
                
                self.socketio.emit(
                    'system_stats',
                    system_data,
                    room='monitor'
                )
                
                time.sleep(2)
                
            except Exception as e:
                print(f"Monitor loop Error: {str(e)}")
                time.sleep(5)
                
    def _get_data(self):
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            cpu_freq = psutil.cpu_freq()
            
            memory = psutil.virtual_memory()
            
            disk = psutil.disk_usage('/')
            
            gpu_info = self._get_gpu_info()
            
            return {
                "cpu": {
                    "count": cpu_count,
                    "usage": round(cpu_percent, 1),
                    "frequency": round(cpu_freq.current, 0) if cpu_freq else None,
                },
                "memory": {
                    "total": f"{round(memory.total / (1024**3), 2)} GB",
                    "used": f"{round(memory.used / (1024**3), 2)} GB",
                    "available": f"{round(memory.available / (1024**3), 2)} GB",
                    "usage": round(memory.percent, 1)
                },
                "disk": {
                    "total": f"{round(disk.total / (1024**3), 2)} GB",
                    "used": f"{round(disk.used / (1024**3), 2)} GB",
                    "free": f"{round(disk.free / (1024**3), 2)} GB",
                    "usage": round((disk.used / disk.total) * 100, 1)
                },
                "gpu": gpu_info
            }
        except Exception as e:
            return {
                "error": f"Failed to get system data: {str(e)}",
            }
    
    def _get_gpu_info(self):
        """獲取 GPU 使用率資訊"""
        try:
            gpus = GPUtil.getGPUs()
            
            if not gpus:
                return {
                    "available": False,
                    "message": "No GPU detected"
                }
            
            gpu_data = []
            for i, gpu in enumerate(gpus):
                gpu_data.append({
                    "usage": round(gpu.load * 100, 1),
                    "memory_usage": round(gpu.memoryUtil * 100, 1),
                    "memory_used": f"{round(gpu.memoryUsed / 1024, 2)} GB",
                    "memory_total": f"{round(gpu.memoryTotal / 1024, 2)} GB",
                })
            
            return {
                "available": True,
                "count": len(gpus),
                "gpus": gpu_data
            }
            
        except Exception as e:
            return {
                "available": False,
                "error": f"Failed to get GPU info: {str(e)}"
            }
            
class SystemInfo:
    @staticmethod
    def _get_system_info():
        """獲取系統基本資訊"""
        try:
            return {
                "platform": {
                    "system": platform.system(),
                    "version": platform.version(),
                },
                "server": {
                    "hostname": platform.node(),
                    "current_time": datetime.now().isoformat(),
                    "timezone": str(datetime.now().astimezone().tzinfo),
                }
            }
        except Exception as e:
            return {"error": f"Failed to get system info: {str(e)}"}
    
    @staticmethod
    def _get_application_info():
        """獲取應用程式資訊"""
        try:
            return {
                "flask_port": Config.PORT,
                "socket_port": Config.SOCKET_PORT,
                "mongo_host": Config.MONGO_HOST,
                "db_name": Config.DB_NAME,
            }
        except Exception as e:
            return {"error": f"Failed to get application info: {str(e)}"}
    
    @staticmethod
    def _get_model_info():
        """獲取模型資訊"""
        try:
            detection_service = DetectionService()
            
            model_info = {
                "yolo_model": {
                    "model_version": detection_service.model_version,
                    "confidence_threshold": detection_service.confidence_threshold,
                    "iou_threshold": detection_service.iou_threshold
                },
            }
            
            return model_info
        except Exception as e:
            return {"error": f"Failed to get model info: {str(e)}"}
    
    @staticmethod
    def get_all_system_info():
        return {
            "system": SystemInfo._get_system_info(),
            "application": SystemInfo._get_application_info(),
            "models": SystemInfo._get_model_info(),
        }
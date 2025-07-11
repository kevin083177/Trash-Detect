from flask_socketio import emit
import threading
from datetime import datetime
import time
import psutil
import platform
from datetime import datetime
from config import Config
from pymongo import MongoClient

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
            
            network = psutil.net_io_counters()
            
            return {
                "cpu": {
                    "count": cpu_count,
                    "usage": round(cpu_percent, 1),
                    "frequecy": round(cpu_freq.current, 0) if cpu_freq else None,
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
                "network": {
                    "bytes_sent": network.bytes_sent,
                    "bytes_recv": network.bytes_recv,
                    "packets_sent": network.packets_sent,
                    "packets_recv": network.packets_recv
                }
            }
        except Exception as e:
            return {
                "error": f"Failed to get system data: {str(e)}",
            }
            
class SystemInfo:
    @staticmethod
    def _get_system_info():
        """獲取系統基本資訊"""
        try:
            return {
                "platform": {
                    "system": platform.system(),
                    "release": platform.release(),
                    "version": platform.version(),
                    "machine": platform.machine(),
                    "processor": platform.processor(),
                    "architecture": platform.architecture()[0]
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
                "app_name": "Garbi",
                "environment": Config.ENV,
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
            model = "yolov8m.pt"
            model_info = {
                "yolo_model": {
                    "model_version": model.split(".")[0][-1],
                    "confidence_threshold": 0.85,
                },
            }
            
            return model_info
        except Exception as e:
            return {"error": f"Failed to get model info: {str(e)}"}
    
    @staticmethod
    def _get_database_info():
        """獲取資料庫資訊"""
        try:           
            client = MongoClient(Config.MONGO_URI)
            db = client[Config.DB_NAME]
            
            # 獲取集合資訊
            collections = db.list_collection_names()
            collection_stats = {}
            
            for collection_name in collections:
                try:
                    stats = db.command("collStats", collection_name)
                    collection_stats[collection_name] = {
                        "count": stats.get("count", 0),
                    }
                except:
                    collection_stats[collection_name] = {"error": "無法獲取統計"}
            
            return {
                "collections": collection_stats,
                "total_collections": len(collections)
            }
        except Exception as e:
            return {"error": f"Failed to get database info: {str(e)}"}
    
    @staticmethod
    def get_all_system_info():
        return {
            "system": SystemInfo._get_system_info(),
            "application": SystemInfo._get_application_info(),
            "models": SystemInfo._get_model_info(),
            "database": SystemInfo._get_database_info(),
        }
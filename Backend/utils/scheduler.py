import schedule
import time
import threading
from services import DailyTrashService
from config import Config
from utils import logger

class Scheduler:
    def __init__(self):
        self.daily_trash_serivce = DailyTrashService(Config.MONGO_URI)
        self.is_running = False
        
    def create_daily_trash_job(self):
        """創建每回收數據表"""
        try:
            result = self.daily_trash_serivce.auto_create_daily_trash()
            
            if result:
                logger.info("Create daily trash table successfully")
            
            else:
                logger.warning("Failed to create daily trash table")
        except Exception as e:
            logger.error(f"Create daily trash table error: {str(e)}")
                
    def start_scheduler(self):
        if self.is_running:
            return
        
        schedule.every().day.at("00:00").do(self.create_daily_trash_job)
        
        self.is_running = True
        
        def run():
            while self.is_running:
                schedule.run_pending()
                time.sleep(60) # 每分鐘檢查一次時間
                
        scheduler_thread = threading.Thread(target=run, daemon=True)
        scheduler_thread.start()
        
    def stop_scheduler(self):
        self.is_running = False
        schedule.clear()
        
daily_scheduler = Scheduler()

def start_scheduler():
    daily_scheduler.start_scheduler()

def stop_scheduler():
    daily_scheduler.stop_scheduler()
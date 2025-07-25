import logging
from logging.handlers import TimedRotatingFileHandler
import os
from datetime import datetime
import colorama
from dotenv import load_dotenv
import pathlib

# 載入環境變數
load_dotenv()

# 初始化顏色支援
colorama.init()

class ColorFormatter(logging.Formatter):
    colors = {
        'ERROR': colorama.Fore.RED,
        'WARNING': colorama.Fore.YELLOW,
        'INFO': colorama.Fore.GREEN,
        'DEBUG': colorama.Fore.WHITE,
        'CRITICAL': colorama.Fore.RED,
    }

    def format(self, record):
        # 自定義時間格式
        record.timestamp = datetime.fromtimestamp(record.created).strftime("%b-%d-%Y %H:%M:%S")
        
        # 如果是控制台輸出，添加顏色
        if hasattr(self, 'use_color') and self.use_color:
            record.levelname = f"{self.colors.get(record.levelname, '')}{record.levelname}{colorama.Style.RESET_ALL}"
        
        return f"{record.levelname}: [{record.timestamp}]: {record.getMessage()}"
    
def setup_logger():
    # 創建 logger
    logger = logging.getLogger('app')
    logger.setLevel(logging.DEBUG)

    # 確保日誌目錄存在
    log_path = os.getenv('LogPath')
    pathlib.Path(log_path).mkdir(parents=True, exist_ok=True)

    # 生成當前時間的檔名
    current_time = datetime.now().strftime("%Y-%m-%d-%H")
    log_file = f"{log_path}/{current_time}.log"

    # 設置文件處理器
    file_handler = TimedRotatingFileHandler(
        filename=log_file,
        when="H",        # 每小時輪換
        interval=1,      # 間隔1小時
        backupCount=int(365 * 24),  # 保存 365 天的日誌
        encoding='utf-8',
        atTime=None     # 讓它在整點時轉換
    )
    
    # 自定義文件命名格式
    def namer(default_name):
        """生成新的日誌檔名"""
        try:
            date_str = default_name.split('.')[-1]
            return f"{log_path}/{date_str}.log"
        except Exception:
            current_time = datetime.now().strftime("%Y-%m-%d-%H")
            return f"{log_path}/{current_time}.log"

    # 設定檔案命名格式
    file_handler.namer = namer
    # 設定檔案後綴，這會決定輪換檔案的時間戳格式
    file_handler.suffix = "%Y-%m-%d-%H"
    
    # 設定格式化器
    file_handler.setFormatter(ColorFormatter())
    file_handler.setLevel(logging.DEBUG)

    # 添加處理器到 logger
    logger.addHandler(file_handler)

    # 設置控制台處理器
    console_handler = logging.StreamHandler()
    console_formatter = ColorFormatter()
    console_formatter.use_color = True
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(logging.DEBUG)
    logger.addHandler(console_handler)

    return logger

logger = setup_logger()
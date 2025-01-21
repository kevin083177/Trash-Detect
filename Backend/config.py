import os
from dotenv import load_dotenv
from pymongo import MongoClient
from utils.logger_config import logger

# 載入 .env 檔案
load_dotenv()

class Config:
    # MongoDB 設定
    MONGO_USERNAME = os.getenv("MONGO_USERNAME")
    MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
    MONGO_HOST = os.getenv("MONGO_HOST")
    MONGO_OPTIONS = os.getenv("MONGO_OPTIONS", "")
    SECRET_KEY = os.getenv("SECRET_KEY")
    DB_NAME = os.getenv("DB_NAME")

    # Flask 設定
    SECRET_KEY = os.getenv("SECRET_KEY")
    DEBUG = True  # 開發環境設為 True
    PORT = int(os.getenv("PORT"))

    # 組合 MongoDB 連接 URI
    MONGO_URI = (
        f"mongodb+srv://{MONGO_USERNAME}:{MONGO_PASSWORD}"
        f"@{MONGO_HOST}/?{MONGO_OPTIONS}"
    )
    
# 資料庫連接函數
def init_db():
    try:
        client = MongoClient(Config.MONGO_URI)
        db = client[Config.DB_NAME]
    except Exception as e:
        logger.error(f"MongoDB connection failed: {str(e)}")
        raise e
    return db
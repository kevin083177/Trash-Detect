import os
from dotenv import load_dotenv
from pymongo import MongoClient
from utils import logger

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
    ENV = os.getenv("FLASK_ENV")
    PORT = int(os.getenv("FLASK_PORT"))

    # Cloudinary 設定
    CLOUD_NAME = os.getenv('CLOUD_NAME')
    CLOUD_KEY = os.getenv('CLOUD_KEY')
    CLOUD_SECRET = os.getenv('CLOUD_SECRET')

    # Socket 設定
    SOCKET_PORT = int(os.getenv("SOCKET_PORT"))
    
    # MongoDB 連接 URI
    MONGO_URI = (
        f"mongodb+srv://{MONGO_USERNAME}:{MONGO_PASSWORD}"
        f"@{MONGO_HOST}/?{MONGO_OPTIONS}"
    )
    
    @staticmethod
    def get_cloudinary_config() -> dict:
        """取得 Cloudinary 設定"""
        return {
            'cloud_name': Config.CLOUD_NAME,
            'api_key': Config.CLOUD_KEY,
            'api_secret': Config.CLOUD_SECRET,
            'secure': True
        }

    @staticmethod
    def init_db() -> MongoClient:
        """初始化 MongoDB 連接"""
        try:
            client = MongoClient(Config.MONGO_URI)
            db = client[Config.DB_NAME]
            return db
        except Exception as e:
            logger.error(f"MongoDB 連接失敗: {str(e)}")
            raise e
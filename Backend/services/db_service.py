from pymongo import MongoClient
from config import Config

class DatabaseService:
    def __init__(self, mongo_uri, db_name=Config.DB_NAME):
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        
        self.collections = {
            'users': self.db.users,
            'user_levels': self.db.user_levels,
            'purchases': self.db.user_purchases,
            'products': self.db.products,
            'themes': self.db.themes,
            "chapters": self.db.chapters,
            "levels": self.db.levels,
            'questions': self.db.questions,
            'question_categories': self.db.question_categories,
            'verifications': self.db.verifications,
            'daily_trash': self.db.daily_trash,
        }
    
    def get_collection(self, collection_name):
        return self.collections.get(collection_name)
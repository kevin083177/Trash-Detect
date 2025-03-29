from pymongo import MongoClient
from config import Config

class DatabaseService:
    def __init__(self, mongo_uri, db_name=Config.DB_NAME):
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        
        self.collections = {
            'users': self.db.users,
            'records': self.db.user_records,
            'purchases': self.db.user_purchases,
            'products': self.db.products,
            'themes': self.db.themes,
            
        }
    
    def get_collection(self, collection_name):
        return self.collections.get(collection_name)
from pymongo import MongoClient
from bson import ObjectId

class DatabaseService:
    def __init__(self, mongo_uri, db_name="Trash"):
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        
        self.collections = {
            'users': self.db.users,
            'records': self.db.records,
            
        }
    
    def get_collection(self, collection_name):
        return self.collections.get(collection_name)
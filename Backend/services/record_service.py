from services.db_service import DatabaseService
from models.record_model import Record
from bson import ObjectId

class RecordService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.record = self.collections['records']
    
    def init_user_record(self, user_id):
        try:
            record = Record(
                user_id = user_id,
                paper = 0,
                plastic = 0,
                cans = 0,
                containers = 0,
                bottles = 0
            )
            result = self.record.insert_one(record.__dict__)
            return result.inserted_id
        except Exception as e:
            print(f"Error initializing record: {str(e)}")
            raise
    
    # record_controller
    # use record_id to get user record
    def get_record_by_id(self, record_id):
        try:
            record = self.record.find_one({"_id": ObjectId(record_id)})
            
            return record if record else False
        except Exception as e:
            print(f"Error get record: {str(e)}")
            raise
    
    # user_controller
    # use user_id to get user record
    def get_record_by_user_id(self, user_id):
        try:
            user = self.record.find_one({"user_id": ObjectId(user_id)})
            
            return user if user else False
        
        except Exception as e:
            print(f"Error get user record: {str(e)}")
            raise
    
    def get_category_count(self, record_id, category):
        try:
            valid_categories = ['paper', 'plastic', 'cans', 'containers', 'bottles']
            if category not in valid_categories:
                return False
                
            record = self.record.find_one(
                {"_id": ObjectId(record_id)}, 
                {category: 1}
            )
            return int(record[category]) if record else False
                
        except Exception as e:
            print(f"Error getting {category} count: {str(e)}")
            raise
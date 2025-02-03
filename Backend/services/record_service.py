from services import DatabaseService
from models import Record
from bson import ObjectId

class RecordService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.record = self.collections['records']
        
        self.valid_categories = ['paper', 'plastic', 'cans', 'containers', 'bottles']
        
    
    def init_user_record(self, user_id: str | ObjectId):
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            default_record = {
                'user_id': user_id,
                **{category: 0 for category in self.valid_categories}
            }
            
            record = Record(**default_record)
            result = self.record.insert_one(record.to_dict())
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
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            user = self.record.find_one({"user_id": user_id})
            
            return user if user else False
        
        except Exception as e:
            print(f"Error get user record: {str(e)}")
            raise
    
    def get_category_count(self, record_id, category):
        try:
            if category not in self.valid_categories:
                return False
                
            record = self.record.find_one(
                {"_id": ObjectId(record_id)}, 
                {category: 1}
            )
            return int(record[category]) if record else False
                
        except Exception as e:
            print(f"Error getting {category} count: {str(e)}")
            raise
    
    def add_category_count(self, user_id, category, count):
        try:
            if category not in self.valid_categories:
                return False
            
            # get record id by user_id instead to input record_id
            record = self.get_record_by_user_id(user_id)
            
            if not record:
                return False
            
            record_id = record['_id']
            
            # get category count
            current_count = self.get_category_count(record_id, category)
            if current_count is False:
                return False
            
            result = self.record.update_one(
                {"_id": ObjectId(record_id)},
                {"$set": {category: current_count + count}}
            )
            
            return bool(result.modified_count > 0)
        
        except Exception as e:
            print(f"Error adding {category} count: {str(e)}")
            raise
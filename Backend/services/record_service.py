from services.db_service import DatabaseService
from models.record_model import Record

class RecordService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.record = self.collections['records']
    
    def init_record(self, user_id):
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
            
        
from services import DatabaseService
from bson import ObjectId

class AdminService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.users = self.collections['users']
    
    def get_all_users_info(self):
        try:
            pipeline = [
            {
                "$lookup": {
                    "from": "user_levels",
                    "localField": "_id",
                    "foreignField": "user_id",
                    "as": "user_level_data"
                }
            },
            {
                "$project": {
                    "_id": {"$toString": "$_id"},
                    "username": 1,
                    "trash_stats": 1,
                    "last_check_in": 1,
                    "highest_level": {
                        "$ifNull": [
                            {"$arrayElemAt": ["$user_level_data.highest_level", 0]},
                            0
                        ]
                    }
                }
            },
        ]
            
            users_info = list(self.users.aggregate(pipeline))
            
            return users_info
            
        except Exception as e:
            print(f"Get All Users Info Error: {str(e)}")
            raise
            
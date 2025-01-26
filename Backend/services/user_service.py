from bson import ObjectId
from services.db_service import DatabaseService

class UserService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.users = self.collections['users']
                
    def get_user(self, user_id):
        user = self.users.find_one({"_id": ObjectId(user_id)})
        return user

    def get_all_users(self):
        return list(self.users.find())
    
    def _update_money_add(self, user_id, price):
        return self.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"price": price}}
        )

    def _update_money_subtract(self, user_id, price):
        return self.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"price": -price}}
        )

    def _validate_money_operation(self, user_id, price):
        user = self.get_user(user_id)
        if not user:
            return False
        
        if not isinstance(price, int):
            raise ValueError("price 必須為整數")
            
        return user

    def _update_money(self, user_id, price, operation):
        try:
            user = self._validate_money_operation(user_id, price)
            if not user:
                return None
                
            result = operation(user_id, price)
            updated_user = self.get_user(user_id) if result.modified_count > 0 else None
            return updated_user
            
        except Exception as e:
            print(f"Update money Error: {str(e)}")
            raise

    def add_money(self, user_id, price):
        return self._update_money(user_id, price, self._update_money_add)

    def subtract_money(self, user_id, price):
        return self._update_money(user_id, price, self._update_money_subtract)
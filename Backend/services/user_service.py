from bson import ObjectId
from services import DatabaseService
from datetime import datetime

class UserService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.users = self.collections['users']
                
    def get_user(self, user_id):
        user = self.users.find_one({"_id": ObjectId(user_id)})
        return user

    def get_all_users(self):
        return list(self.users.find())
    
    def _update_money_add(self, user_id, money):
        return self.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"money": money}}
        )

    def _update_money_subtract(self, user_id, money):
        return self.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"money": -money}}
        )

    def _validate_money_operation(self, user_id, money):
        user = self.get_user(user_id)
        if not user:
            return False
        
        if not isinstance(money, int):
            raise ValueError("money 必須為整數")
            
        return user

    def _update_money(self, user_id, money, operation):
        try:
            user = self._validate_money_operation(user_id, money)
            if not user:
                return None
                
            result = operation(user_id, money)
            updated_user = self.get_user(user_id) if result.modified_count > 0 else None
            return updated_user
            
        except Exception as e:
            print(f"Update money Error: {str(e)}")
            raise

    def add_money(self, user_id, money):
        return self._update_money(user_id, money, self._update_money_add)

    def subtract_money(self, user_id, money):
        return self._update_money(user_id, money, self._update_money_subtract)
    
    def daliy_check_in(self, user_id):
        try:
            user = self.get_user(user_id)
            if not user:
                return None
            
            now = datetime.now()
            last_check_in = user.get('last_check_in')
            
            # 如果有簽到時間 檢查是否是同一天
            if last_check_in is not None:
                # 如果 last_check_in 是字串，轉換為 datetime 對象
                if isinstance(last_check_in, str):
                    last_check_in = datetime.now()
                
                if last_check_in.date() == now.date():
                    raise ValueError("今日已簽到")
            
            # 簽到 +50塊
            self.add_money(user_id, 50)
            
            result = self.users.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {"last_check_in": now},
                }
            )
            
            return self.get_user(user_id) if result.modified_count > 0 else None
        
        except Exception as e:
            print(f"Daily check-in Error: {str(e)}")
            raise
    
    def daily_check_in_status(self, user_id):
        try:
            user = self.get_user(user_id)
            if not user:
                return None
            
            now = datetime.now()
            last_check_in = user.get('last_check_in')
            
            # 如果有簽到紀錄
            if last_check_in is not None:
                # 如果 last_check_in 是字串，轉換為 datetime 對象
                if isinstance(last_check_in, str):
                    last_check_in = datetime.strptime(last_check_in, "%Y-%m-%d %H:%M:%S")
                
                # 檢查是否為今天
                return last_check_in.date() == now.date()
            
            # 從未簽到過
            return False

        except Exception as e:
            print(f"Daily check-in status Error: {str(e)}")
            raise
                
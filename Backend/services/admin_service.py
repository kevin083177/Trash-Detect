from services import DatabaseService
from bson import ObjectId

class AdminService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.users = self.collections['users']
        self.purchase = self.collections['purchases']
        self.user_levels = self.collections['user_levels']
        
    def delete_user(self, user_id):
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            # 儲存刪除操作結果
            deletion_results = {
                'users': False,
                'purchases': False,
                'user_levels': False
            }
            
            user = self.users.find_one_and_delete({"_id": user_id})

            deletion_results['users'] = bool(user)
            
            # 刪除 user_purchase
            purchase = self.purchase.find_one_and_delete({"user_id": user_id})
            deletion_results['purchases'] = bool(purchase)
            
            user_level = self.user_levels.find_one_and_delete({"user_id": user_id})
            deletion_results['user_levels'] = bool(user_level)
            
            # 檢查刪除結果
            if all(deletion_results.values()):
                return True, "使用者與相關資料已刪除"
            
            failed_deletions = [
                key for key, value in deletion_results.items() 
                if not value
            ]
            
            if deletion_results['users'] and failed_deletions:
                return True, f"使用者已刪除，但以下資料刪除失敗: {', '.join(failed_deletions)}"
                
            return False, "無法找到使用者"
            
        except Exception as e:
            print(f"Delete User Error: {str(e)}")
            raise
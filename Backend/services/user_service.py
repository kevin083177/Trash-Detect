from bson import ObjectId
from services import DatabaseService
from datetime import datetime
import bcrypt
from .image_service import ImageService

class UserService(DatabaseService):
    def __init__(self, mongo_uri, image_service=None):
        super().__init__(mongo_uri)
        self.users = self.collections['users']
        self.purchase = self.collections['purchases']
        self.user_level = self.collections['user_levels']
        
        if image_service is not None and not isinstance(image_service, ImageService):
            raise TypeError("image_service 必須是 ImageService")
        self.image_service = image_service
        
    def get_user(self, user_id: str):
        """取得使用者資料 (find_one)
        Args:
            user_id(str): 使用者 ID
        """
        user = self.users.find_one({"_id": ObjectId(user_id)})
        return user

    def get_all_users(self):
        return list(self.users.find())
    
    def update_username(self, user_id, new_username):
        """更新使用者名稱"""
        try:
            user = self.users.find_one_and_update(
                {"_id": ObjectId(user_id)},
                {"$set": {"username": new_username}},
                return_document=True
            )
            return user
        except Exception as e:
            print(f"Update username Error: {str(e)}")
            raise
        
    def update_password(self, user_id, new_password):
        """更新密碼"""
        try:
            # 加密新密碼
            hashed_password = bcrypt.hashpw(
                new_password.encode('utf-8'), 
                bcrypt.gensalt()
            ).decode('utf-8')
            
            self.users.find_one_and_update(
                {"_id": ObjectId(user_id)},
                {"$set": {"password": hashed_password}},
                return_document=False
            )
            return True
        except Exception as e:
            print(f"Update password Error: {str(e)}")
            raise
    
    def _get_user_money(self, user_id):
        user = self.get_user(user_id)
        if not user:
            return None
        
        return user.get('money', 0)
    
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
    
    def get_user_trash_stats(self, user_id: str):
        try:
            user = self.get_user(user_id)
            if not user:
                return None
            
            return user.get('trash_stats', {})
        
        except Exception as e:
            print(f"Get user trash stats Error: {str(e)}")
            raise
    
    def add_user_trash_stats(self, user_id: str, trash_type: str, count: int):
        try:
            user = self.get_user(user_id)
            if not user:
                return None
            
            # 更新垃圾統計資料
            trash = self.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$inc": {f"trash_stats.{trash_type}": count}}
            )
            
            if trash.modified_count > 0:
                return self.get_user_trash_stats(user_id)
            
            return None
        
        except Exception as e:
            print(f"Add user trash stats Error: {str(e)}")
            raise
        
    def _get_user_total_trash(self, user_id: str):
        try:
            user = self.get_user(user_id)
            if not user:
                return None
            
            trash_stats: list = user['trash_stats']
            total_count = sum(trash_stats.values())
            
            return total_count
        except Exception as e:
            print(f"Get total trash count Error: {str(e)}")
            return 0
        
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
            
            user_level = self.user_level.find_one_and_delete({"user_id": user_id})
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
        
    def _set_email_verified(self, user_id):
        """設置email為已驗證"""
        try:
            result = self.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"verification": True}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Set email verified Error: {str(e)}")
            raise
        
    def _set_email_unverified(self, user_id, new_email):
        """若玩家更新email將其設置為未驗證並修改上新email"""
        try:
            user = self.users.find_one_and_update(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "email": new_email,
                    "verification": False
                }},
                return_document=True
            )
            return user
        except Exception as e:
            print(f"Update email unverified Error: {str(e)}")
            raise
        
    def reset_password_with_verification(self, user_id: str, new_password: str) -> tuple[bool, str]:
        try:
            user = self.get_user(user_id)
            if not user:
                return False, "使用者不存在"
            
            hashed_password = bcrypt.hashpw(
                new_password.encode('utf-8'), 
                bcrypt.gensalt()
            ).decode('utf-8')
            
            result = self.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"password": hashed_password}}
            )
            
            if result.modified_count > 0:
                return True, "密碼重設成功"
            else:
                return False, "密碼重設失敗"
            
        except Exception as e:
            return False, f"伺服器錯誤: {str(e)}"
        
    def update_profile(self, user_id: str, image_file):
        try:
            if not self.image_service:
                raise ValueError("ImageService 未初始化")
            
            user = self.get_user(user_id)
            if not user:
                return None
            
            old_profile = user.get('profile')
            if old_profile and 'public_id' in old_profile:
                try:
                    self.image_service.delete_image(old_profile['public_id'])
                except Exception as e:
                    print(f"刪除舊頭像失敗: {str(e)}")
                    raise
            
            image_result = self.image_service.upload_image(
                image_file=image_file,
                public_id=f"{user_id}_profile",
                folder="profiles"
            )
            
            profile_url = image_result['url']
            
            result = self.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"profile": {
                    "public_id": image_result['public_id'],
                    "url": profile_url
                }}}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Update user profile with image error: {str(e)}")
            raise
    
    def get_question_stats(self, user_id: str):
        try:
            user = self.get_user(user_id)
            if not user:
                return None
            
            if 'question_stats' not in user or not user['question_stats']:
                default_stats = self.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {"question_stats": {
                        "plastic": {"total": 0, "correct": 0},
                        "paper_container": {"total": 0, "correct": 0},
                        "bottles": {"total": 0, "correct": 0},
                        "cans": {"total": 0, "correct": 0},
                        "paper": {"total": 0, "correct": 0}
                    }}}
                )
                
                user['question_stats'] = default_stats
                
            return user['question_stats']
        
        except Exception as e:
            print(f"Get user question stats Error: {str(e)}")
            raise
        
    def update_question_stats(self, user_id: str, category: str, total: int, correct: int):
        try:
            valid_categories = ['plastic', 'container', 'bottles', 'cans', 'paper']
            if category not in valid_categories:
                raise ValueError(f"無效的類別: {category}")
                
            if not isinstance(total, int) or total <= 0:
                raise ValueError("total 必須為正整數")
                
            if not isinstance(correct, int) or correct < 0:
                raise ValueError("correct 必須為非負整數")
                
            if correct > total:
                raise ValueError("答對數不能大於總題數")
            
            user = self.get_user(user_id)
            if not user:
                return None
            
            result = self.users.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$inc": {
                        f"question_stats.{category}.total": total,
                        f"question_stats.{category}.correct": correct
                    }
                }
            )
            
            if result.modified_count > 0:
                return self.get_question_stats(user_id)
            
            return None
        
        except Exception as e:
            print(f"Update user question stats Error: {str(e)}")
            raise
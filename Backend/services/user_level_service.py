from services import DatabaseService
from models import UserLevel
from bson import ObjectId

class UserLevelService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.user_levels = self.collections['user_levels']
        
    def init_user_level(self, user_id: str):
        """初始化用戶關卡資訊
        Args:
            user_id (str | ObjectId): 用戶ID
        Returns:
            ObjectId: 新增的用戶關卡資訊ID
        """
        user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
        
        user_level = UserLevel(
            user_id=user_id, 
            highest_level=0, 
            chapter_progress={}
        )
        
        result = self.user_levels.insert_one(user_level.to_dict())
        return result.inserted_id
    
    def _chapter_progress_exists(self, user_id: str | ObjectId, chapter_name: str):
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            user_level = self.user_levels.find_one(
                {"user_id": user_id},
                {"chapter_progress": 1}
            )
            
            if not user_level or "chapter_progress" not in user_level:
                return False
                
            return chapter_name in user_level["chapter_progress"]
        except Exception as e:
            print(f"Get chapter progress exists Error: {str(e)}")
            return False
        
    def set_chapter_unlocked(self, user_id: str | ObjectId, chapter_name: str):
        """解鎖新章節
        
        Args:
            user_id (str | ObjectId): 用戶ID
            chapter_name (str): 章節名稱 
        
        """
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            # 先檢查是否已經存在此章節的進度
            progress_exists = self._chapter_progress_exists(user_id, chapter_name)
            
            if progress_exists:
                # 只更新 unlocked 字段
                result = self.user_levels.update_one(
                    {"user_id": user_id},
                    {"$set": {f"chapter_progress.{chapter_name}.unlocked": True}}
                )
            else:
                # 創建新的章節進度
                result = self.user_levels.update_one(
                    {"user_id": user_id},
                    {"$set": {f"chapter_progress.{chapter_name}": {
                        "unlocked": True,
                        "completed": False
                    }}}
                )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Set chapter unlocked Error: {str(e)}")
            raise
        
    def set_chapter_completed(self, user_id: str | ObjectId, chapter_name: str):
        """設定關卡為已完成
        Args:
            user_id (str | ObjectId): 用戶ID
            chapter_sequence (int): 關卡序號
        """
        user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
        
        self.user_levels.update_one(
            {"user_id": user_id},
            {"$set": {f"chapter_progress.{chapter_name}.completed": True}}
        )
    
    def set_highest_level(self, user_id: str | ObjectId, level_sequence: int):
        """設定用戶最高關卡
        Args:
            user_id (str | ObjectId): 用戶ID
            level (int): 關卡序號
        """
        user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
        
        self.user_levels.update_one(
            {"user_id": user_id},
            {"$set": {"highest_level": level_sequence}}
        )
        
    def get_user_level(self, user_id: str | ObjectId):
        """獲取用戶關卡資訊
        Args:
            user_id (str | ObjectId): 用戶ID
        Returns:
            dict: 用戶關卡資訊
        """
        user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
        
        user_level = self.user_levels.find_one({"user_id": user_id})
        return user_level if user_level else None
    
    def is_chapter_unlocked(self, user_id, chapter_name):
        """檢查關卡是否解鎖"""
        user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
        
        chapter = self.user_levels.find_one({})
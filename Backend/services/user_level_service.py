from services import DatabaseService
from models import UserLevel
from bson import ObjectId

class UserLevelService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.user_levels = self.collections['user_levels']
        
    def init_user_level(self, user_id: str):
        """初始化使用者關卡資訊
        Args:
            user_id (str | ObjectId): 使用者 ID
        Returns:
            ObjectId: 新增的使用者關卡資訊ID
        """
        user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
        
        user_level = UserLevel(
            user_id=user_id, 
            highest_level=0, 
            chapter_progress={},
            level_progress={}
        )
        
        result = self.user_levels.insert_one(user_level.to_dict())
        
        return result.inserted_id
    
    def _is_chapter_exists(self, user_id: str | ObjectId, chapter_sequence: str):
        """檢查該章節是否已經存在user_level中"""
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            user_level = self.user_levels.find_one(
                {"user_id": user_id},
                {"chapter_progress": 1}
            )
            
            if not user_level or "chapter_progress" not in user_level:
                return False
                
            return chapter_sequence in user_level["chapter_progress"]
        except Exception as e:
            print(f"Get chapter progress exists Error: {str(e)}")
            return False
        
    def _add_new_chapter(self, user_id: str | ObjectId, chapter_sequence: str):
        """預先設置新的章節

        Args:
            user_id (str | ObjectId): 使用者 ID
            chapter_sequence (str): 章節序列

        Returns:
            bool: 是否成功新增章節
        """
        user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
        
        result = self.user_levels.update_one(
            {"user_id": user_id},
            {"$set": {f"chapter_progress.{chapter_sequence}": {
                "unlocked": False,
                "completed": False
            }}}
        )
        
        return result.modified_count > 0
    
    def set_chapter_unlocked(self, user_id: str | ObjectId, chapter_sequence: str):
        """設定關卡為已解鎖
        
        Args:
            user_id (str | ObjectId): 使用者 ID
            chapter_sequence (str): 章節序列
        
        """
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            # 先檢查是否已經存在此章節的進度
            progress_exists = self._is_chapter_exists(user_id, chapter_sequence)
            
            if progress_exists:
                # 只更新 unlocked 字段
                result = self.user_levels.update_one(
                    {"user_id": user_id},
                    {"$set": {f"chapter_progress.{chapter_sequence}.unlocked": True}}
                )
            else:
                # 創建新的章節進度
                result = self.user_levels.update_one(
                    {"user_id": user_id},
                    {"$set": {f"chapter_progress.{chapter_sequence}": {
                        "unlocked": True,
                        "completed": False
                    }}}
                )
            
            return bool(result.modified_count > 0)
        except Exception as e:
            print(f"Set chapter unlocked Error: {str(e)}")
            raise
        
    def set_chapter_completed(self, user_id: str | ObjectId, chapter_sequence: str):
        """設定關卡為已完成
        Args:
            user_id (str | ObjectId): 使用者 ID
            chapter_sequence (str): 關卡序號
        """
        user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
        
        if not self._is_chapter_unlocked(user_id, chapter_sequence):
            return None
        
        else:
            result = self.user_levels.update_one(
                {"user_id": user_id},
                {"$set": {f"chapter_progress.{chapter_sequence}.completed": True}}
            )
            
            if result.modified_count > 0:
                self._add_completed_chapter(user_id, chapter_sequence)
            
            return bool(result.modified_count > 0)
    
    def set_highest_level(self, user_id: str | ObjectId, level_sequence: int):
        """設定使用者最高關卡
        Args:
            user_id (str | ObjectId): 使用者 ID
            level (int): 關卡序號
        """
        user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
        
        self.user_levels.update_one(
            {"user_id": user_id},
            {"$set": {"highest_level": level_sequence}}
        )
    
    def _get_highest_level(self):
        """取得使用者最高遊玩關卡
        Args:
            user_id (str | ObjectId): 使用者 ID
        Returns:
            int: 最高關卡
        """
        return int(self.get_user_level()['highest_level'])
    
    def get_user_level(self, user_id: str | ObjectId) -> dict | None:
        """獲取使用者關卡資訊
        Args:
            user_id (str | ObjectId): 使用者 ID
        Returns:
            dict: 使用者關卡資訊
        """
        user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
        
        user_level = self.user_levels.find_one({"user_id": user_id})
        return user_level if user_level else None
    
    def _is_chapter_unlocked(self, user_id: str | ObjectId, chapter_sequence: str) -> bool:
        """檢查章節是否已解鎖
        
        Args:
            user_id (str | ObjectId): 使用者 ID
            chapter_sequence (str): 章節序列
            
        Returns:
            bool: 章節是否已完成
        """
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            # 獲取使用者關卡資訊
            user_level = self.user_levels.find_one(
                {"user_id": user_id},
                {f"chapter_progress.{chapter_sequence}": 1}
            )
            
            # 如果使用者無關卡資訊或章節不存在
            if not user_level or "chapter_progress" not in user_level or chapter_sequence not in user_level["chapter_progress"]:
                return False
            
            # 返回章節完成狀態
            return user_level["chapter_progress"][chapter_sequence].get("unlocked", False)
        
        except Exception as e:
            print(f"Check chapter completed Error: {str(e)}")
            return False
        
    
    def _is_chapter_completed(self, user_id: str | ObjectId, chapter_sequence: str) -> bool:
        """檢查章節是否已完成
        
        Args:
            user_id (str | ObjectId): 使用者 ID
            chapter_sequence (str): 章節序列
            
        Returns:
            bool: 章節是否已完成
        """
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            # 獲取使用者關卡資訊
            user_level = self.user_levels.find_one(
                {"user_id": user_id},
                {f"chapter_progress.{chapter_sequence}": 1}
            )
            
            # 如果使用者無關卡資訊或章節不存在
            if not user_level or "chapter_progress" not in user_level or chapter_sequence not in user_level["chapter_progress"]:
                return False
            
            # 返回章節完成狀態
            return user_level["chapter_progress"][chapter_sequence].get("completed", False)
        
        except Exception as e:
            print(f"Check chapter completed Error: {str(e)}")
            return False
        
    def _is_level_progress_exists(self, user_id, sequence):
        """查詢該關卡紀錄是否存在"""
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            sequence = str(sequence)
            
            level_progress = self.user_levels.find_one(
                {"user_id": user_id},
                {f"level_progress.{sequence}": 1}
            )
            
            if not level_progress or "level_progress" not in level_progress:
                return False
            
            # 檢查sequence是否在level_progress字典中
            return sequence in level_progress.get("level_progress", {})

        except Exception as e:
            print(f"Get level progress exists Error: {str(e)}")
            return False
        
    def _add_new_level(self, user_id: str | ObjectId, level_sequence: int):
        """初始化下一關遊玩關卡紀錄
        Args:
            user_id(使用者ID): str | ObjectId
            level_sequence(關卡序列): int
            
        Returns:
            bool: 關卡是否初始化成功
        """
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            result = self.user_levels.update_one(
                {"user_id": user_id},
                {"$set": {f"level_progress.{level_sequence}": {
                    "score": 0,
                    "stars": 0
                }}}
            )
            
            return result.modified_count > 0
        except Exception as e:  
            print(f"Add Level Progress Error: {str(e)}")
            return None
        
    def update_level_progress(self, user_id: str | ObjectId, level_sequence: int, score: int, stars: int):
        """更新已遊玩關卡紀錄
        Args:
            user_id(使用者ID): str | ObjectId
            level_sequence(關卡序列): int
            score(已遊玩分數): int
            stars(星星數量): int
            
        Returns:
            
        """
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            result = self.user_levels.update_one(
                {"user_id": user_id},
                {"$set": {f"level_progress.{level_sequence}": {
                    "score": score,
                    "stars": stars
                }}}
            )
            
            return result
        except Exception as e:  
            print(f"Add Level Progress Error: {str(e)}")
            return None
        
    def _update_highest_level(self, user_id: str | ObjectId, level_sequence: int):
        """更新使用者最高關卡
        Args:
            user_id(使用者ID): str | ObjectId
            level_sequence(關卡序列): int
            
        Returns:
            bool: 是否成功更新最高關卡
        """
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            result = self.user_levels.update_one(
                {"user_id": user_id},
                {"$set": {"highest_level": level_sequence}}
            )
            
            return result.modified_count > 0
        except Exception as e:  
            print(f"Update Highest Level Error: {str(e)}")
            return None
        
    def _get_level_progress(self, user_id: str | ObjectId, sequence):
        """獲取特定關卡的進度記錄"""
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            sequence = str(sequence)
            
            user_level = self.user_levels.find_one(
                {"user_id": user_id},
                {f"level_progress.{sequence}": 1}
            )
            
            if not user_level or "level_progress" not in user_level or sequence not in user_level["level_progress"]:
                return None
                
            return user_level["level_progress"][sequence]
            
        except Exception as e:
            print(f"Get level progress Error: {str(e)}")
            return None
    
    def _check_chapter_is_completed(self, user_id: str | ObjectId, chapter_sequence: int) -> bool:
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            start_level = (chapter_sequence - 1) * 5 + 1
            end_level = chapter_sequence * 5
            
            user_level = self.user_levels.find_one(
                {"user_id": user_id},
                {"level_progress": 1}
            )
            
            if not user_level or "level_progress" not in user_level:
                return False
            
            level_progress = user_level["level_progress"]
            
            for level_sequence in range(start_level, end_level + 1):
                level_key = str(level_sequence)
                
                if level_key not in level_progress:
                    return False
                
                stars = level_progress[level_key].get("stars", 0)
                if stars < 3:
                    return False
            
            return True
    
        except Exception as e:
            print(f"Check chapter levels three stars Error: {str(e)}")
            return False
        
    def _add_completed_chapter(self, user_id: str | ObjectId, chapter_sequence: str):
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            result = self.user_levels.update_one(
                {"user_id": user_id},
                {"$set": {f"completed_chapter.{chapter_sequence}": {
                    "remaining": 20,
                    "highest_score": 0
                }}}
            )
            
            return result.modified_count > 0
        
        except Exception as e:
            print(f"Init completed chapter Error: {str(e)}")
            return False
        
    def _is_completed_chapter_exists(self, user_id: str | ObjectId, chapter_sequence):
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            user_level = self.user_levels.find(
                {"user_id": user_id},
                {"completed_chapter": 1}
            )
            
            if not user_level or "completed_chapter" not in user_level:
                return False
            
            return chapter_sequence in user_level["completed_chapter"]
        
        except Exception as e:
            print(f"Check completed chapter exists Error: {str(e)}")
            return False
        
    def get_completed_chapter_info(self, user_id: str | ObjectId, chapter_sequence: str):
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
        
            user_level = self.user_levels.find_one(
                {"user_id": user_id},
                {f"completed_chapter.{chapter_sequence}": 1}
            )
            
            if not user_level or "completed_chapter" not in user_level or chapter_sequence not in user_level["completed_chapter"]:
                return None
                
            return user_level["completed_chapter"][chapter_sequence]
        
        except Exception as e:
            print(f"Get completed chapter info Error: {str(e)}")
            return None
        
    def update_completed_chapter(self, user_id: str | ObjectId, chapter_sequence: str, score: int = None):
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            chapter_info = self.get_completed_chapter_info(user_id, chapter_sequence)
            if not chapter_info:
                return {"success": False, "message": "找不到該章節記錄"}
            
            current_remaining = chapter_info.get("remaining", 0)
            current_highest_score = chapter_info.get("highest_score", 0)
            
            if current_remaining <= 0:
                return {"success": False, "message": "已無剩餘遊玩次數"}
            
            update_data = {
                f"completed_chapter.{chapter_sequence}.remaining": current_remaining - 1
            }
            
            if score is not None and score > current_highest_score:
                update_data[f"completed_chapter.{chapter_sequence}.highest_score"] = score
                current_highest_score = score
                
            result = self.user_levels.update_one(
                {"user_id": user_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                return {
                    "success": True,
                    "remaining": current_remaining - 1,
                    "highest_score": current_highest_score,
                }
            else:
                return {"success": False, "message": "更新失敗"}
            
        except Exception as e:
            print(f"Update completed chapter Error: {str(e)}")
            return {"success": False, "message": f"系統錯誤: {str(e)}"}
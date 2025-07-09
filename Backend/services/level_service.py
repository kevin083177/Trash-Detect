from services import DatabaseService
from models import Level

class LevelService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.levels = self.collections['levels']

    def add_level(self, level_data: Level):
        level = level_data.to_dict()
        level['sequence'] = self._get_next_sequence()
        
        # 檢查名稱是否重複
        existing_level = self.levels.find_one({"name": level["name"]})
        if existing_level:
            raise ValueError(f"關卡名稱已存在")
        
        # 檢查解鎖條件關卡是否存在
        # 如果序號為1，解鎖條件可以為0
        unlock_requirement = level["unlock_requirement"]
        if unlock_requirement > 0 and not self.levels.find_one({"sequence": unlock_requirement}):
            raise ValueError(f"解鎖條件關卡 {unlock_requirement} 不存在")
        
        if level["sequence"] == level["unlock_requirement"]:
            raise ValueError(f"關卡序號不能等於解鎖條件")
        
        # 插入關卡
        result = self.levels.insert_one(level)
        level_id = str(result.inserted_id)
        
        return level_id
    
    def delete_level(self, level_sequence: str):
        """刪除關卡"""
        # 先查找關卡獲取章節名稱和 ID
        level = self.levels.find_one({"sequence": int(level_sequence)})
        if not level:
            return None
        
        # 刪除關卡
        result = self.levels.delete_one({"sequence": int(level_sequence)})
        if result.deleted_count == 0:
            return None
        
        # 返回被刪除的關卡信息，包括章節名稱和關卡ID，以便控制器更新章節
        return {
            "level_id": str(level["_id"]),
            "chapter": level.get("chapter")
        }
    
    def get_level(self, level_id: str):
        level = self.levels.find_one({"_id": level_id})
        if not level:
            return None
        
        return Level(**level)
        
    def get_level_by_sequence(self, sequence: int):
        """根據序號獲取關卡"""
        level = self.levels.find_one({"sequence": sequence})
        if not level:
            return None
        
        if '_id' in level:
            del level['_id']
            
        return Level(**level)
    
    def update_level(self, level_sequence: int, level_data: dict):
        """更新關卡
        
        根據關卡序號更新關卡信息，並進行相關檢查
        
        Args:
            level_sequence: 要更新的關卡序號
            level_data: 更新的資料
            
        Returns:
            更新的關卡對象或 None
            
        Raises:
            ValueError: 當更新違反條件時
        """
        # 先檢查關卡是否存在
        original_level = self.levels.find_one({"sequence": int(level_sequence)})
        if not original_level:
            raise ValueError(f"關卡序號 {level_sequence} 不存在")
        
        # 準備更新數據
        update_data = {}
        
        # 檢查並更新名稱
        if "name" in level_data and level_data["name"] != original_level["name"]:
            # 檢查名稱是否重複
            existing_level = self.levels.find_one({"name": level_data["name"]})
            if existing_level and existing_level["sequence"] != int(level_sequence):
                raise ValueError(f"關卡名稱已存在")
            update_data["name"] = level_data["name"]
        
        # 檢查並更新描述
        if "description" in level_data:
            update_data["description"] = level_data["description"]
        
        # 檢查並更新解鎖條件
        if "unlock_requirement" in level_data and level_data["unlock_requirement"] != original_level["unlock_requirement"]:
            unlock_requirement = int(level_data["unlock_requirement"])
            
            # 檢查關卡序號不能等於解鎖條件
            if int(level_sequence) == unlock_requirement:
                raise ValueError(f"關卡序號不能等於解鎖條件")
            
            # 檢查解鎖條件關卡是否存在
            if unlock_requirement > 0 and not self.levels.find_one({"sequence": unlock_requirement}):
                raise ValueError(f"解鎖條件關卡 {unlock_requirement} 不存在")
                
            update_data["unlock_requirement"] = unlock_requirement
        
        # 如果沒有資料需要更新
        if not update_data:
            return self.get_level_by_sequence(level_sequence)
        
        # 執行更新
        result = self.levels.update_one(
            {"sequence": int(level_sequence)}, 
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return None
        
        # 返回更新後的關卡
        return self.get_level_by_sequence(level_sequence)
    
    def get_chapters_level(self, chapter_name: str):
        """根據章節名稱找出所有關卡(Level)
        Args: 
            chapter_name(章節名稱): string
        
        Returns:
            Array: 關卡資訊
        """
        # 查詢指定章節的所有關卡
        levels = list(self.levels.find({"chapter": chapter_name}))
        
        # 處理結果：轉換 ObjectId 並按照序號排序
        for level in levels:
            if '_id' in level:
                level['_id'] = str(level['_id'])
                
        return levels
    
    def _is_level_exists(self, level_sequence: int) -> bool:
        """檢查關卡是否存在"""
        return self.levels.find_one({"sequence": level_sequence}) is not None
    
    def _get_next_sequence(self):
        """獲取下一關可用的 sequence 值"""
        max_sequence_level = self.levels.find_one(sort=[("sequence", -1)])
        
        if not max_sequence_level or "sequence" not in max_sequence_level:
            return 1
            
        return max_sequence_level["sequence"] + 1
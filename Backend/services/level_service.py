from services import DatabaseService
from models import Level

class LevelService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.levels = self.collections['levels']

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
        Args:
            level_sequence: 要更新的關卡序號
            level_data: 更新的資料
            
        Returns:
            更新的關卡對象或 None
            
        Raises:
            ValueError: 當更新違反條件時
        """
        original_level = self.levels.find_one({"sequence": int(level_sequence)})
        if not original_level:
            raise ValueError(f"關卡序號 {level_sequence} 不存在")
        
        update_data = {}
        
        if "name" in level_data and level_data["name"] != original_level["name"]:
            existing_level = self.levels.find_one({"name": level_data["name"]})
            if existing_level and existing_level["sequence"] != int(level_sequence):
                raise ValueError(f"關卡名稱已存在")
            update_data["name"] = level_data["name"]
        
        if "description" in level_data:
            update_data["description"] = level_data["description"]
        
        if "unlock_requirement" in level_data and level_data["unlock_requirement"] != original_level["unlock_requirement"]:
            unlock_requirement = int(level_data["unlock_requirement"])
            
            if int(level_sequence) == unlock_requirement:
                raise ValueError(f"關卡序號不能等於解鎖條件")
            
            if unlock_requirement > 0 and not self.levels.find_one({"sequence": unlock_requirement}):
                raise ValueError(f"解鎖條件關卡 {unlock_requirement} 不存在")
                
            update_data["unlock_requirement"] = unlock_requirement
        
        if not update_data:
            return self.get_level_by_sequence(level_sequence)
        
        result = self.levels.update_one(
            {"sequence": int(level_sequence)}, 
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return None
        
        return self.get_level_by_sequence(level_sequence)
    
    def get_chapters_level(self, chapter_name: str):
        """根據章節名稱找出所有關卡(Level)
        Args: 
            chapter_name(章節名稱): string
        
        Returns:
            Array: 關卡資訊
        """
        levels = list(self.levels.find({"chapter": chapter_name}).sort("sequence", 1))
        
        for level in levels:
            if '_id' in level:
                level['_id'] = str(level['_id'])
                
        return levels
    
    def _is_level_exists(self, level_sequence: int) -> bool:
        """檢查關卡是否存在"""
        return self.levels.find_one({"sequence": level_sequence}) is not None
    
    def get_all_levels(self):
        try:
            levels = list(self.levels.find({}).sort("sequence", 1))
            
            for level in levels:
                level['_id'] = str(level['_id'])
                
            return levels
        except Exception as e:
            print(f"Get all levels error: {str(e)}")
            raise
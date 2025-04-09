from flask import request
from services import LevelService, ChapterService
from config import Config
from models import Level

level_service = LevelService(Config.MONGO_URI)
chapter_service = ChapterService(Config.MONGO_URI)

class LevelController:
    def add_level():
        try:
            data = request.get_json()
            
            required_fields = ['sequence', 'chapter', 'name', 'description', 'unlock_requirement']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
            
            level_data = {
                'sequence': int(data['sequence']),
                'chapter': data['chapter'],
                'name': data['name'],
                'description': data['description'],
                'unlock_requirement': int(data['unlock_requirement'])
            }
            
            if level_data['sequence'] != 1 and level_data['unlock_requirement'] <= 0:
                return {
                    "message": f"解鎖條件不能小於0",
                }, 400
            
            if level_data['sequence'] < 0:
                return {
                    "message": f"關卡順序不能小於0",
                }, 400
                
            # 檢查序號是否重複
            existing_level = level_service.get_level_by_sequence(data['sequence'])
            if existing_level:
                return {
                    "message": f"關卡序號 {level_data['sequence']} 已存在",
                }, 400
            
            if not chapter_service._check_chapter_exists(level_data['chapter']):
                return {
                    "message": f"章節 {level_data['chapter']} 不存在",
                }, 400
              
            level = Level(**level_data)
            
            # 添加關卡
            try:
                result = level_service.add_level(level)
                # 成功添加關卡後，更新對應章節的 levels 陣列
                chapter_service._add_level_to_chapter(level_data['chapter'], result)
                
                return {
                    "message": "關卡創建成功",
                    "body": {
                        "_id": result,
                        "level": level.to_dict()
                    }
                }, 200
            except ValueError as e:
                return {
                    "message": str(e)
                }, 400
                
        except Exception as e:
            return {
                "message": f"伺服器錯誤(add_level): {str(e)}"
            }, 500
    
    def get_level_by_sequence(user, sequence: int):
        try:
            level = level_service.get_level_by_sequence(sequence)
            if not level:
                return {
                    "message": f"關卡 {sequence} 不存在"
                }, 404
            
            return {
                "message": "獲取關卡成功",
                "body": level.to_dict()
            }, 200
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_level_by_sequence): {str(e)}"
            }, 500
            
    def delete_level():
        try:
            data = request.get_json()
            level_sequence = data['sequence']
            
            if not level_sequence:
                return {
                    "message": "請提供關卡序號"
                }, 400
            
            # 刪除關卡，同時獲取被刪除關卡的信息
            result = level_service.delete_level(level_sequence)
            if not result:
                return {
                    "message": f"關卡 {level_sequence} 不存在"
                }, 404
            
            # 從對應章節的 levels 陣列中移除關卡 ID
            chapter_name = result.get("chapter")
            level_id = result.get("level_id")
            if chapter_name and level_id:
                chapter_service._remove_level_from_chapter(chapter_name, level_id)
            
            return {
                "message": "刪除關卡成功"
            }, 200
        except Exception as e:
            return {
                "message": f"伺服器錯誤(delete_level): {str(e)}"
            }, 500
            
    def update_level():
        """更新關卡
        
        根據請求的 JSON 數據更新關卡，並進行相關檢查
        """
        try:
            data = request.get_json()
            
            # 檢查必填字段
            if 'sequence' not in data:
                return {
                    "message": "缺少: sequence",
                }, 400
            
            level_sequence = int(data['sequence'])
            
            # 檢查關卡是否存在
            original_level = level_service.get_level_by_sequence(level_sequence)
            if not original_level:
                return {
                    "message": f"關卡 {level_sequence} 不存在",
                }, 404
            
            # 準備更新數據
            update_data = {}
            
            # 檢查並更新名稱
            if 'name' in data:
                update_data['name'] = data['name']
            
            # 檢查並更新描述
            if 'description' in data:
                update_data['description'] = data['description']
            
            # 檢查並更新解鎖條件
            if 'unlock_requirement' in data:
                unlock_requirement = int(data['unlock_requirement'])
                
                # 檢查關卡序號不能等於解鎖條件
                if level_sequence == unlock_requirement:
                    return {
                        "message": "關卡序號不能等於解鎖條件",
                    }, 400
                
                # 第一關不需要解鎖條件
                if level_sequence == 1 and unlock_requirement != 0:
                    return {
                        "message": "第一關解鎖條件必須為0",
                    }, 400
                
                # 非第一關的解鎖條件必須大於0
                if level_sequence != 1 and unlock_requirement <= 0:
                    return {
                        "message": "解鎖條件不能小於0",
                    }, 400
                
                update_data['unlock_requirement'] = unlock_requirement
            
            # 如果沒有資料需要更新
            if not update_data:
                return {
                    "message": "沒有資料需要更新",
                    "body": original_level.to_dict()
                }, 200
            
            # 更新關卡
            try:
                updated_level = level_service.update_level(level_sequence, update_data)
                if updated_level:
                    return {
                        "message": "關卡更新成功",
                        "body": updated_level.to_dict()
                    }, 200
                else:
                    return {
                        "message": "關卡更新失敗",
                    }, 500
            except ValueError as e:
                return {
                    "message": str(e)
                }, 400
                
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_level): {str(e)}"
            }, 500
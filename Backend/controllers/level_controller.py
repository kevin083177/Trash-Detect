from flask import request
from services import LevelService, ChapterService
from config import Config
from models import Level

level_service = LevelService(Config.MONGO_URI)
chapter_service = ChapterService(Config.MONGO_URI)

class LevelController:
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
            
    def update_level():
        """更新關卡"""
        try:
            data = request.get_json()
            
            if 'sequence' not in data:
                return {
                    "message": "缺少: sequence",
                }, 400
            
            level_sequence = int(data['sequence'])
            
            original_level = level_service.get_level_by_sequence(level_sequence)
            if not original_level:
                return {
                    "message": f"關卡 {level_sequence} 不存在",
                }, 404
            
            original_level_dict = original_level.to_dict()
            
            update_data = {}
            
            if 'name' in data:
                update_data['name'] = data['name']
            
            if 'description' in data:
                update_data['description'] = data['description']
            
            if 'unlock_requirement' in data:
                unlock_requirement = int(data['unlock_requirement'])
                
                if level_sequence == 1 and unlock_requirement != 0:
                    return {
                        "message": "第一關解鎖條件必須為0",
                    }, 400
                
                if level_sequence != 1 and unlock_requirement <= 0:
                    return {
                        "message": "解鎖條件不能小於0",
                    }, 400
                
                update_data['unlock_requirement'] = unlock_requirement
            
            has_changes = any(
                key not in original_level_dict or original_level_dict[key] != value 
                for key, value in update_data.items()
            )
            
            if not has_changes:
                return {
                    "message": "沒有要更新的數據",
                    "body": original_level_dict
                }, 200
            
            result = level_service.update_level(level_sequence, update_data)
            if result:
                return {
                    "message": "關卡更新成功",
                    "body": result.to_dict()
                }, 200
            else:
                return {
                    "message": "關卡更新失敗"
                }, 500
                
        except ValueError as e:
            return {
                "message": str(e)
            }, 400
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_level): {str(e)}"
            }, 500
            
    def get_chapters_level(chapter_name: str):
        try:
            chapter = chapter_service.get_chapter_by_name(chapter_name)
            if chapter:
                result: list = level_service.get_chapters_level(chapter_name)
                
                return {
                    "message": f"成功找到 {chapter_name} 關卡資訊",
                    "body": result
                }, 200
            else:
                return {
                    "message": "無法找到該章節"
                }, 404
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_chapters_level): {str(e)}"
            }, 500
            
    def get_all_levels():
        try:
            levels = level_service.get_all_levels()
            
            if not levels:
                return {
                    "message": "目前暫無關卡",
                    "body": []
                }, 200
                
            return {
                "message": "成功獲取所有關卡",
                "body": levels
            }, 200
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_all_levels): {str(e)}"
            }, 500
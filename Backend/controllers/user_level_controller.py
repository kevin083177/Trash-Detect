from flask import request

from services import UserLevelService, ChapterService
from config import Config

user_level_service = UserLevelService(Config.MONGO_URI)
chapter_service = ChapterService(Config.MONGO_URI)

class UserLevelController:
    def set_chapter_unlocked(user_id):
        try:
            data = request.get_json()
        
            if not 'chapter_name' in data:
                return {
                    "message": "請提供章節名稱"
                }, 400
            
            chapter_name = data['chapter_name']
            
            if not chapter_service._check_chapter_exists(chapter_name):
                return {
                    "message": "章節不存在"
                }, 404
            
            # 檢查用戶關卡進度是否初始化
            user_level = user_level_service.get_user_level(user_id)
            if not user_level:
                user_level_service.init_user_level(user_id)
            
            # 檢查章節是否已解鎖
            chapter_exists = user_level_service._chapter_progress_exists(user_id, chapter_name)
            if chapter_exists:
                chapter_progress = user_level["chapter_progress"][chapter_name]
                if chapter_progress.get("unlocked", False):
                    return {
                        "message": "該章節已解鎖"
                    }, 400
            
            result = user_level_service.set_chapter_unlocked(user_id, chapter_name)
                
            if result:
                return {
                    "message": f"章節 {chapter_name} 解鎖成功"
                }, 200
            else:
                return {
                    "message": f"章節 {chapter_name} 解鎖失敗"
                }, 400
        except Exception as e:
            return {
                "message": f"設置章節解鎖狀態時發生錯誤: {str(e)}"
            }, 500
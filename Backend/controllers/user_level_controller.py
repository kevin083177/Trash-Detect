from bson import ObjectId
from flask import request

from services import UserLevelService, ChapterService, UserService, LevelService
from config import Config

user_level_service = UserLevelService(Config.MONGO_URI)
user_service = UserService(Config.MONGO_URI)
level_service = LevelService(Config.MONGO_URI)
chapter_service = ChapterService(Config.MONGO_URI)

class UserLevelController:
    def set_chapter_unlocked(user_id):
        try:
            data = request.get_json()
        
            if not 'chapter_sequence' in data:
                return {
                    "message": "請提供章節序列"
                }, 400
            
            # 將章節序列轉換為字串
            chapter_sequence = str(data['chapter_sequence'])
            chapter_name = chapter_service._get_chapter_name_by_sequence(int(chapter_sequence))
            
            if not chapter_service._check_chapter_exists(chapter_name):
                return {
                    "message": "章節不存在"
                }, 404
            
            user_level = user_level_service.get_user_level(user_id)
            
            # 檢查章節是否已存在
            chapter_exists = user_level_service._is_chapter_exists(user_id, chapter_sequence)
            if not chapter_exists:
                return {
                    "message": f"章節 {chapter_name} 尚未開啟"
                }, 400
            
            # 檢查章節是否已解鎖
            if user_level["chapter_progress"].get(chapter_sequence, {}).get("unlocked", False):
                return {
                    "message": "該章節已解鎖"
                }, 400
                    
            # 檢查使用者的回收數量是否足夠
            user_trash_count = user_service._get_user_total_trash(user_id)
            
            chapter_trash_needed = int(chapter_service.get_chapter_by_name(chapter_name)['trash_requirement'])
            if(user_trash_count < chapter_trash_needed):
                return {
                    "message": f"解鎖條件不足 需要回收數量: {chapter_trash_needed} 目前回收數量: {user_trash_count}"
                }, 400
            
            # 檢查使用者的遊玩關卡是否達標
            highest_level = int(user_level.get('highest_level', 0))
        
            # 檢查是否符合解鎖條件 (第一章需要0，第二章需要5，第三章需要10...)
            required_level = (int(chapter_sequence) - 1) * 5
            if highest_level < required_level:
                return {
                    "message": f"解鎖條件不足，需要完成關卡: {required_level}，目前最高關卡: {highest_level}"
                }, 400
            
            result = user_level_service.set_chapter_unlocked(user_id, chapter_sequence)
            
            if result:
                # 必然會開啟下一章
                next_chapter = str(int(chapter_sequence) + 1)
                user_level_service._add_new_chapter(user_id, next_chapter)
                return {
                    "message": f"章節 {chapter_name} 解鎖成功"
                }, 200
            else:
                return {
                    "message": f"章節 {chapter_name} 解鎖失敗"
                }, 400
        except Exception as e:
            return {
                "message": f"伺服器錯誤(set_chapter_unlocked): {str(e)}"
            }, 500
    
    @staticmethod 
    def set_chapter_completed(user_id):
        try:
            data = request.get_json()
            
            if not 'chapter_sequence' in data:
                return {
                    "message": "請提供章節序列"
                }, 400
                
            chapter_sequence = int(data['chapter_sequence'])
            chapter_sequence_str = str(chapter_sequence)
            chapter_name = chapter_service._get_chapter_name_by_sequence(chapter_sequence)
            
            if not chapter_service._check_chapter_exists(chapter_name):
                return {
                    "message": "章節不存在"
                }, 404
            
            # 檢查使用者關卡進度是否初始化
            user_level = user_level_service.get_user_level(user_id)
            if not user_level:
                user_level_service.init_user_level(user_id)
                user_level = user_level_service.get_user_level(user_id)
            
            # 檢查章節是否已存在
            chapter_exists = user_level_service._is_chapter_exists(user_id, chapter_sequence_str)
            if not chapter_exists:
                return {
                    "message": f"章節 {chapter_name} 尚未開啟"
                }, 400
            
            chapter_progress = user_level["chapter_progress"][chapter_sequence_str]
            
            # 檢查章節是否已完成
            if chapter_progress.get("completed", False):
                return {
                    "message": "該章節已設置完成"
                }, 400
            
            # 檢查章節是否已解鎖
            if not chapter_progress.get("unlocked", False):
                return {
                    "message": "該章節尚未解鎖"
                }, 400
            
            all_levels_completed = user_level_service._check_chapter_is_completed(user_id, chapter_sequence)
            
            if not all_levels_completed:
                return {
                    "message": f"該章節尚未達成完成條件"
                }, 400
                
            result = user_level_service.set_chapter_completed(user_id, chapter_sequence_str)
            
            if result:
                return {
                    "message": f"成功設置章節 {chapter_name} 已完成"
                }, 200
            else: 
                return {
                    "message": f"章節 {chapter_name} 設置失敗"
                }, 400
                
        except Exception as e:
            return {
                "message": f"伺服器錯誤(set_chapter_completed): {str(e)}"
            }, 500
            
    def get_user_level(user_id):
        """取得使用者關卡進度"""
        try:
            user_level = user_level_service.get_user_level(user_id)
            if user_level:
                user_level['_id'] = str(user_level['_id'])
                user_level.pop("user_id", None)
                return {
                    "message": "成功找到使用者關卡進度",
                    "body": user_level
                }, 200
            else:
                return {
                    "message": "無法找到使用者" 
                }, 404
                
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_user_level): {str(e)}"
            }, 500
                
    def update_level_progress(user_id):
        try:
            data = request.get_json()
            
            required_fields = ['sequence', 'score', 'stars']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
            
            sequence = data['sequence']
            new_score = data['score']
            new_stars = data['stars']
            
            # 檢查關卡記錄是否存在
            if not user_level_service._is_level_progress_exists(user_id, sequence):
                return {
                    "message": "沒有找到該關卡的紀錄"
                }, 404
                
            # 獲取當前的關卡記錄，用於比較分數
            current_level_progress = user_level_service._get_level_progress(user_id, sequence)
            if current_level_progress:
                current_score = current_level_progress.get('score', 0)
                current_stars = current_level_progress.get('stars', 0)
                
                # 檢查新分數或星星是否比當前記錄更好
                if new_score <= current_score and new_stars <= current_stars:
                    return {
                        "message": "分數未超過現有記錄，無需更新",
                        "body": {
                            "current_score": current_score,
                            "current_stars": current_stars,
                        }
                    }, 200
            
            # 更新關卡進度（只有更好的成績才會到這裡）
            result = user_level_service.update_level_progress(user_id, sequence, new_score, new_stars)
            
            if result:
                user_level = user_level_service.get_user_level(user_id)
                user_level['_id'] = str(user_level['_id'])
                user_level.pop("user_id", None)
                
                if new_stars == 3 and current_stars < 3:
                    try:
                        user_service.add_money(user_id, 100)
                    except Exception as e:
                        return {
                            "message": "新增金錢失敗"
                        }, 500
                
                # 只有當stars大於1時才初始化下一關
                if new_stars >= 1:
                    # 檢查這是否是玩家第一次獲得星星（之前的星星是0）
                    is_first_star = current_stars == 0
                    
                    # 如果是首次獲得星星，初始化下一關
                    if is_first_star:
                        # 初始化下一關的關卡資訊
                        new_level = user_level_service._add_new_level(user_id, sequence + 1)
                        if not new_level:
                            return {
                                "message": "下一關卡記錄初始化失敗"
                            }, 500
                    
                        # 更新最高關卡
                        highest_level = user_level_service._update_highest_level(user_id, sequence)
                        if not highest_level:
                            return {
                                "message": "更新最高關卡失敗"
                            }, 500
                        
                return {
                    "message": "關卡紀錄更新成功",
                    "body": user_level
                }, 200
            else:
                return {
                    "message": "關卡紀錄更新失敗"
                }, 400
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_level_progress): {str(e)}"
            }, 500
            
    @staticmethod
    def update_completed_chpater(user_id):
        try:
            data = request.get_json()
            
            required_fields = ['chapter_sequence', 'score', 'money']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
            
            chapter_sequence = str(data['chapter_sequence'])
            score = int(data['score'])
            money = int(data['money'])
            
            chapter_name = chapter_service._get_chapter_name_by_sequence(int(chapter_sequence))
            if not chapter_service._check_chapter_exists(chapter_name):
                return {
                    "message": "章節不存在"
                }, 404
                
            user_level = user_level_service.get_user_level(user_id)
            if not user_level:
                return {
                    "message": "使用者關卡進度未初始化"
                }, 400
                
            if not user_level_service._is_chapter_completed(user_id, chapter_sequence):
                return {
                    "message": "該章節尚未完成"
                }, 400
                
            result = user_level_service.update_completed_chapter(user_id, chapter_sequence, score)
            
            if not result["success"]:
                return {
                    "message": result["message"]
                }, 400
                
            money_added = user_service.add_money(user_id, money)
            if not money_added:
                return {
                    "message": "獲得金錢獎勵時發生錯誤"
                }, 500
            
            response_data = {
                "chapter_name": chapter_name,
                "money_earned": money,
                "remaining": result["remaining"],
                "highest_score": result["highest_score"]
            }
            
            if result.get("score_updated", False):
                response_data["score_updated"] = True
                response_data["new_highest_score"] = result["highest_score"]
            
            return {
                "message": f"成功更新已完成章節",
                "body": response_data
            }, 200
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_completed_chapter): {str(e)}"
            }, 500
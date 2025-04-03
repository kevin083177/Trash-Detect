from flask import request
from services import QuestionService, QuestionCategoryService
from config import Config
from bson import ObjectId

question_service = QuestionService(Config.MONGO_URI)
question_category_service = QuestionCategoryService(Config.MONGO_URI)

class QuestionController:
    def add_question():
        """新增題目"""
        try:
            data = request.get_json()
            
            required_fields = ['category', 'content', 'options', 'correct_answer']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
                
            if not question_category_service._check_category_exists(data['category']):
                return {
                    "message": "題目類別不存在",
                }, 404 
            
            # 檢查選項 ID 是否為 A、B、C、D
            expected_ids = ['A', 'B', 'C', 'D']
            option_ids = [option.get('id') for option in data['options']]
            
            # 檢查所有必要的選項 ID 是否都存在
            missing_ids = set(expected_ids) - set(option_ids)
            if missing_ids:
                return {
                    "message": f"缺少必要的選項 ID: {', '.join(missing_ids)}",
                }, 400
                
            # 檢查是否有額外的選項 ID
            extra_ids = set(option_ids) - set(expected_ids)
            if extra_ids:
                return {
                    "message": f"包含不允許的選項 ID: {', '.join(extra_ids)}",
                }, 400
                
            # 檢查正確答案是否在選項中
            if data['correct_answer'] not in expected_ids:
                return {
                    "message": f"正確答案必須是: {', '.join(expected_ids)}",
                }, 400
            
            question_data = {
                "category": data["category"],
                "content": data["content"],
                "options": data["options"],
                "correct_answer": data["correct_answer"]
            }

            result = question_service.add_question(question_data)
            if result:
                question_category_service._add_question_to_category(data['category'], result)
                return {
                    "message": f"成功新增題目至 {data['category']} 類別",
                    "body": {
                        "id": str(result),
                        "content": question_data["content"]
                    }   
                }, 200
        except Exception as e:
            return {
                "message": f"伺服器錯誤(add_question) {str(e)}",
            }, 500
            
    def delete_question():
        """刪除題目"""
        try:
            data = request.get_json()
            
            if "_id" not in data:
                return {
                    "message": "缺少: _id",
                }, 400
            
            question = question_service.get_question(data["_id"])
            if not question:
                return {
                    "message": "題目不存在",
                }, 404
            
            category = question_category_service._remove_question_from_category(question['category'], data["_id"])
            if not category:
                return {
                    "message": "從題目類別中移除題目失敗"
                }, 500
                
            result = question_service.delete_question(data["_id"])
            if result:
                return {
                    "message": f"成功刪除 {question['category']} 類別題目: {question['content']}"
                }, 200
            else:    
                return {
                    "message": "刪除題目失敗"
                }, 500
        except Exception as e:
            return {
                "message": f"伺服器錯誤(delete_question) {str(e)}",
            }, 500
            
    def get_question(user, question_id):
        """獲取題目"""
        try:
            question = question_service.get_question(question_id)
            if not question:
                return {
                    "message": "題目不存在",
                }, 404
            
            return {
                "message": "成功獲取題目",
                "body": question
            }, 200
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_question) {str(e)}",
            }, 500
    
    def get_question_by_category(user, category):
        """根據類別獲取題目"""
        try:
            if not question_category_service._check_category_exists(category):
                return {
                    "message": "題目類別不存在",
                }, 404
                
            questions = question_service.get_question_by_category(category)
            if not questions:
                return {
                    "message": "無法取得題目",
                }, 404
            
            return {
                "message": "成功獲取題目",
                "body": questions
            }, 200
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_question_by_category) {str(e)}",
            }, 500
    
    def update_question():
        """更新題目"""
        try:
            data = request.get_json()
            
            if "_id" not in data:
                return {
                    "message": "缺少: _id",
                }, 400
            
            question_id = data["_id"]  # 先儲存 ID 供後續使用
            
            # 獲取原始題目資訊
            original_question = question_service.get_question(question_id)
            if not original_question:
                return {
                    "message": "題目不存在",
                }, 404
            
            # 如果有提供類別，檢查類別是否存在
            if 'category' in data and data['category'] != original_question['category']:
                if not question_category_service._check_category_exists(data['category']):
                    return {
                        "message": "新題目類別不存在",
                    }, 404
            
            # 檢查選項 ID 是否為 A、B、C、D
            if 'options' in data:
                expected_ids = ['A', 'B', 'C', 'D']
                option_ids = [option.get('id') for option in data['options']]
                
                # 檢查所有必要的選項 ID 是否都存在
                missing_ids = set(expected_ids) - set(option_ids)
                if missing_ids:
                    return {
                        "message": f"缺少必要的選項 ID: {', '.join(missing_ids)}",
                    }, 400
                    
                # 檢查是否有額外的選項 ID
                extra_ids = set(option_ids) - set(expected_ids)
                if extra_ids:
                    return {
                        "message": f"包含不允許的選項 ID: {', '.join(extra_ids)}",
                    }, 400
            
            # 檢查正確答案是否在選項中
            if 'correct_answer' in data:
                if data['correct_answer'] not in expected_ids:
                    return {
                        "message": f"正確答案必須是: {', '.join(expected_ids)}",
                    }, 400

            # 處理類別變更
            if 'category' in data and data['category'] != original_question['category']:
                # 從舊類別中移除題目
                old_category_result = question_category_service._remove_question_from_category(
                    original_question['category'], question_id
                )
                if not old_category_result:
                    return {
                        "message": "從原題目類別中移除題目失敗"
                    }, 500
                    
                # 將題目添加到新類別
                new_category_result = question_category_service._add_question_to_category(
                    data['category'], ObjectId(question_id)
                )
                if not new_category_result:
                    # 嘗試恢復原始狀態
                    question_category_service._add_question_to_category(
                        original_question['category'], ObjectId(question_id)
                    )
                    return {
                        "message": "添加題目到新類別失敗"
                    }, 500

            # 從資料中移除 _id 欄位，避免嘗試更新不可變欄位
            update_data = data.copy()
            update_data.pop('_id', None)

            # 更新題目
            result = question_service.update_question(question_id, update_data)
            if result:
                return {
                    "message": f"成功更新題目",
                    "body": update_data
                }, 200
            else:
                return {
                    "message": "更新題目失敗(題目未做更動)"
                }, 500
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_question) {str(e)}",
            }, 500
from flask import request
from services import QuestionCategoryService
from config import Config
from bson import ObjectId

question_category_service = QuestionCategoryService(Config.MONGO_URI)

class QuestionCategoryController:
    def add_category():
        """新增題目類別"""
        try:
            data = request.get_json()
            
            required_fields = ['name', 'description']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400

            if question_category_service._check_category_exists(data['name']):
                return {
                    "message": "題目類別已存在",
                }, 409
            
            category_data = {
                "name": data["name"],
                "description": data["description"]
            }

            result = question_category_service.add_category(category_data)
            return {
                "message": "新增題目類別成功",
                "body": {
                    "id": str(result),
                    "name": category_data["name"]
                }   
            }, 200
        except Exception as e:
            return {
                "message": f"伺服器錯誤(add_category) {str(e)}",
            }, 500
    def delete_category():
        """刪除題目類別"""
        try:
            data = request.get_json()
            
            if "name" not in data:
                return {
                    "message": "缺少: name",
                }, 400

            if not question_category_service._check_category_exists(data["name"]):
                return {
                    "message": "題目類別不存在",
                }, 404
            
            result = question_category_service.delete_category(data["name"])
            if result:
                return {
                    "message": f"成功刪除 {data['name']} 類別"
                }, 200
            return {
                "message": "刪除題目類別失敗"
            }, 500
        except Exception as e:
            return {
                "message": f"伺服器錯誤(delete_category): {str(e)}"
            }, 500
            
    @staticmethod
    def get_categories(user):
        """獲取所有題目分類"""
        try:
            categories = question_category_service.get_all_categories()
            if not categories:
                return {
                    "message": "無法找到題目類別",
                }, 404
            return {
                "message": "成功找到題目類別",
                "body": categories
            }, 200
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_categories) {str(e)}"
            }, 500
            
    def update_category():
        """更新題目類別"""
        try:
            data = request.get_json()
            
            required_fields = ['_id', 'name', 'description']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
                
            category_id = data["_id"]
            
            # 直接從資料庫獲取原始類別資訊
            try:
                # 直接從數據庫獲取類別
                original_category = question_category_service.question_categories.find_one({"_id": ObjectId(category_id)})

                if not original_category:
                    return {
                        "message": "題目類別不存在",
                    }, 404
                
                # 將 _id 轉換為字符串
                original_category["_id"] = str(original_category["_id"])
                
            except Exception as e:
                return {
                    "message": f"獲取題目類別失敗: {str(e)}",
                }, 500
                
            # 準備更新資料 - 只包含需要更新的欄位
            update_data = {}
            if data["name"] != original_category["name"]:
                update_data["name"] = data["name"]
            if data["description"] != original_category["description"]:
                update_data["description"] = data["description"]
                
            # 如果沒有資料需要更新
            if not update_data:
                return {
                    "message": "沒有資料需要更新",
                    "body": {
                        "name": original_category["name"],
                        "description": original_category["description"]
                    }
                }, 200
                    
            # 如果要更新名稱，檢查新名稱是否已存在
            if "name" in update_data:
                if question_category_service._check_category_exists(update_data["name"]):
                    return {
                        "message": "新題目類別名稱已存在",
                    }, 409
                
            result = question_category_service.update_category(category_id, update_data)
            if result or result == 0:  # 0 表示沒有題目需要更新類別名稱
                return {
                    "message": f"成功更新題目類別 已修改 {result} 筆題目資料",
                    "body": {
                        "name": update_data.get("name", original_category["name"]),
                        "description": update_data.get("description", original_category["description"])
                    }
                }, 200
            else:
                return {
                    "message": "更新題目類別失敗",
                }, 500
                    
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_category) {str(e)}",
            }, 500
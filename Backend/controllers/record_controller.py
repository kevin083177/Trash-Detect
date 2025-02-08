from flask import request

from services import RecordService
from config import Config

record_service = RecordService(Config.MONGO_URI)

class RecordController:
    @staticmethod
    def get_record_by_id(user, record_id):  # user 參數保留給 token_required
        try:
            record = record_service.get_record_by_id(record_id)  # 只傳入 record_id
            if record:
                record["_id"] = str(record["_id"])
                record.pop("user_id", None)
                return {
                    "message": "成功找到回收紀錄",
                    "body": record
                }, 200
            return {
                "message": "無法找到回收紀錄"
            }, 404
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_record_by_id) {str(e)}"
            }, 500
    
    @staticmethod
    def get_category_count(user, record_id, category):
        try:
            count = record_service.get_category_count(record_id, category)
            if count is not False:
                return {
                    "message": f"成功取得{category}數量",
                    "body": count
                }, 200
            return {
                "message": "無法找到回收資料或分類不存在"
            }, 404
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_category_count) {str(e)}"
            }, 500
            
    @staticmethod
    def add_category_count(user):
        try:
            data = request.get_json()
            
            required_fields = ['category', 'count']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
            
            user_id = user['_id']
            category = data['category']
            count = data['count']
            
            result = record_service.add_category_count(user_id, category, count)
            if result:
                record = record_service.get_record_by_user(user_id)
                record["_id"] = str(record["_id"])
                record.pop("user_id", None)
                
                return {
                    "message": f"成功增加 {category} 數量",
                    "body": record
                }, 200
            return {
                "message": "無法找到回收資料或分類不存在"
            }, 404
        except Exception as e:
            return {
                "message": f"伺服器錯誤(add_category_count) {str(e)}"
            }, 500
            
from flask import jsonify, request
from services.user_service import UserService
from services.record_service import RecordService
from config import Config
from bson import ObjectId

user_service = UserService(Config.MONGO_URI)
record_service = RecordService(Config.MONGO_URI)

class UserController:
    @staticmethod
    def get_user(user_id):
        try:
            user = user_service.get_user(user_id)
            if user:
                user.pop('password', None)
                user['_id'] = str(user['_id'])
                return {
                    "message": "成功找到使用者",
                    "body": user
                }, 200
            return {
                "message": "無法找到使用者"
            }, 404
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_user) {str(e)}"
            }, 500
            
    @staticmethod
    def _handle_money_operation(operation_type, error_type):
        try:
            data = request.get_json()
            required_fields = ['user_id', 'price']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {"message": f"缺少: {', '.join(missing_fields)}"}, 400

            result = operation_type(data['user_id'], data['price'])
            if result:  
                result.pop("password", None)
                result["_id"] = str(result["_id"])
                return {"message": "金錢更新成功", "body": result}, 200
                
            return {"message": "無法找到使用者"}, 404
            
        except ValueError as e:
            return {"message": str(e)}, 400
        except Exception as e:
            return {"message": f"伺服器錯誤({error_type}) {str(e)}"}, 500

    @staticmethod
    def add_money():
        return UserController._handle_money_operation(user_service.add_money, 'add_money')

    @staticmethod  
    def subtract_money():
        return UserController._handle_money_operation(user_service.subtract_money, 'subtract_money')
    
    @staticmethod
    def get_user_record(user_id):
        try:
            user = record_service.get_user_record(user_id)
            
            if user:
                user.pop("user_id", None)
                user["_id"] = str(user["_id"])
                return {
                    "message": "成功找到使用者回收紀錄",
                    "body": user
                }, 200
            
            return {
                "message": "無法找到使用者",
            }, 404
        
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_user_record) {str(e)}"
            }, 500
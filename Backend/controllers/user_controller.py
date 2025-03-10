from services import UserService, RecordService, AuthService
from config import Config
from bson import ObjectId
from flask import request

auth_service = AuthService(Config.MONGO_URI)
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
    def update_user(user_id):
        try:
            data = request.get_json()
            required_fields = ['username', 'password', 'email']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
            
            # 先獲取當前使用者資料
            current_user = user_service.get_user(user_id)
            if not current_user:
                return {
                    "message": "無法找到使用者"
                }, 404

            # 只在 username 有變更時才檢查重複
            if data['username'] != current_user['username']:
                if auth_service.check_username_exists(data['username']):
                    return {
                        "message": "使用者名稱已被使用",
                    }, 409

            # 只在 email 有變更時才檢查重複
            if data['email'] != current_user['email']:
                if auth_service.check_email_exists(data['email']):
                    return {
                        "message": "電子郵件已被使用",
                    }, 409
            
            user = user_service.update_user(user_id, data['username'], data['email'], data['password'])
            
            if user:
                user['_id'] = str(user['_id'])
                user.pop("password", None)
                return {
                    "message": "使用者資料更新成功",
                    "body": user
                }, 200
            
            return {
                "message": "無法找到使用者"
            }, 404
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_user) {str(e)}"
            }, 500

    @staticmethod
    def add_money(user_id):
        try:
            data = request.get_json()
            
            if 'money' not in data:
                return {
                    "message": f"缺少: {'money'}",
                }, 400
            
            money = data['money']
            
            if not (isinstance(money, int) and money > 0):
                return {
                    "message": "money 必須為正整數"
                }, 400
            
            result = user_service.add_money(user_id, money)
            if result:  
                result.pop("password", None)
                result["_id"] = str(result["_id"])
                return {"message": "金錢更新成功", "body": result}, 200
                
            return {"message": "無法找到使用者"}, 404
            
        except ValueError as e:
            return {"message": str(e)}, 400
        except Exception as e:
            return {"message": f"伺服器錯誤(add_money) {str(e)}"}, 500

    @staticmethod  
    def subtract_money(user_id):
        try:
            data = request.get_json()
            
            if 'money' not in data:
                return {
                    "message": f"缺少: {'money'}",
                }, 400
            
            money = data['money']
            
            if not (isinstance(money, int) and money > 0):
                return {
                    "message": "money 必須為正整數"
                }, 400
            
            result = user_service.subtract_money(user_id, money)
            if result:  
                result.pop("password", None)
                result["_id"] = str(result["_id"])
                return {"message": "金錢更新成功", "body": result}, 200
                
            return {"message": "無法找到使用者"}, 404
            
        except ValueError as e:  
            return {"message": str(e)}, 400
        except Exception as e:
            return {"message": f"伺服器錯誤(subtract_money) {str(e)}"}, 500
            
    @staticmethod
    def get_record_by_user(user_id):
        try:
            user = record_service.get_record_by_user(user_id)
            
            if user:
                user.pop("user_id", None)
                user["_id"] = str(user["_id"])
                return {
                    "message": "成功找到使用者回收紀錄",
                    "body": user
                }, 200
            
            return {
                "message": "無法找到回收紀錄",
            }, 404
        
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_record_by_user) {str(e)}"
            }, 500
            
    @staticmethod
    def daliy_check_in(user_id):
        try:
            result = user_service.daliy_check_in(user_id)
            
            if result:
                result.pop('password', None)
                result['_id'] = str(result['_id'])
                
                last_check_in = result.get('last_check_in')
                if last_check_in:
                    result['last_check_in'] = last_check_in
                    
                return {
                    "message": "簽到成功",
                    "body": result
                }, 200
                
            return {
                "message": "無法找到使用者"
            }, 404
            
        # 已簽到
        except ValueError as e:
            return {
                "message": str(e),
            }, 400
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(daily_check_in) {str(e)}"
            }, 500

    @staticmethod
    def daily_check_in_status(user_id):
        try:
            status = user_service.daily_check_in_status(user_id)
            
            if status is None:
                return {
                    "message": "無法找到使用者"
                }, 404
                
            return {
                "body": {
                    "hasCheckedIn": status
                }
            }, 200
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(daily_check_in_status) {str(e)}"
            }, 500
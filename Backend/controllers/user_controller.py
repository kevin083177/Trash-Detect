from flask import jsonify, request
from services.user_service import UserService
from config import Config
from bson import ObjectId

user_service = UserService(Config.MONGO_URI)

class UserController:
    @staticmethod
    def create_user():
        try:
            data = request.get_json()
            
            # 檢查必填欄位
            required_fields = ['username', 'password', 'email']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
            
            # 檢查 username 是否已存在
            if user_service.check_username_exists(data['username']):
                return {
                    "message": "使用者名稱已存在",
                }, 409

            # 檢查 email 是否已存在
            if user_service.check_email_exists(data['email']):
                return {
                    "message": "電子郵件已被註冊",
                }, 409
                
            # 創建新使用者
            result = user_service.create_user(data)
            created_user = user_service.get_user(result)
            
            if created_user:
                created_user.pop('password', None)
                created_user['_id'] = str(created_user['_id'])
                
            return {
                "message": "註冊成功",
                "body": created_user
            }, 200
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(create_user) {str(e)}",
            }, 500

    @staticmethod
    def get_user(user_id):
        try:
            user = user_service.get_user(user_id)
            if user:
                user.pop('password', None)
                user['_id'] = str(user['_id'])
                return jsonify(user), 200
            return {"error": "無法找到使用者"}, 404
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_user) {str(e)}",
            }, 500
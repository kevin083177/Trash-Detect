
from flask import request
from services.auth_service import AuthService
from config import Config
from controllers.user_controller import user_service

auth_service = AuthService(Config.MONGO_URI)

class AuthController:
    @staticmethod
    def register():
        try:
            data = request.get_json()
            
            # 檢查必填欄位
            required_fields = ['username', 'password', 'email', 'userRole']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
            
            # 檢查 username 是否已存在
            if auth_service.check_username_exists(data['username']):
                return {
                    "message": "使用者名稱已存在",
                }, 409

            # 檢查 email 是否已存在
            if auth_service.check_email_exists(data['email']):
                return {
                    "message": "電子郵件已被註冊",
                }, 409
                
            # 創建新使用者
            result = auth_service.register(data)
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
    def login():
        try:
            data = request.get_json()
            if not data or 'email' not in data or 'password' not in data:
                return {
                    "message": "請提供電子郵件和密碼",
                }, 400

            token, user = auth_service.login(data['email'], data['password'])
            
            if not token or not user:
                return {
                    "message": "電子郵件或密碼錯誤",
                }, 401

            # 移除敏感資訊
            user.pop('password', None)
            user['_id'] = str(user['_id'])
            
            return {
                "message": "登入成功",
                "body": {
                    "user": user,
                    "token": token
                }
            }, 200

        except Exception as e:
            return {
                "message": f"伺服器錯誤(login) {str(e)}",
            }, 500
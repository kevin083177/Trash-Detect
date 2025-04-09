from flask import request
from services import AuthService, PurchaseService, UserService, UserLevelService
from config import Config

auth_service = AuthService(Config.MONGO_URI)
user_service = UserService(Config.MONGO_URI)
user_level_service = UserLevelService(Config.MONGO_URI)
purchase_service = PurchaseService(Config.MONGO_URI)

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
                
            # 檢查 userRole 是否符合規範 (user, admin)
            if (data['userRole'] != 'user') and (data['userRole'] != 'admin'):
                return {
                    "message": "userRole 格式錯誤"
                }, 400
                
            # 創建新使用者
            result = auth_service.register(data)
            created_user = user_service.get_user(result)
            
            if created_user:
                # 初始化使用者購買商品、關卡資訊
                purchase_success = purchase_service.init_user_purchase(result)
                user_level_success = user_level_service.init_user_level(result)
                
                if not purchase_success or not user_level_success:
                    return {
                        "message": "初始化使用者資料失敗",
                    }, 500
                
                created_user.pop('password', None)
                created_user['_id'] = str(created_user['_id'])
                
            return {
                "message": "註冊成功",
                "body": created_user
            }, 200
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(register) {str(e)}",
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
    @staticmethod
    def logout(user):
        try:
            # 執行登出操作
            if auth_service.logout(user['_id']):
                return {
                    "message": "登出成功",
                }, 200
            else:
                return {
                    "message": "登出失敗",
                }, 500

        except Exception as e:
            return {
                "message": f"伺服器錯誤(logout) {str(e)}",
            }, 500
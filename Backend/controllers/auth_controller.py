from flask import request
from services import AuthService, PurchaseService, UserService, UserLevelService, VerificationService
from config import Config

auth_service = AuthService(Config.MONGO_URI)
user_service = UserService(Config.MONGO_URI)
user_level_service = UserLevelService(Config.MONGO_URI)
purchase_service = PurchaseService(Config.MONGO_URI)
verification_service = VerificationService(Config.MONGO_URI)

class AuthController:
    @staticmethod
    def register():
        """發送驗證郵件"""
        try:
            data = request.get_json()
            
            required_fields = ['username', 'password', 'email']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
            
            if auth_service.check_username_exists(data['username']):
                return {
                    "message": "使用者名稱已存在",
                }, 409

            # 檢查 email 是否已存在
            if auth_service._check_email_exists(data['email']):
                return {
                    "message": "電子郵件已被註冊",
                }, 409
            
            # 檢查 userRole 是否符合規範 (user, admin)
            if (data['userRole'] != 'user') and (data['userRole'] != 'admin'):
                return {
                    "message": "userRole 格式錯誤"
                }, 400
            
            # 創建驗證記錄並發送郵件
            success, message = verification_service.create_verification(
                email=data['email'],
                username=data['username'],
                password=data['password'],
                user_role=data['userRole']
            )
            
            return {
                "message": message
            }, 200 if success else 400
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(register) {str(e)}",
            }, 500
    
    @staticmethod
    def verify_email():
        """驗證郵件驗證碼"""
        try:
            data = request.get_json()
            
            required_fields = ['email', 'verification_code']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
            
            # 驗證驗證碼
            success, message, user_data = verification_service.verify_code(
                data['email'], 
                data['verification_code']
            )
            
            if not success:
                return {
                    "message": message,
                }, 400
            
            # 更新用戶email
            existing_user = user_service.users.find_one({"email": data['email']})
            if existing_user:
                user_service._set_email_verified(str(existing_user["_id"]))
                verification_service.verifications.delete_one({"email": data['email']})
                
                updated_user = user_service.get_user(str(existing_user['_id']))
                updated_user.pop('password', None)
                updated_user['_id'] = str(updated_user['_id'])
                
                return {
                    "message": "電子郵件驗證成功",
                    "body": updated_user
                }, 200
            
            # 創建用戶
            else:
                result = auth_service.register(user_data)
                created_user = user_service.get_user(result)
                if created_user:
                    # 初始化用戶購買商品、關卡資訊
                    purchase_success = purchase_service.init_user_purchase(result)
                    user_level_success = user_level_service.init_user_level(result)
                
                    if not purchase_success or not user_level_success:
                        # 初始化失敗刪除已創建的用戶
                        auth_service.users.delete_one({"_id": result})
                        return {
                            "message": "初始化使用者資料失敗",
                        }, 500
                    
                    # 初始化第一章和第一關
                    user_level_service._add_new_chapter(result, 1)
                    user_level_service._add_new_level(result, 1)
                
                    # 清理驗證記錄，並將 verification 設為 true
                    verification_service.verifications.delete_one({"email": data['email']})
                    user_service._set_email_verified(result)

                    created_user.pop('password', None)
                    created_user['_id'] = str(created_user['_id'])
                
                return {
                    "message": "註冊成功",
                    "body": created_user
                }, 200
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(verify_email) {str(e)}",
            }, 500
    
    @staticmethod
    def resend_verification():
        """重新發送驗證碼"""
        try:
            data = request.get_json()
            
            if 'email' not in data:
                return {
                    "message": "缺少: email",
                }, 400
            
            success, message = verification_service.resend_verification_code(data['email'])
            
            return {
                "message": message,
            }, 200 if success else 400
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(resend_verification) {str(e)}",
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
            
    @staticmethod
    def get_verification_status():
        """獲取驗證狀態"""
        try:
            email = request.args.get('email')
            
            if not email:
                return {
                    "message": "缺少 email 參數",
                }, 400
            
            status = verification_service.get_verification_status(email)
            
            return {
                "body": status
            }, 200
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_verification_status) {str(e)}",
            }, 500
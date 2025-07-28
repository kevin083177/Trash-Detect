from services import UserService, AuthService, DailyTrashService, VerificationService, ImageService
from config import Config
from bson import ObjectId
from flask import request

auth_service = AuthService(Config.MONGO_URI)
image_service = ImageService(Config.get_cloudinary_config())
user_service = UserService(Config.MONGO_URI, image_service)
daily_trash_service = DailyTrashService(Config.MONGO_URI)
verification_service= VerificationService(Config.MONGO_URI)

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
    def update_username(user_id):
        """更新使用者名稱"""
        try:
            data = request.get_json()
            
            if 'username' not in data:
                return {
                    "message": "缺少 username"
                }, 400
            
            new_username = data['username']
            
            # 檢查使用者名稱是否已存在
            if auth_service.check_username_exists(new_username):
                return {
                    "message": "使用者名稱已被使用"
                }, 409
            
            # 更新使用者名稱
            updated_user = user_service.update_username(user_id, new_username)
            
            if updated_user:
                updated_user.pop('password', None)
                updated_user['_id'] = str(updated_user['_id'])
                return {
                    "message": "使用者名稱更新成功",
                    "body": updated_user
                }, 200
            
            return {
                "message": "無法找到使用者"
            }, 404
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_username) {str(e)}"
            }, 500
    
    @staticmethod
    def update_password(user_id):
        """更新密碼"""
        try:
            data = request.get_json()
            
            required_fields = ['old_password', 'new_password']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}"
                }, 400
            
            old_password = data['old_password']
            new_password = data['new_password']
            
            # 驗證舊密碼
            user = user_service.get_user(user_id)
            if not user:
                return {
                    "message": "無法找到使用者"
                }, 404
                
            if not auth_service.verify_password(old_password, user['password']):
                return {
                    "message": "舊密碼錯誤"
                }, 400
            
            # 更新密碼
            updated_user = user_service.update_password(user_id, new_password)
            
            if updated_user:
                return {
                    "message": "密碼更新成功",
                }, 200
            
            return {
                "message": "密碼更新失敗"
            }, 400
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_password) {str(e)}"
            }, 500

    @staticmethod
    def update_email(user_id):
        try:
            data = request.get_json()
            
            if 'email' not in data:
                return {
                    "message": "缺少 email"
                }, 400
                
            new_email = data['email']
            
            if auth_service._check_email_exists(new_email):
                return {
                    "message": "電子郵件已被使用"
                }, 409
                
            user = user_service.get_user(user_id)
            
            if not user:
                return {
                    "message": "無法找到使用者"
                }, 404
                
            if user['email'] == new_email:
                return {
                    "message": "新電子郵件與目前電子郵件相同"
                }, 400
            
            updated_user = user_service._set_email_unverified(user_id, new_email)
            
            if updated_user:
                # 發送驗證郵件
                success, message = verification_service.create_verification(
                    email=new_email,
                    username=updated_user['username'],
                    password="",
                    user_role=updated_user['userRole']
                )
                
                return {
                    "message": message
                }, 200 if success else 400
                
            return {
                "message": "電子郵件更新失敗"
            }, 500
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_email) {str(e)}"
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
            
    @staticmethod
    def get_user_trash_stats(user_id):
        try:
            user = user_service.get_user_trash_stats(user_id)
            
            if user:
                return {
                    "message": "成功找到使用者",
                    "body": user
                }, 200
            
            return {
                "message": "無法找到使用者"
            }, 404
        
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_user_trash_stats): {str(e)}"
            }, 500
            
    @staticmethod
    def add_user_trash_stats(user_id: str):
        try:
            valid_trash_types = ['plastic', 'paper', 'cans', 'bottles', 'containers']
            
            data = request.get_json()
            
            required_fields = ['trash_type', 'count']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
                
            if data['trash_type'] not in valid_trash_types:
                return {
                    "message": "垃圾類型不正確"
                }, 400
            
            if not isinstance(data['count'], int) or data['count'] <= 0:
                return {
                    "message": "count 必須為正整數"
                }, 400
            
            trash_type = data['trash_type']
            count = data['count']
            
            result = user_service.add_user_trash_stats(user_id, trash_type, count)
            
            if result:
                daily_update_success = daily_trash_service._update_daily_trash(trash_type, count)
                
                if daily_update_success:
                    return {
                        "message": "成功增加垃圾數量並更新每日統計",
                        "body": result
                    }, 200
                else:
                    return {
                        "message": "成功增加垃圾數量，但每日統計更新失敗",
                        "body": result
                    }, 400
                    
            return {
                "message": "無法找到使用者"
            }, 404
        
        except Exception as e:
            return {
                "message": f"伺服器錯誤(add_user_trash_stats): {str(e)}"
            }, 500
            
    @staticmethod
    def delete_user():
        try:
            data = request.get_json()
            
            if 'user_id' not in data:
                return {
                    "message": "缺少 user_id"
                }, 400
            
            user_id = data['user_id']
            success, message = user_service.delete_user(user_id)
            
            if success:
                return {
                    "message": message
                }, 200
                
            return {
                "message": message
            }, 404
                
        except Exception as e:
            return {
                "message": f"伺服器錯誤(delete_user) {str(e)}"
            }, 500
            
    @staticmethod
    def update_profile(user_id):
        try:
            if 'image' not in request.files:
                return {
                    "message": "請選擇要上傳的圖片"
                }, 400

            file = request.files['image']
            
            if file.filename == '':
                return {
                    "message": "請選擇要上傳的圖片"
                }, 400

            if not ImageService._allowed_file(file.filename):
                return {
                    "message": f"只支持 {', '.join(ImageService.ALLOWED_EXTENSIONS)} 格式的圖片"
                }, 400

            if request.content_length and request.content_length > ImageService.MAX_FILE_SIZE:
                return {
                    "message": f"圖片大小不能超過 {ImageService.MAX_FILE_SIZE // (1024*1024)}MB"
                }, 400

            success = user_service.update_profile(user_id, file)
            
            if success:
                return {
                    "message": "頭像更新成功",
                }, 200
            
            return {
                "message": "頭像更新失敗"
            }, 500

        except Exception as e:
            return {
                "message": f"伺服器錯誤(upload_profile_image) {str(e)}"
            }, 500
from flask import jsonify, request
from services.user_service import UserService
from config import Config
from bson import ObjectId

user_service = UserService(Config.MONGO_URI)

class UserController:
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
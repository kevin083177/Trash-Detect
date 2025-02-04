from flask import request
from services import AdminService, ProductService
from config import Config

admin_service = AdminService(Config.MONGO_URI)
product_service = ProductService(Config.MONGO_URI)

class AdminController:
    @staticmethod
    def delete_user():
        try:
            data = request.get_json()
            
            if 'user_id' not in data:
                return {
                    "message": "缺少 user_id"
                }, 400
            
            user_id = data['user_id']
            success, message = admin_service.delete_user(user_id)
            
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
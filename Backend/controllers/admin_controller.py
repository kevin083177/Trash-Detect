from flask import request
from services import AdminService, ProductService
from config import Config

admin_service = AdminService(Config.MONGO_URI)
product_service = ProductService(Config.MONGO_URI)

class AdminController:
    @staticmethod
    def get_all_users_info():
        try:
            users_info = admin_service.get_all_users_info()
            
            return {
                "message": f"成功獲取所有使用者資料",
                "body": users_info
            }, 200
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_all_users_info) {str(e)}"
            }, 500
            
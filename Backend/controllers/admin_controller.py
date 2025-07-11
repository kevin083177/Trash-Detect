from flask import request
from services import AdminService, ProductService, SystemInfo
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
    
    @staticmethod
    def get_system_info():
        """獲取系統資訊"""
        try:
            system_info = SystemInfo.get_all_system_info()
            
            return {
                "message": "成功獲取系統資訊",
                "body": system_info
            }, 200
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_system_info) {str(e)}"
            }, 500
from flask import request
from services.admin_service import AdminService
from services.product_service import ProductService
from config import Config

admin_service = AdminService(Config.MONGO_URI)
product_service = ProductService(Config.MONGO_URI)

class AdminController:
    @staticmethod
    def _():
        pass
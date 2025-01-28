from services import DatabaseService
from .product_service import ProductService

class AdminService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.products = self.collections['products']
        self.product_service = ProductService(mongo_uri)
        
    def add_product(self, product_data):
        """新增商品"""
        try:
            result = self.product_service.add_product(product_data)
            
            return result
        
        except Exception as e:
            print(f"add product error: {str(e)}")
            raise # 重新拋出異常至 admin_controller
from services.product_service import ProductService
from config import Config

product_service = ProductService(Config.MONGO_URI)

class ProductController:
    @staticmethod
    def get_product_by_id(user, product_id):
        try:
            product = product_service.get_product(product_id)
            
            if product:
                return {
                    "message": "成功找到商品資訊",
                    "body": product
                }, 200
            
            return {
                "message": "無法找到商品資訊"
            }, 404
                
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_product_by_id) {str(e)}"
            }, 500
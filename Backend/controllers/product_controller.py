from services.product_service import ProductService
from config import Config
from flask import request

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
    
    @staticmethod
    def add_product():
        try:
            data = request.get_json()
            
            required_fields = ['name', 'description', 'price', 'recycle_requirement']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
            
            # 檢查商品是否存在
            if product_service.check_product_exists(data['name']):
                return {
                    "message": "商品已存在"
                }, 409
            
            result = product_service.add_product(data)
            return {
                "message": "新增商品成功",
                "body": result
            }, 200
            
        except (ValueError, TypeError) as e:
            return {
                "message": f"{str(e)}"
            }, 400
        
        except Exception as e:
            return {
                "message": f"伺服器錯誤(add_product) {str(e)}",
            }, 500
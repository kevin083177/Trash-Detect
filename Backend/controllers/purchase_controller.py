from flask import request
from services import PurchaseService, ProductService
from config import Config

purchase_service = PurchaseService(Config.MONGO_URI)
product_service = ProductService(Config.MONGO_URI)

class PurchaseController:
    @staticmethod
    def purchase_product(user):
        try:
            data = request.get_json()
            
            required_fields = ['product_id', 'payment_type']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
            
            product_id = data['product_id']
            payment_type = data['payment_type']
                                           
            if purchase_service.check_product_purchased(user['_id'], product_id):
                return {
                    "message": f"商品: {product_service.get_product_name(product_id)} 已購買"
                }, 409
            
            success, result = purchase_service.purchase_product(
                user['_id'],
                product_id,
                payment_type
            )
            
            if not success:
                return {"message": result}, 400
                
            return {
                "message": "購買成功",
                "body": result
            }, 200
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(purchase_product) {str(e)}",
            }, 500
            
    @staticmethod
    def get_purchase_by_user(user):
        try:
            purchase = purchase_service.get_purchase_by_user(user)
            
            if purchase:
                purchase.pop('user_id', None)
                purchase['_id'] = str(purchase['_id'])
                return {
                    "message": "成功找到使用者購買紀錄",
                    "body": purchase
                }, 200
                
            return {
                "message": "無法找到購買紀錄"
            }, 404

        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_purchase_by_user) {str(e)}"
            }, 500
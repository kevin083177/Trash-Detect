from flask import request
from services.purchase_service import PurchaseService
from services.product_service import ProductService
from config import Config

purchase_service = PurchaseService(Config.MONGO_URI)
product_service = ProductService(Config.MONGO_URI)

class PurchaseController:
    @staticmethod
    def purchase_product(user, product_id):
        try:
            if not product_service.check_product_exists(product_id):
                return {"message": "商品不存在"}, 404
                            
            if purchase_service.check_product_purchased(user['_id'], product_id):
                return {
                    "message": f"商品: {product_service.get_product_name(product_id)} 已購買"
                }, 409
            
            purchase = purchase_service.purchase_product(user['_id'], product_id)
            if not purchase:
                return { "message": "購買失敗" }, 400
                
            return {
                "message": "購買成功",
                "body": purchase
            }
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(purchase_product) {str(e)}",
            }, 500
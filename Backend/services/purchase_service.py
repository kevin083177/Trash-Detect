from bson import ObjectId
from typing import Optional
from services import DatabaseService
from models import Purchase

class PurchaseService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.purchase = self.collections['purchases']
        self.product = self.collections['products']
        
    def init_user_purchase(self, user_id: str | ObjectId) -> Optional[ObjectId]:
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            purchase = Purchase(
                user_id = user_id,
                product = [],
                voucher = []
            )
            result = self.purchase.insert_one(purchase.to_dict())
            return result.inserted_id
        
        except Exception as e:
            print(f"Error initializing user_purchases: {str(e)}")
            raise
    
    def _check_product_purchased(self, user_id, product_id):
        try:
            result = self.purchase.find_one({
                "user_id": ObjectId(user_id),
                "product": {"$in": [ObjectId(product_id)]}
            })
            return bool(result)
        except Exception as e:
            print(f"Check Product Purchased Error: {str(e)}")
            raise
    
    def purchase_product(self, user_id, product_id):
        try:
            # 取得商品資訊
            product = self.product.find_one({"_id": ObjectId(product_id)})
            if not product:
                return False, "商品不存在"
            
            # 檢查用戶購買記錄是否存在，不存在則初始化
            purchase_record = self.purchase.find_one({"user_id": ObjectId(user_id)})
            if not purchase_record:
                self.init_user_purchase(user_id)
            
            # 更新購買紀錄
            result = self.purchase.update_one(
                {"user_id": ObjectId(user_id)},
                {"$push": {"product": ObjectId(product_id)}}
            )
            
            if result.modified_count > 0:
                return True, {
                    "product": {
                        **product,
                        "_id": str(product['_id'])
                    }
                }
            return False, "購買紀錄更新失敗"
            
        except Exception as e:
            print(f"Purchase Product Error: {str(e)}")
            raise
        
    def get_purchase_by_user(self, user_id: str | ObjectId):
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            purchase = self.purchase.find_one({"user_id": user_id})
            
            if not purchase:
                return False
                
            # 獲取所有商品
            product_ids = purchase.get('product', [])
            products = []
            
            for product_id in product_ids:
                product = self.product.find_one({"_id": product_id})
                if product:
                    product['_id'] = str(product['_id'])
                    products.append(product)
            
            # 更新購買記錄中的商品信息
            purchase['product'] = products
            purchase['_id'] = str(purchase['_id'])
            purchase.pop('user_id', None)
            purchase.pop('voucher', None)
            
            return purchase
        
        except Exception as e:
            print(f"Error get user purchase: {str(e)}")
            raise
from bson import ObjectId

from services import DatabaseService
from models import Purchase

class PurchaseService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.purchase = self.collections['purchases']
        self.product = self.collections['products']
        
    def init_user_purchase(self, user_id):
        try:
            purchase = Purchase(
                user_id = user_id,
                product = None
            )
            result = self.purchase.insert_one(purchase.__dict__)
            return result.inserted_id
        except Exception as e:
            print(f"Error initializing user_purchases: {str(e)}")
            raise
    
    def check_product_purchased(self, user_id, product_id):
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
            result = self.purchase.update_one(
                {"user_id": ObjectId(user_id)},
                {"$push": {"product": ObjectId(product_id)}}
            )
            if result.modified_count > 0:
                product = self.product.find_one({"_id": ObjectId(product_id)})
                product['_id'] = str(product['_id'])
                return product
            return False
        except Exception as e:
            print(f"Purchase Product Error: {str(e)}")
            raise
from services.db_service import DatabaseService
from models.purchase_model import Purchase

class PurchaseService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.purchase = self.collections['purchases']
        
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
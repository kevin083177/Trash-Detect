from abc import ABC, abstractmethod
from bson import ObjectId
from services import DatabaseService

class PaymentStrategy(ABC):
    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service
    
    @abstractmethod
    def pay(self, user_id, amount):
        pass

class MoneyPayment(PaymentStrategy):
    def pay(self, user_id, amount):
        users = self.db_service.get_collection('users')
        
        user = users.find_one({"_id": ObjectId(user_id)})
        if not user or user.get('money', 0) < amount:
            return False, "餘額不足"
        
        result = users.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"money": -amount}}
        )
        
        return True, "付款成功" if result.modified_count > 0 else (False, "付款失敗")

class RecyclePayment(PaymentStrategy):
    def pay(self, user_id: str, product_id: str) -> tuple[bool, str]:
        """
        驗證用戶的回收記錄是否符合商品的回收需求
        
        Args:
            user_id: 用戶ID
            product_id: 商品ID
            
        Returns:
            Tuple[bool, str]: (是否驗證成功, 訊息)
        """
        try:
            records = self.db_service.get_collection('records')
            products = self.db_service.get_collection('products')
            
            # 獲取用戶的回收記錄
            record = records.find_one({"user_id": ObjectId(user_id)})
            if not record:
                return False, "找不到回收紀錄"
                
            # 獲取商品的回收需求
            product = products.find_one({"_id": ObjectId(product_id)})
            if not product or 'recycle_requirement' not in product:
                return False, "商品回收需求資訊不存在"
                
            requirements = product['recycle_requirement']
            
            # 檢查每個回收類別是否達標
            for category, required_amount in requirements.items():
                user_amount = record.get(category, 0)
                if user_amount < required_amount:
                    return False, f"{category} 回收數量不足 (需要: {required_amount}, 現有: {user_amount})"
                    
            return True, "驗證成功"
            
        except Exception as e:
            print(f"Recycle Payment Error: {str(e)}")
            return False, f"回收驗證發生錯誤: {str(e)}"
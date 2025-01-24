from models.product_model import Product
from services.db_service import DatabaseService

class ProductService(DatabaseService):
    VALID_CATEGORIES = {'paper', 'plastic', 'cans', 'containers', 'bottles'}
    
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.products = self.collections['products'] # 查詢users資訊
        
    def add_product(self, product_data):
        """新增商品"""
        try:
            self._validate_recycle_requirement(product_data['recycle_requirement'])
            product = Product(**product_data)
            
            if not isinstance(product.price, int):
                raise ValueError("price 必須為整數")
            
            result = self.products.insert_one(product.to_dict())
            return self.get_product(result.inserted_id)
        except Exception as e:
            raise e
    
    def get_product(self, _id):
        """取得商品訊息"""
        result = self.products.find_one({"_id": _id})
        result['_id'] = str(result['_id'])
        return result
    
    def _validate_recycle_requirement(self, requirement):
        """檢查recycle_requirment是否符合要求

        Example:
            requirement: {
                "Valid_Category": amount,
                ...
            }
        """
        if not requirement:  # 允許空的回收需求
           return
           
       # 檢查是否只包含有效類別
        invalid_categories = set(requirement.keys()) - self.VALID_CATEGORIES
        if invalid_categories:
            raise TypeError(f"不存在的分類: { invalid_categories }")
            
        # 檢查數量是否為正整數
        for amount in requirement.values():
            if not isinstance(amount, int) or amount <= 0:
                raise ValueError(f"分類所需該數量必須為整數")
           
    def check_product_exists(self, name):
        """檢查商品是否存在"""
        result = self.products.find_one({"name": name})
        return bool(result)
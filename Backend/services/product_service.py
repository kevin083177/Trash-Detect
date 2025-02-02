from models import Product
from services import DatabaseService
from bson import ObjectId

class ProductService(DatabaseService):
    VALID_CATEGORIES = {'paper', 'plastic', 'cans', 'containers', 'bottles'}
    
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.products = self.collections['products']
        self.purchase = self.collections['purchases']
        
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
    
    def delete_product_by_id(self, product_id):
        """刪除商品"""
        try:
            # 先檢查商品是否存在
            product = self.get_product(product_id)
            
            if not product:
                return False
            
            # 從所有用戶的購買紀錄中移除此商品
            updated_user = self.purchase.update_many(
                {"product": ObjectId(product_id)},
                {"$pull": {"product": ObjectId(product_id)}}
            )
            
            # 刪除商品
            result = self.products.delete_one({"_id": ObjectId(product_id)})
            return result.deleted_count, updated_user.modified_count

        except Exception as e:
            print(f"Delete Product Error: {str(e)}")
            raise
    
    def get_product(self, product_id):
        """取得商品訊息"""
        try:
            result = self.products.find_one({"_id": ObjectId(product_id)})
            if not result:
                return None
                
            result['_id'] = str(result['_id'])
            return result
            
        except Exception as e:
            print(f"Get Product Error: {str(e)}")
            return None
    
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
        """檢查商品名稱是否已存在"""
        try:
            result = self.products.find_one({"name": name})
            return bool(result)
        except Exception as e:
            print(f"Check Product Exists Error: {str(e)}")
            return False
    
    def get_product_name(self, product_id):
        """使用product_id尋找商品名稱"""
        try:
            result = self.products.find_one({"_id": ObjectId(product_id)})
            return result["name"]
        except Exception as e:
            print(f"Get Product Name Error: {str(e)}")
            raise
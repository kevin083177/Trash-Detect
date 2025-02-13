from models import Product
from services import DatabaseService
from .image_service import ImageService
from bson import ObjectId
from typing import Optional

class ProductService(DatabaseService):
    VALID_CATEGORIES = {'paper', 'plastic', 'cans', 'containers', 'bottles'}
    
    def __init__(self, mongo_uri: str, image_service = None):
        """初始化 ProductService
        
        Args:
            mongo_uri: MongoDB 連接字串
            image_service: 用於處理圖片上傳的 ImageService 實例，預設為 None
        """
        super().__init__(mongo_uri)
        self.products = self.collections['products']
        self.purchase = self.collections['purchases']
        
        if image_service is not None and not isinstance(image_service, ImageService):
            raise TypeError("image_service 必須是 ImageService")
        self.image_service = image_service
        
    def add_product(self, product_data: dict, image_file = None) -> dict:
        """新增商品"""
        try:
            # 先檢查是否有 image_service
            if not self.image_service:
                raise ValueError("Image service not initialized")
                
            self._validate_recycle_requirement(product_data['recycle_requirement'])
            product = Product(**product_data)
            
            if not isinstance(product.price, int):
                raise ValueError("price 必須為整數")
            
            if not image_file:
                raise ValueError("必須上傳商品圖片")
            
            # public_id 暫時用 product name 代替 Todo: 改自動生成
            public_id = product_data['name']
            folder = product_data.get('category', 'others')
            
            image_result = self.image_service.upload_image(
                image_file=image_file, 
                public_id=public_id,
                folder=folder
            )
            
            product_data['image'] = {
                'public_id': image_result['public_id'],
                'url': image_result['url'],
                'thumbnail_url': image_result['thumbnail_url'],
                'folder': folder
            }
            
            product = Product(**product_data)
            result = self.products.insert_one(product.to_dict())
            
            return self.get_product(result.inserted_id)
            
        except Exception as e:
            # 如果在新增商品過程中發生錯誤，且圖片已上傳，則刪除已上傳的圖片
            if hasattr(self, 'image_service') and self.image_service and 'image_result' in locals():
                try:
                    self.image_service.delete_image(image_result['public_id'])
                except:
                    pass
            raise e
    
    def delete_product_by_id(self, product_id):
        """刪除商品"""
        try:
            # 先檢查商品是否存在
            product = self.get_product(product_id)
            
            if not product:
                return False, 0
            
            # 刪除 Cloudinary 的圖片
            if 'image' in product and 'public_id' in product['image']:
                try:
                    self.image_service.delete_image(product['image']['public_id'])
                except Exception as e:
                    print(f"Delete image failed: {str(e)}")
            
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
    
    def get_products_by_folder(self, folder):
        """取得特定資料夾(分類)的所有商品"""
        try:
            results = list(self.products.find({"image.folder": folder}))
            
            # 轉換 ObjectId 為字串 (因為不是單個 在controller層轉換會較麻煩)
            for result in results:
                result['_id'] = str(result['_id'])
                
            return results
        except Exception as e:
            print(f"Get Products By Folder Error: {str(e)}")
            return None
from models import Product
from services import DatabaseService
from .image_service import ImageService
from bson import ObjectId
from typing import Optional

class ProductService(DatabaseService):
    VALID_CATEGORIES = {'paper', 'plastic', 'cans', 'containers', 'bottles'}
    VALID_PRODUCT_TYPE = {'wallpaper', 'box', 'table', 'carpet', 'bookshelf', 'lamp', 'pendant', 'calendar'}
    # 背景、訊息框、桌子、地毯、書櫃、檯燈、吊飾、日曆
    
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
            
            # 停用 recylce_requirement  
            # self._validate_recycle_requirement(product_data['recycle_requirement'])
            product = Product(**product_data)
            
            if not isinstance(product.price, int):
                raise ValueError("price 必須為整數")
            
            if not image_file:
                raise ValueError("必須上傳商品圖片")
            
            public_id = product_data['name']
            folder = product_data.get('theme', 'others')
            
            image_result = self.image_service.upload_image(
                image_file=image_file, 
                public_id=public_id,
                folder=folder
            )
            
            product_data['image'] = {
                'public_id': image_result['public_id'],
                'url': image_result['url'],
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
    # only for test
    def delete_all_products(self):
        """刪除所有商品"""
        try:
            all_products = list(self.products.find({}))
            deleted_count = 0
            updated_users_total = 0

            for product in all_products:
                product_id = str(product['_id'])
                count, updated_users = self.delete_product_by_id(product_id)
                deleted_count += count
                updated_users_total += updated_users

            return deleted_count, updated_users_total

        except Exception as e:
            print(f"Delete All Products Error: {str(e)}")
            raise
    
    def delete_product_by_id(self, product_id: str):
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
    
    def update_product(self, product_id, update_data, new_image_file=None):
        """更新商品資訊
        
        Args:
            product_id: 商品ID
            update_data: 要更新的商品資料
            new_image_file: 新的商品圖片，預設為None表示不更新圖片
            
        Returns:
            更新後的商品資料，如果更新失敗則返回None
        """
        try:
            # 檢查商品是否存在
            product = self.get_product(product_id)
            if not product:
                raise ValueError(f"找不到ID為 {product_id} 的商品")
            
            # 準備更新數據
            updates = {}
            
            # 處理名稱更新（確保名稱不重複）
            if 'name' in update_data and update_data['name'] != product['name']:
                # 檢查新名稱是否已被其他商品使用
                if self._check_product_exists(update_data['name']):
                    raise ValueError(f"商品名稱 '{update_data['name']}' 已存在")
                updates['name'] = update_data['name']
            
            # 處理描述更新
            if 'description' in update_data:
                updates['description'] = update_data['description']
            
            # 處理價格更新
            if 'price' in update_data:
                if not isinstance(update_data['price'], int):
                    raise ValueError("price 必須為整數")
                updates['price'] = update_data['price']
            
            # 處理主題更新
            old_theme = product.get('theme')
            new_theme = update_data.get('theme')
            
            if new_theme and new_theme != old_theme:
                updates['theme'] = new_theme
            
            # 處理圖片更新
            if new_image_file:
                # 確保已初始化圖片服務
                if not self.image_service:
                    raise ValueError("Image service not initialized")
                
                # 確定存儲圖片的文件夾 (使用新主題或保留原有主題)
                folder = new_theme if new_theme else old_theme
                # 使用商品的新名稱或原有名稱作為圖片的public_id
                public_id = updates.get('name', product['name'])
                
                # 上傳新圖片
                new_image_result = self.image_service.upload_image(
                    image_file=new_image_file, 
                    public_id=public_id,
                    folder=folder
                )
                
                # 更新圖片資訊
                updates['image'] = {
                    'public_id': new_image_result['public_id'],
                    'url': new_image_result['url'],
                }
                
                # 刪除舊圖片
                try:
                    if 'image' in product and 'public_id' in product['image']:
                        self.image_service.delete_image(product['image']['public_id'])
                except Exception as e:
                    print(f"刪除舊圖片時出錯: {str(e)}")
            
            # 如果沒有任何更新數據，直接返回原商品
            if not updates:
                return product
            
            # 進行更新
            result = self.products.update_one(
                {"_id": ObjectId(product_id)},
                {"$set": updates}
            )
            
            if result.modified_count > 0 or result.matched_count > 0:
                # 獲取更新後的商品
                updated_product = self.get_product(product_id)
                
                # 處理主題變更
                if new_theme and new_theme != old_theme:
                    # 從舊主題中移除商品
                    from_theme_result = self.collections['themes'].update_one(
                        {"name": old_theme},
                        {"$pull": {"products": ObjectId(product_id)}}
                    )
                    
                    # 添加到新主題
                    to_theme_result = self.collections['themes'].update_one(
                        {"name": new_theme},
                        {"$addToSet": {"products": ObjectId(product_id)}}
                    )
                    
                    # 檢查主題更新結果
                    if not from_theme_result.matched_count or not to_theme_result.matched_count:
                        print(f"警告: 商品主題更新可能不完整。舊主題: {old_theme}, 新主題: {new_theme}")
                
                return updated_product
            
            return None
            
        except Exception as e:
            # 如果在更新過程中上傳了新圖片但後續處理失敗，需要清理已上傳的圖片
            if 'new_image_result' in locals():
                try:
                    self.image_service.delete_image(new_image_result['public_id'])
                except:
                    pass
            raise e
          
    def _check_product_exists(self, name):
        """檢查商品名稱是否已存在"""
        try:
            result = self.products.find_one({"name": name})
            return bool(result)
        except Exception as e:
            print(f"Check Product Exists Error: {str(e)}")
            return False
    
    def _check_product_type_exists_in_theme(self, theme, product_type):
        """檢查在指定主題中是否已存在相同類型的商品"""
        try:
            result = self.products.find_one({
                "theme": theme,
                "type": product_type
            })
            return bool(result)
        except Exception as e:
            print(f"Check Product Type Exists In Theme Error: {str(e)}")
            return False
    
    def _get_product_price(self, product_id):
        """取得商品價格"""
        try:
            result = self.products.find_one({"_id": ObjectId(product_id)})
            if not result:
                raise ValueError(f"找不到 ID 為 {product_id} 的商品")
            return result["price"]
        except Exception as e:
            print(f"Get Product Price Error: {str(e)}")
            raise
    
    def get_product_name(self, product_id):
        """使用product_id尋找商品名稱"""
        try:
            result = self.products.find_one({"_id": ObjectId(product_id)})
            return result["name"]
        except Exception as e:
            print(f"Get Product Name Error: {str(e)}")
            raise
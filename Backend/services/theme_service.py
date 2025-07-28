from services import DatabaseService
from models import Theme
from datetime import datetime
from .image_service import ImageService
from .product_service import ProductService
from bson import ObjectId

class ThemeService(DatabaseService):
    def __init__(self, mongo_uri, image_service = None):
        super().__init__(mongo_uri)
        self.themes = self.collections['themes']
        
        if image_service is not None and not isinstance(image_service, ImageService):
            raise TypeError("image_service 必須是 ImageService")
        self.image_service = image_service
        
    def add_theme(self, name, description, image_file=None):
        """
        添加新的主題到資料庫
        
        Args:
            name (str): 主題名稱
            description (str): 主題描述
            image_file (file): 主題預覽圖
                
        Returns:
            dict: 新建的主題資料，如果主題已存在則返回 None
        """
        try:
            # 檢查是否有 image_service
            if not self.image_service:
                raise ValueError("ImageService 沒有初始化")
                
            # 檢查主題是否已存在
            existing_theme = self.themes.find_one({"name": name})
            if existing_theme:
                raise ValueError("主題已存在")
            
            # 檢查是否有上傳圖片
            if not image_file:
                raise ValueError("必須上傳主題圖片")
            
            # 上傳圖片到 Cloudinary
            folder = name  # 存放在 主題名稱 的資料夾內
            
            image_result = self.image_service.upload_image(
                image_file=image_file,
                public_id='preview',
                folder=folder
            )
            
            # 創建主題圖片對象
            theme_image = {
                'public_id': image_result['public_id'],
                'url': image_result['url'],
            }
            
            # 創建主題對象
            theme = Theme(
                name=name,
                description=description,
                products=[],  # 初始化空的商品陣列
                created_at=datetime.now(),
                image=theme_image  # 添加主題圖片
            )
            
            # 寫入資料庫
            result = self.themes.insert_one(theme.to_dict())
            
            # 返回新建的主題資料
            if result.inserted_id:
                created_theme = self.themes.find_one({"_id": result.inserted_id})
                if created_theme:
                    created_theme['_id'] = str(created_theme['_id'])  # 將ObjectId轉為字串
                return created_theme
            
            return None
            
        except Exception as e:
            # 如果在新增主題過程中發生錯誤，且圖片已上傳，則刪除已上傳的圖片
            if 'image_result' in locals() and self.image_service:
                try:
                    self.image_service.delete_image(image_result['public_id'])
                except:
                    pass
            print(f"Error adding theme: {str(e)}")
            raise
    
    def add_product_to_theme(self, theme: str, product_id: ObjectId):
        """
        將產品添加到指定主題中
        
        Args:
            theme_name (str): 主題名稱
            product_id (str): 商品ID
            
        Returns:
            bool: 是否成功添加
        """
        try:
            result = self.themes.update_one(
                {"name": theme},
                {"$addToSet": {"products": product_id}}  # 使用 $addToSet 避免重複
            )
            
            return result.modified_count > 0
        
        except Exception as e:
            print(f"Error adding product to theme: {str(e)}")
            raise
        
    def get_theme(self, theme_name):
        try:
            if theme_name in self.get_all_themes():            
                theme = self.themes.find_one({"name": theme_name})
                if theme:
                    theme.pop("_id", None)
                    theme.pop("products", None)
                    return theme
                return None
            else:
                return None
        except Exception as e:
            print(f"Error getting {theme_name} theme: {str(e)}")
            raise
        
    def get_all_themes_with_products(self):
        try:
            themes = list(self.themes.find())
            
            result = []
            for theme in themes:
                theme['_id'] = str(theme['_id'])
                
                product_ids = theme.get("products", [])
                
                products = []
                for product_id in product_ids:
                    product = self.collections["products"].find_one({"_id": product_id})
                    if product:
                        product["_id"] = str(product["_id"])
                        products.append(product)
                
                theme["products"] = products
                result.append(theme)
                
            return result
            
        except Exception as e:
            print(f"Error getting all themes with products: {str(e)}")
            raise
    
    def _delete_theme_preview_image(self, theme):
        try:
            return self.image_service.delete_image(theme['image']['public_id'])
        except Exception as e:
            print(f"Error delete theme {theme['name']} preview image: {str(e)}")
            raise
        
    def delete_theme(self, theme_name, product_service=None):
        """
        刪除指定主題及其所有相關商品
        
        Args:
            theme_name (str): 要刪除的主題名稱
            product_service (ProductService, optional): 用於刪除商品的服務實例
        
        Returns:
            dict: 包含刪除結果的字典，如：
                {
                    'success': True/False,
                    'deleted_theme': 主題名稱,
                    'deleted_products_count': 刪除的商品數量,
                    'error': 錯誤信息（如果有）
                }
        """
        try:
            # 檢查參數
            if not theme_name:
                return {'success': False, 'error': '主題名稱不能為空'}
                
            if product_service is None:
                raise ValueError("必須提供 ProductService 實例以刪除商品")
                
            if not isinstance(product_service, ProductService):
                raise TypeError("product_service 必須是 ProductService")
            
            # 檢查主題是否存在
            theme = self.themes.find_one({"name": theme_name})
            if not theme:
                return {'success': False, 'error': f'主題 {theme_name} 不存在'}
            
            # 獲取主題中的所有商品
            products = theme.get('products', [])
            deleted_products_count = 0
            
            # 刪除每個商品
            for product_id in products:
                try:
                    deleted_count, _ = product_service.delete_product_by_id(str(product_id))
                    if deleted_count > 0:
                        deleted_products_count += 1
                except Exception as e:
                    print(f"刪除商品 {product_id} 時出錯: {str(e)}")
                    # 繼續處理其他商品
            
            # 刪除主題預覽圖片
            if 'image' in theme and 'public_id' in theme['image']:
                try:
                    self.image_service.delete_image(theme['image']['public_id'])
                except Exception as e:
                    print(f"刪除主題 {theme_name} 預覽圖片時出錯: {str(e)}")
            
            # 從數據庫中刪除主題
            result = self.themes.delete_one({"name": theme_name})
            
            return {
                'success': result.deleted_count > 0,
                'deleted_theme': theme_name,
                'deleted_products_count': deleted_products_count
            }
            
        except Exception as e:
            error_msg = f"刪除主題 {theme_name} 時出錯: {str(e)}"
            print(error_msg)
            return {'success': False, 'error': error_msg}
        
    def _delete_theme_product(self, product_id):
        """
        從主題中移除指定的商品ID
        
        Args:
            product_id (str or ObjectId): 要移除的商品ID
                
        Returns:
            bool: 是否成功從任何主題中移除
        """
        try:
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)
                
            result = self.themes.update_one(
                {"products": product_id},
                {"$pull": {"products": product_id}}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error removing product {product_id} from themes: {str(e)}")
            raise
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
        self.purchase = self.collections['purchases']
        
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
            if not self.image_service:
                raise ValueError("ImageService 沒有初始化")
                
            existing_theme = self.themes.find_one({"name": name})
            if existing_theme:
                raise ValueError("主題已存在")
            
            if not image_file:
                raise ValueError("必須上傳主題圖片")
            
            folder = name 
            
            image_result = self.image_service.upload_image(
                image_file=image_file,
                public_id='preview',
                folder=folder
            )
            
            theme_image = {
                'public_id': image_result['public_id'],
                'url': image_result['url'],
            }
            
            theme = Theme(
                name=name,
                description=description,
                products=[],
                created_at=datetime.now(),
                image=theme_image
            )
            
            result = self.themes.insert_one(theme.to_dict())
            
            if result.inserted_id:
                created_theme = self.themes.find_one({"_id": result.inserted_id})
                if created_theme:
                    created_theme['_id'] = str(created_theme['_id'])
                return created_theme
            
            return None
            
        except Exception as e:
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
                {"$addToSet": {"products": product_id}}
            )
            
            return result.modified_count > 0
        
        except Exception as e:
            print(f"Error adding product to theme: {str(e)}")
            raise
        
    def get_theme(self, theme_name):
        try:
            theme = self.themes.find_one({"name": theme_name})
            if theme:
                theme['_id'] = str(theme['_id'])
                theme['products'] = [str(product_id) for product_id in theme['products']]
                
                return theme
            return None
        except Exception as e:
            print(f"Error getting {theme_name} theme: {str(e)}")
            raise
    
    def _get_theme_by_id(self, theme_id):
        try:
            result = self.themes.find_one({"_id": ObjectId(theme_id)})
            if not result:
                return None
                
            result['_id'] = str(result['_id'])
            result['products'] = [str(pid) for pid in result.get('products', [])]
            return result
            
        except Exception as e:
            print(f"Get Product Error: {str(e)}")
            return None
    
    def _get_all_themes(self):
        try:
            themes = self.themes.find({}, {"name": 1, "_id": 0})
            theme_names = [theme['name'] for theme in themes]
            
            return theme_names
        except Exception as e:
            print(f"Error getting all themes: {str(e)}")
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
            if not theme_name:
                return {'success': False, 'error': '主題名稱不能為空'}
                
            if product_service is None:
                raise ValueError("必須提供 ProductService 實例以刪除商品")
                
            if not isinstance(product_service, ProductService):
                raise TypeError("product_service 必須是 ProductService")
            
            theme = self.get_theme(theme_name)
            if not theme:
                return {'success': False, 'error': f'主題不存在'}
            
            products = theme.get('products', [])
            deleted_products_count = 0
            
            for product_id in products:
                try:
                    deleted_count, _ = product_service.delete_product_by_id(str(product_id))
                    if deleted_count > 0:
                        deleted_products_count += 1
                except Exception as e:
                    print(f"刪除商品 {product_id} 時出錯: {str(e)}")
            
            if 'image' in theme and 'public_id' in theme['image']:
                try:
                    self.image_service.delete_image(theme['image']['public_id'])
                except Exception as e:
                    print(f"刪除主題 {theme_name} 預覽圖片時出錯: {str(e)}")
            
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
    
    def update_theme(self, theme_id: str, update_data: dict, new_image_file=None):
        try:
            existing_theme = self.themes.find_one({"_id": ObjectId(theme_id)})
            if not existing_theme:
                raise ValueError(f"主題不存在")

            updates = {}
            
            old_theme_name = existing_theme.get('name')
            new_theme_name = None
            
            if 'name' in update_data and update_data['name'] != old_theme_name:
                new_theme_name = update_data['name']
                existing_name_check = self.themes.find_one({
                    "name": new_theme_name,
                    "_id": {"$ne": ObjectId(theme_id)}
                })
                if existing_name_check:
                    raise ValueError(f"主題名稱 '{new_theme_name}' 已存在")
                updates['name'] = new_theme_name

            if 'description' in update_data:
                updates['description'] = update_data['description']

            new_image_result = None
            if new_image_file:
                if not self.image_service:
                    raise ValueError("ImageService 沒有初始化")

                folder = new_theme_name if new_theme_name else old_theme_name

                old_image = existing_theme.get('image')
                if old_image and 'public_id' in old_image:
                    try:
                        self.image_service.delete_image(old_image['public_id'])
                    except Exception as e:
                        raise RuntimeError(f"刪除舊圖片失敗: {e}")

                new_image_result = self.image_service.upload_image(
                    image_file=new_image_file,
                    public_id='preview',
                    folder=folder
                )

                updates['image'] = {
                    'public_id': new_image_result['public_id'],
                    'url': new_image_result['url'],
                }

            if not updates:
                existing_theme['_id'] = str(existing_theme['_id'])
                existing_theme['products'] = [str(pid) for pid in existing_theme.get('products', [])]
                return {
                    "theme": existing_theme,
                    "products_updated": 0
                }

            result = self.themes.update_one(
                {"_id": ObjectId(theme_id)},
                {"$set": updates}
            )

            if result.modified_count > 0 or result.matched_count > 0:
                products_updated_count = 0
                
                if new_theme_name and new_theme_name != old_theme_name:
                    update_result = self._update_products_theme_name(old_theme_name, new_theme_name)
                    
                    if update_result["success"]:
                        products_updated_count = update_result["updated_products_count"]
                
                updated_theme = self._get_theme_by_id(theme_id)
                if updated_theme:
                    return {
                        "theme": updated_theme,
                        "products_updated": products_updated_count
                    }

            if new_image_result:
                try:
                    self.image_service.delete_image(new_image_result['public_id'])
                except Exception:
                    pass

            return None

        except Exception as e:
            if 'new_image_result' in locals() and new_image_result:
                try:
                    self.image_service.delete_image(new_image_result['public_id'])
                except Exception:
                    pass
            raise e
            
      
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
        
    def _add_default_theme_products(self, user_id: str, theme_name = "預設"):
        try:
            theme = self.get_theme(theme_name)
            product_ids = theme['products']
            product_ids = [ObjectId(pid) for pid in product_ids]
            
            if not product_ids:
                print(f"No products found in theme '{theme_name}'")
            
            
            user_purchase = self.purchase.find_one({"user_id": ObjectId(user_id)})
            
            if not user_purchase:
                return False
            
            result = self.purchase.update_one(
                {"user_id": ObjectId(user_id)},
                {"$addToSet": {"product": {"$each": product_ids}}}
            )

            return result.modified_count > 0
        
        except Exception as e:
            print(f"Error add default theme products: {str(e)}")
            raise
        
    def _update_products_theme_name(self, old_theme_name: str, new_theme_name: str):
        """
        更新所有相關商品的主題名稱
        
        Args:
            old_theme_name (str): 舊的主題名稱
            new_theme_name (str): 新的主題名稱
            
        Returns:
            dict: 包含更新結果的字典
        """
        try:
            products_update_result = self.collections['products'].update_many(
                {"theme": old_theme_name},
                {"$set": {"theme": new_theme_name}}
            )
            
            return {
                "success": True,
                "updated_products_count": products_update_result.modified_count,
            }
            
        except Exception as e:
            return {
                "success": False,
                "updated_products_count": 0,
            }

    def get_theme_products_count(self, theme_name: str):
        try:
            count = self.collections['products'].count_documents({"theme": theme_name})
            return count
        except Exception as e:
            print(f"Error counting theme products: {str(e)}")
            return 0
from flask import request

from services import ThemeService, ImageService, ProductService
from config import Config

image_service = ImageService(Config.get_cloudinary_config())
theme_service = ThemeService(Config.MONGO_URI, image_service)
product_service = ProductService(Config.MONGO_URI, image_service)

class ThemeController:
    @staticmethod
    def add_theme():
        try:
            if 'image' not in request.files:
                return {
                    "message": "缺少主題預覽圖片"
                }, 400
                
            image_file = request.files['image']
            
            if image_file.filename == '':
                return {
                    "message": "未選擇圖片"
                }, 400
            
            if not ImageService._allowed_file(image_file.filename):
                return {
                    "message": f"不支援的圖片格式，允許的格式：{', '.join(ImageService.ALLOWED_EXTENSIONS)}"
                }, 400
                
            if request.content_length > ImageService.MAX_FILE_SIZE:
                return {
                    "message": f"圖片大小超過限制（最大 {ImageService.MAX_FILE_SIZE // 1024 // 1024}MB）"
                }, 400
            
            name = request.form.get('name')
            description = request.form.get('description')
            
            if not name or not description:
                return {
                    "message": f"缺少: {'name' if not name else 'description'}",
                }, 400
            
            result = theme_service.add_theme(name, description, image_file)
            
            if result:
                return {
                    "message": "新增主題成功",
                    "body": result
                }, 200
            else:
                return {
                    "message": "主題已存在"
                }, 409
                
        except ValueError as e:
            return {
                "message": str(e)
            }, 400
        except Exception as e:
            return {
                "message": f"伺服器錯誤(add_theme) {str(e)}"
            }, 500
            
    def get_theme(user, theme_name):
        try:
            theme = theme_service.get_theme(theme_name)
            if theme:
                products_detail = []
                for product_id in theme['products']:
                    product = product_service.get_product(product_id)
                    products_detail.append(product)
                
                theme['products'] = products_detail
                
                return {
                    "message": "成功取得主題資訊",
                    "body": theme
                }, 200
            else:
                return {
                    "message": "該主題不存在"
                }, 404
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_theme) {str(e)}"
            }, 500
            
    def get_all_themes_with_products(user):
        try:
            themes_with_products = theme_service.get_all_themes_with_products()
            
            if themes_with_products is not None:
                return {
                    "message": "成功獲取所有主題和商品",
                    "body": themes_with_products
                }, 200
            else:
                return {
                    "message": "無法找到任何主題",
                    "body": []
                }, 200
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_all_themes) {str(e)}"
            }, 500
        
    def delete_theme():
        try:
            data = request.get_json()
            theme_name = data['theme_name']
            
            if not theme_name:
                return {
                    "message": "缺少 theme_name"
                }, 400
            
            result = theme_service.delete_theme(theme_name, product_service)
            
            if not result['success']:
                if 'error' in result and '不存在' in result['error']:
                    return {
                        "message": result['error']
                    }, 404
                else:
                    return {
                        "message": result['error'] if 'error' in result else "刪除主題失敗"
                    }, 500
            
            return {
                "message": f"成功刪除主題「{theme_name}」及其相關商品",
                "body": {
                    "deleted_theme": theme_name,
                    "deleted_products_count": result['deleted_products_count']
                }
            }, 200
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(delete_theme) {str(e)}"
            }, 500
            
    @staticmethod
    def update_theme():
        """更新主題"""
        try:
            theme_id = request.form.get('theme_id')
            if not theme_id:
                return {
                    "message": "缺少 theme_id"
                }, 400

            update_data = {}
            
            if 'name' in request.form:
                name = request.form.get('name')
                if name and name.strip():
                    update_data['name'] = name.strip()

            if 'description' in request.form:
                description = request.form.get('description')
                if description and description.strip():
                    update_data['description'] = description.strip()

            new_image_file = None
            if 'image' in request.files and request.files['image'].filename != '':
                image = request.files['image']
                
                if not ImageService._allowed_file(image.filename):
                    return {
                        "message": "不支援的圖片格式"
                    }, 400
                    
                if request.content_length > ImageService.MAX_FILE_SIZE:
                    return {
                        "message": "圖片大小超過限制"
                    }, 400
                    
                new_image_file = image

            if not update_data and not new_image_file:
                try:
                    current_theme = theme_service._get_theme_by_id(theme_id)
                    if not current_theme:
                        return {
                            "message": "主題不存在"
                        }, 404
                        
                except Exception as e:
                    return {
                        "message": f"查詢主題失敗: {str(e)}"
                    }, 500
                
                return {
                    "message": "未提供任何更新數據",
                    "body": current_theme
                }, 200

            try:
                result = theme_service.update_theme(theme_id, update_data, new_image_file)
                
                if result and result.get("theme"):
                    updated_theme = result["theme"]
                    products_updated = result.get("products_updated", 0)
                    
                    message = "主題更新成功"
                    return {
                        "message": message,
                        "body": updated_theme,
                        "products_updated": products_updated
                    }, 200
                else:
                    return {
                        "message": "主題更新失敗"
                    }, 500
                    
            except ValueError as e:
                return {
                    "message": str(e)
                }, 404
            except RuntimeError as e:
                return {
                    "message": str(e)
                }, 500
                    
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_theme): {str(e)}"
            }, 500
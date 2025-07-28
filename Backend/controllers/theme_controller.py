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
            # 檢查是否有文件上傳
            if 'image' not in request.files:
                return {
                    "message": "缺少主題預覽圖片"
                }, 400
                
            image_file = request.files['image']
            
            # 檢查文件名是否為空
            if image_file.filename == '':
                return {
                    "message": "未選擇圖片"
                }, 400
            
            # 檢查文件類型
            if not ImageService._allowed_file(image_file.filename):
                return {
                    "message": f"不支援的圖片格式，允許的格式：{', '.join(ImageService.ALLOWED_EXTENSIONS)}"
                }, 400
                
            # 檢查文件大小
            if request.content_length > ImageService.MAX_FILE_SIZE:
                return {
                    "message": f"圖片大小超過限制（最大 {ImageService.MAX_FILE_SIZE // 1024 // 1024}MB）"
                }, 400
            
            # 從表單獲取主題數據
            name = request.form.get('name')
            description = request.form.get('description')
            
            # 檢查必填欄位
            if not name or not description:
                return {
                    "message": f"缺少: {'name' if not name else 'description'}",
                }, 400
            
            # 新增主題（包含圖片上傳）
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
        
    def delete_theme(theme_name):
        try:
            # 檢查主題名稱是否為空
            if not theme_name:
                return {
                    "message": "請提供主題名稱"
                }, 400
            
            result = theme_service.delete_theme(theme_name, product_service)
            
            # 處理刪除結果
            if not result['success']:
                # 檢查是否因為主題不存在而失敗
                if 'error' in result and '不存在' in result['error']:
                    return {
                        "message": result['error']
                    }, 404
                else:
                    return {
                        "message": result['error'] if 'error' in result else "刪除主題失敗"
                    }, 500
            
            # 刪除成功
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
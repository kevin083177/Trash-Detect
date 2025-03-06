from services import ProductService, ImageService
from config import Config
from flask import request
import json

image_service = ImageService(Config.get_cloudinary_config())
product_service = ProductService(Config.MONGO_URI, image_service)

class ProductController:
    # 圖片設定
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    MAX_FILE_SIZE = 5 * 1024 * 1024 # 5 MB
    @staticmethod
    def get_product_by_id(user, product_id):
        try:
            product = product_service.get_product(product_id)
            
            if product:
                return {
                    "message": "成功找到商品資訊",
                    "body": product
                }, 200
            
            return {
                "message": "無法找到商品資訊"
            }, 404
                
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_product_by_id) {str(e)}"
            }, 500
    
    @staticmethod
    def add_product():
        try:
            # 檢查是否有文件上傳
            if 'image' not in request.files:
                return {
                    "message": "缺少商品圖片"
                }, 400
                
            image = request.files['image']
            
            # 檢查文件名是否為空
            if image.filename == '':
                return {
                    "message": "未選擇圖片"
                }, 400
                
            # 檢查文件類型
            if not ProductController._allowed_file(image.filename):
                return {
                    "message": f"不支援的圖片格式，允許的格式：{', '.join(ProductController.ALLOWED_EXTENSIONS)}"
                }, 400
                
            # 檢查文件大小
            if request.content_length > ProductController.MAX_FILE_SIZE:
                return {
                    "message": f"圖片大小超過限制（最大 {ProductController.MAX_FILE_SIZE // 1024 // 1024}MB）"
                }, 400

            # 從表單獲取商品數據
            try:
                data = {
                    'name': request.form.get('name'),
                    'description': request.form.get('description'),
                    'price': int(request.form.get('price', 0)),
                    'category': request.form.get('category'),
                    'recycle_requirement': json.loads(request.form.get('recycle_requirement', '{}'))
                }
            except (ValueError, json.JSONDecodeError) as e:
                return {
                    "message": "表單數據格式錯誤"
                }, 400
            
            # 檢查必要欄位
            required_fields = ['name', 'description', 'category']
            missing_fields = [field for field in required_fields if not data.get(field)]
            if 'price' not in data:
                missing_fields.append('price')
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
            
            # 檢查商品是否存在
            if product_service.check_product_exists(data['name']):
                return {
                    "message": "商品已存在"
                }, 409
            
            # 新增商品（包含圖片上傳）
            result = product_service.add_product(data, image)
            return {
                "message": "新增商品成功",
                "body": result
            }, 200
            
        except (ValueError, TypeError) as e:
            return {
                "message": f"{str(e)}"
            }, 400
        
        except Exception as e:
            return {
                "message": f"伺服器錯誤(add_product) {str(e)}",
            }, 500
    
    @staticmethod
    def delete_product_by_id():
        try:
            data = request.get_json()
            
            if "product_id" not in data:
                return {
                    "message": "缺少: product_id"
                }, 400
                
            product_id = data["product_id"]
            
            deleted_count, affected_users = product_service.delete_product_by_id(product_id)
            
            if deleted_count:
                return {
                    "message": f"刪除商品成功 已修改 {affected_users} 位用戶之購買紀錄",
                }, 200
            
            return {
                "message": "無法找到商品"
            }, 404
        
        except Exception as e:
            return {
                "message": f"伺服器錯誤(delete_product) {str(e)}",
            }, 500
            
    @staticmethod
    def _allowed_file(filename):
        """檢查文件副檔名是否允許"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in ProductController.ALLOWED_EXTENSIONS
               
    @staticmethod
    def get_all_theme_folders(user):
        try:
            folders = product_service.get_all_theme_folder()
            
            if folders:
                return {
                    "message": "成功找到所有商品的資料夾",
                    'body': folders
                }, 200

            return {
                "message": "無法找到任何資料夾"
            }, 404
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_all_theme_folders) {str(e)}"
            }, 500
            
    @staticmethod
    def get_products_by_folder(folder):
        try:
            valid_folders = product_service.get_all_theme_folder()
            
            if folder not in valid_folders:
                return {
                    "message": f"不存在的主題分類，有效的主題：{', '.join(valid_folders)}"
                }, 400
                
            products = product_service.get_products_by_folder(folder)
            
            if products:
                return {
                    "message": "成功找到商品列表",
                    "body": products
                }, 200
            
            return {
                "message": "此分類尚無商品"
            }, 404
                
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_products_by_folder) {str(e)}"
            }, 500
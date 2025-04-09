from services import ProductService, ImageService, ThemeService
from config import Config
from flask import request
import json
from bson import ObjectId

image_service = ImageService(Config.get_cloudinary_config())
product_service = ProductService(Config.MONGO_URI, image_service)
theme_service = ThemeService(Config.MONGO_URI, image_service)

class ProductController:
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
            if not ImageService._allowed_file(image.filename):
                return {
                    "message": f"不支援的圖片格式，允許的格式：{', '.join(ImageService.ALLOWED_EXTENSIONS)}"
                }, 400
                
            # 檢查文件大小
            if request.content_length > ImageService.MAX_FILE_SIZE:
                return {
                    "message": f"圖片大小超過限制（最大 {ImageService.MAX_FILE_SIZE // 1024 // 1024}MB）"
                }, 400

            # 從表單獲取商品數據
            try:
                data = {
                    'name': request.form.get('name'),
                    'description': request.form.get('description'),
                    'price': int(request.form.get('price', 0)),
                    'theme': request.form.get('theme'),
                }
            except (ValueError, json.JSONDecodeError) as e:
                return {
                    "message": "表單數據格式錯誤"
                }, 400
            
            # 檢查必要欄位
            required_fields = ['name', 'description', 'theme']
            missing_fields = [field for field in required_fields if not data.get(field)]
            if 'price' not in data:
                missing_fields.append('price')
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
            
            name = data['name']
            description = data['description']
            theme = data['theme']
            
            # 檢查商品是否存在
            if product_service._check_product_exists(name):
                return {
                    "message": "商品已存在"
                }, 409
            
            # 檢查欲加入商品之主題是否存在
            if not (theme in theme_service.get_all_themes()):
                return {
                    "message": f"主題 {theme} 不存在, 已存在主題:{theme_service.get_all_themes()}"
                }, 400
            
            # 新增商品（包含圖片上傳）
            result = product_service.add_product(data, image)
            
            if result:
                # 新增到 theme 資料庫
                isProductAddToTheme = theme_service.add_product_to_theme(theme, ObjectId(result['_id']))

                if isProductAddToTheme:
                    return {
                        "message": "新增商品成功",
                        "body": result
                    }, 200

                else:
                    return {
                        "message": "商品新增至主題時發生錯誤"
                    }, 404
            return {
                "message": "無法新增商品"
            }, 404
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
    def update_product(product_id):
        """
        更新商品資訊
        """
        try:
            # 檢查產品ID是否有效
            if not product_id:
                return {
                    "message": "缺少商品ID"
                }, 400
                
            # 檢查產品是否存在
            product = product_service.get_product(product_id)
            if not product:
                return {
                    "message": f"商品ID {product_id} 不存在"
                }, 404
            
            # 準備更新數據
            update_data = {}
            
            # 從表單獲取更新數據
            if 'name' in request.form:
                update_data['name'] = request.form.get('name')
                
            if 'description' in request.form:
                update_data['description'] = request.form.get('description')
                
            if 'price' in request.form:
                try:
                    update_data['price'] = int(request.form.get('price'))
                    if update_data['price'] < 0:
                        return {
                            "message": "商品價格不能為負數"
                        }, 400
                except ValueError:
                    return {
                        "message": "商品價格必須為整數"
                    }, 400
                    
            if 'theme' in request.form:
                theme = request.form.get('theme')
                # 檢查主題是否存在
                if not theme in theme_service.get_all_themes():
                    return {
                        "message": f"主題 {theme} 不存在, 已存在主題:{theme_service.get_all_themes()}"
                    }, 400
                update_data['theme'] = theme
            
            # 處理圖片更新
            new_image_file = None
            if 'image' in request.files and request.files['image'].filename != '':
                image = request.files['image']
                
                # 檢查文件類型
                if not ImageService._allowed_file(image.filename):
                    return {
                        "message": f"不支援的圖片格式，允許的格式：{', '.join(ImageService.ALLOWED_EXTENSIONS)}"
                    }, 400
                    
                # 檢查文件大小
                if request.content_length > ImageService.MAX_FILE_SIZE:
                    return {
                        "message": f"圖片大小超過限制（最大 {ImageService.MAX_FILE_SIZE // 1024 // 1024}MB）"
                    }, 400
                    
                new_image_file = image
            
            # 如果沒有更新數據
            if not update_data and not new_image_file:
                return {
                    "message": "未提供任何更新數據",
                    "body": product
                }, 200
            
            # 更新商品
            updated_product = product_service.update_product(product_id, update_data, new_image_file)
            
            if updated_product:
                return {
                    "message": "更新商品成功",
                    "body": updated_product
                }, 200
            else:
                return {
                    "message": "更新商品失敗"
                }, 500
                
        except ValueError as e:
            return {
                "message": str(e)
            }, 400
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_product) {str(e)}"
            }, 500

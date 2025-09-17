from flask import request
from services import VoucherService, ImageService
from config import Config
from models import Voucher
image_service = ImageService(Config.get_cloudinary_config())
voucher_service = VoucherService(Config.MONGO_URI, image_service)

class VoucherController:
    @staticmethod
    def create_voucher_type():
        try:
            image_file = None
            if 'image' in request.files and request.files['image'].filename != '':
                image_file = request.files['image']
                
                if not ImageService._allowed_file(image_file.filename):
                        return {
                            "message": f"不支援的圖片格式"
                        }, 400
                        
                if request.content_length > ImageService.MAX_FILE_SIZE:
                    return {
                        "message": f"圖片大小超過限制"
                    }, 400
                    
            data = request.form.to_dict()
            required_fields = ['name', 'description', 'quantity', 'price']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
                
            data['quantity'] = int(data['quantity'])
            data['price'] = int(data["price"])
            
            if data['quantity'] < 0:
                return {
                    "message": "票券數量必須大於 0"
                }, 400
                
            
            result = voucher_service.create_voucher_type(data, image_file)
            
            if result:
                return {
                    "message": "票券創建成功",
                    "body": result
                }, 200
            else:
                return {
                    "message": "票券創建失敗"
                }, 500
                
        except ValueError as e:
            return {
                "message": str(e)
            }, 400
        except Exception as e:
            return {
                "message": f"伺服器錯誤(create_voucher_type): {str(e)}"
            }, 500
    
    @staticmethod
    def delete_voucher_type():
        try:
            data = request.get_json()
            
            if 'voucher_type_id' not in data:
                return {
                    "message": "缺少: voucher_type_id"
                }, 400

            result = voucher_service.delete_voucher_type(data['voucher_type_id'])
            
            return {
                "message": f"成功刪除票券，共刪除 {result['deleted_vouchers_count']} 張票券，影響 {result['affected_users_count']} 位使用者",
            }, 200
            
        except ValueError as e:
            return {
                "message": str(e)
            }, 400
        except Exception as e:
            return {
                "message": f"伺服器錯誤(delete_voucher_type): {str(e)}"
            }, 500
    
    @staticmethod
    def update_voucher_type():
        try:
            new_image_file = None
            if 'image' in request.files and request.files['image'].filename != '':
                new_image_file = request.files['image']
                
                if not ImageService._allowed_file(new_image_file.filename):
                    return {
                        "message": f"不支援的圖片格式"
                    }, 400
                    
                if request.content_length > ImageService.MAX_FILE_SIZE:
                    return {
                        "message": f"圖片大小超過限制"
                    }, 400
                    
            update_data = {}
            
            if 'name' in request.form:
                update_data['name'] = request.form.get('name')
            if 'description' in request.form:
                update_data['description'] = request.form.get('description')
            if 'quantity' in request.form:
                try:
                    update_data['quantity'] = int(request.form.get('quantity'))
                    if update_data['quantity'] <= 0:
                        return {"message": "數量不能小於0"}, 400
                except ValueError:
                    return {"message": "數量必須為數字"}, 400
                
            if 'price' in request.form:
                try:
                    update_data['price'] = int(request.form.get('price'))
                    if update_data['price'] < 0:
                        return {"message": "價格不能小於0"}, 400
                except ValueError:
                    return {"message": "價格必須為數字"}, 400
                
            voucher_type_id = request.form.get('voucher_type_id')
            
            if not voucher_type_id:
                return {
                    "message": "缺少: voucher_type_id"
                }, 400
            
            if not update_data and not new_image_file:
                return {
                    "message": "未提供任何更新數據"
                }, 400
                
            result = voucher_service.update_voucher_type(
                voucher_type_id=voucher_type_id,
                update_data=update_data,
                new_image_file=new_image_file
            )
            
            return {
                "message": "票券更新成功",
                "body": result if result else None
            }, 200
        except ValueError as e:
            return {
                "message": str(e)
            }, 400
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_voucher_type): {str(e)}"
            }, 500
    
    @staticmethod
    def get_voucher_types(user):
        try:
            voucher_types = voucher_service.get_voucher_types()
            return {
                "message": "成功獲取所有票券",
                "body": voucher_types
            }, 200
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_voucher_types): {str(e)}"
            }, 500
    
    @staticmethod
    def get_user_vouchers(user):
        """獲取用戶的票券"""
        try:
            vouchers = voucher_service.get_user_vouchers(user['_id'])
            return {
                "message": "成功獲取使用者票券",
                "body": vouchers
            }, 200
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_user_vouchers): {str(e)}"
            }, 500
    
    @staticmethod
    def redeem_voucher(user):
        try:
            data = request.get_json()
            
            required_fields = ['voucher_type_id', 'count']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
            
            count = int(data["count"])
            
            if count > 20:
                return {
                    "message": "單次兌換數量不能超過 20"
                }, 400
            
            result = voucher_service.redeem_voucher(
                user_id=user['_id'],
                voucher_type_id=data['voucher_type_id'],
                count=count
            )
            
            return {
                "message": "票券兌換成功",
                "body": result
            }, 200
            
        except ValueError as e:
            return {
                "message": str(e)
            }, 400
        except Exception as e:
            return {
                "message": f"伺服器錯誤(redeem_voucher): {str(e)}"
            }, 500
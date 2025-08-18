import random
from datetime import datetime
from bson import ObjectId
from typing import Optional, List, Union
from services import DatabaseService
from models import VoucherType, Voucher, Purchase, Image
from .image_service import ImageService

class VoucherService(DatabaseService):
    def __init__(self, mongo_uri: str, image_service: ImageService = None):
        super().__init__(mongo_uri)
        self.voucher_types = self.collections['voucher_types']
        self.vouchers = self.collections['vouchers']
        self.purchases = self.collections['purchases']
        self.users = self.collections['users']
        
        if image_service is not None and not isinstance(image_service, ImageService):
            raise TypeError("image_service 必須是 ImageService")
        self.image_service = image_service
        
    def create_voucher_type(self, voucher_data: dict, image_file=None) -> dict:
        try:
            if self._check_voucher_type_exists(voucher_data['name']):
                raise ValueError("票券名稱已存在")

            if image_file and self.image_service:
                public_id = f"voucher_{voucher_data["name"]}"
                image_result = self.image_service.upload_image(
                    image_file,
                    public_id,
                    folder="vouchers"
                )
                
                voucher_data['image'] = Image(
                    public_id=image_result['public_id'],
                    url=image_result['url']
                )
                
            voucher_type = VoucherType(**voucher_data)
            result = self.voucher_types.insert_one(voucher_type.to_dict())
            
            if result.inserted_id:
                created_voucher_type = self.voucher_types.find_one({"_id": result.inserted_id})
                created_voucher_type["_id"] = str(created_voucher_type["_id"])
                return created_voucher_type
            
            return None
        
        except Exception as e:
            if 'image_result' in locals() and self.image_service:
                try:
                    self.image_service.delete_image(image_result['public_id'])
                except:
                    pass
            raise e

    def delete_voucher_type(self, voucher_type_id: str) -> dict:
        try:
            voucher_type_id = ObjectId(voucher_type_id) if not isinstance(voucher_type_id, ObjectId) else voucher_type_id
            
            voucher_type = self.voucher_types.find_one({"_id": voucher_type_id})
            if not voucher_type:
                raise ValueError("票券不存在")
            
            deleted_vouchers = self.vouchers.find({"voucher_type_id": voucher_type_id})
            redeem_vouchers_to_remove = [voucher["_id"] for voucher in deleted_vouchers]
            
            if redeem_vouchers_to_remove:
                affected_users = self.purchases.update_many(
                    {"voucher": {"$in": redeem_vouchers_to_remove}},
                    {"$pullAll": {"voucher": redeem_vouchers_to_remove}}
                )
            
            self.vouchers.delete_many({"voucher_type_id": voucher_type_id})
            
            if voucher_type.get('image') and self.image_service:
                try:
                    self.image_service.delete_image(voucher_type['image']['public_id'])
                except Exception as e:
                    print(f"刪除票券圖片失敗: {str(e)}")
            
            result = self.voucher_types.delete_one({"_id": voucher_type_id})
            
            return {
                "deleted": result.deleted_count > 0,
                "deleted_vouchers_count": len(redeem_vouchers_to_remove),
                "affected_users_count": affected_users.modified_count if redeem_vouchers_to_remove else 0
            }
            
        except Exception as e:
            print(f"Delete voucher type error: {str(e)}")
            raise
    
    def generate_voucher_code(self) -> str:
        while True:
            code = f"{random.randint(1000000000000000, 9999999999999999)}" # 16 位數
            if not self.vouchers.find_one({"voucher_code": code}):
                return code
    
    def redeem_voucher(self, user_id: str, voucher_type_id: str, count: int = 1) -> dict:
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            voucher_type_id = ObjectId(voucher_type_id) if not isinstance(voucher_type_id, ObjectId) else voucher_type_id
            
            if count <= 0:
                raise ValueError("兌換數量必須大於 0")
            
            voucher_type = self.voucher_types.find_one({"_id": voucher_type_id})
            if not voucher_type:
                raise ValueError("票券不存在")
            
            if voucher_type['quantity'] <= 0:
                raise ValueError("票券剩餘數量不足")
            
            user = self.users.find_one({"_id": user_id})
            if not user:
                raise ValueError("使用者不存在")
            
            user_money = user.get('money', 0)
            voucher_price = voucher_type['price']
            
            if user_money < voucher_price:
                raise ValueError(f"金額不足")
            
            self.users.update_one(
                {"_id": user_id},
                {"$inc": {"money": -voucher_price}}
            )
            
            created_vouchers = []
            voucher_ids_to_add = []

            for _ in range(count):
                voucher_code = self.generate_voucher_code()
                
                voucher = Voucher(
                    voucher_type_id=voucher_type_id,
                    voucher_code=voucher_code
                )
                
                voucher_result = self.vouchers.insert_one(voucher.to_dict())
                voucher_id = voucher_result.inserted_id
                voucher_ids_to_add.append(voucher_id)
                
                created_voucher = self.vouchers.find_one({"_id": voucher_id})
                created_voucher["_id"] = str(created_voucher["_id"])
                created_voucher["voucher_type_id"] = str(created_voucher["voucher_type_id"])
                created_vouchers.append(created_voucher)
            
            self.voucher_types.update_one(
                {"_id": voucher_type_id},
                {"$inc": {"quantity": -count}}
            )
            
            self._add_vouchers_to_user(user_id, voucher_ids_to_add)
            
            return created_vouchers
        
        except Exception as e:
            print(f"Redeem voucher error: {str(e)}")
            raise
    
    def get_user_vouchers(self, user_id: str) -> List[dict]:
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            user_purchase = self.purchases.find_one({"user_id": user_id})
            if not user_purchase:
                return []
            
            vouchers = []
            for voucher_id in user_purchase.get('voucher', []):
                voucher = self.vouchers.find_one({"_id": voucher_id})
                if voucher:
                    voucher_type = self.voucher_types.find_one({"_id": voucher['voucher_type_id']})
                    voucher["_id"] = str(voucher["_id"])
                    voucher["voucher_type_id"] = str(voucher["voucher_type_id"])
                    
                    if voucher_type:
                        voucher["voucher_type"] = {
                            "name": voucher_type["name"],
                            "description": voucher_type["description"],
                            "image": voucher_type.get("image")
                        }
                    
                    vouchers.append(voucher)
                    
            return vouchers
        
        except Exception as e:
            print(f"Get user vouchers error: {str(e)}")
            raise
    
    def get_voucher_types(self) -> List[dict]:
        try:
            voucher_types = list(self.voucher_types.find())
            for voucher_type in voucher_types:
                voucher_type["_id"] = str(voucher_type["_id"])
            return voucher_types
        except Exception as e:
            print(f"Get voucher types error: {str(e)}")
            raise
    
    def update_voucher_type(self, voucher_type_id: str, update_data: dict, new_image_file=None) -> dict:
        try:
            voucher_type_id = ObjectId(voucher_type_id) if not isinstance(voucher_type_id, ObjectId) else voucher_type_id
            
            existing_voucher_type = self.voucher_types.find_one({"_id": voucher_type_id})
            if not existing_voucher_type:
                raise ValueError("票券不存在")
            
            updates = {}
            
            allowed_fields = ['name', 'description', 'price', 'quantity']
            for field in allowed_fields:
                if field in update_data:
                    updates[field] = update_data[field]
            
            # 圖片更新
            if new_image_file and self.image_service:
                public_id = f"voucher_{existing_voucher_type['name']}"
                new_image_result = self.image_service.upload_image(
                    image_file=new_image_file,
                    public_id=public_id,
                    folder='vouchers'
                )
                
                # 刪除舊圖片
                if existing_voucher_type.get('image'):
                    try:
                        self.image_service.delete_image(existing_voucher_type['image']['public_id'])
                    except Exception as e:
                        print(f"刪除舊圖片失敗: {str(e)}")
                
                updates['image'] = {
                    'public_id': new_image_result['public_id'],
                    'url': new_image_result['url']
                }
            
            # 檢查新名稱重複
            if 'name' in updates and updates['name'] != existing_voucher_type['name']:
                if self._check_voucher_type_exists(updates['name']):
                    raise ValueError("票券已存在")
            
            # 沒有更新內容
            if not updates:
                existing_voucher_type["_id"] = str(existing_voucher_type["_id"])
                return existing_voucher_type
            
            result = self.voucher_types.update_one(
                {"_id": voucher_type_id},
                {"$set": updates}
            )
            
            if result.modified_count > 0:
                updated_voucher_type = self.voucher_types.find_one({"_id": voucher_type_id})
                updated_voucher_type["_id"] = str(updated_voucher_type["_id"])
                return updated_voucher_type
            else:
                return None
                
        except Exception as e:
            if 'new_image_result' in locals() and self.image_service:
                try:
                    self.image_service.delete_image(new_image_result['public_id'])
                except:
                    pass
            print(f"Update voucher type error: {str(e)}")
            raise
    
    def _add_vouchers_to_user(self, user_id: ObjectId, voucher_ids: Union[ObjectId, List[ObjectId]]):
        if not isinstance(voucher_ids, list):
            voucher_ids = [voucher_ids]

        user_purchase = self.purchases.find_one({"user_id": user_id})
        
        if user_purchase:
            self.purchases.update_one(
                {"user_id": user_id},
                {"$addToSet": {"voucher": {"$each": voucher_ids}}}
            )
        else:
            new_purchase = Purchase(user_id=user_id, product=[], voucher=voucher_ids)
            self.purchases.insert_one(new_purchase.to_dict())
    
    def _check_voucher_type_exists(self, name: str) -> bool:
        return self.voucher_types.find_one({"name": name}) is not None
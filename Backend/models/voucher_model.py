from datetime import datetime, timedelta
from .image_model import Image
from bson import ObjectId

class VoucherType:
    def __init__(self, name: str, description: str, quantity: int, price: int, image: Image = None):
        self.name = name
        self.description = description
        self.quantity = quantity
        self.price = price
        self.image = image
        
    def to_dict(self):
        voucher_type_dict = {
            'name': self.name,
            'description': self.description,
            'quantity': self.quantity,
            'price': self.price
        }
        
        if self.image:
            voucher_type_dict["image"] = self.image.to_dict()
            
        return voucher_type_dict
    
class Voucher:
    def __init__(self, voucher_type_id, voucher_code: str):
        self.voucher_type_id = voucher_type_id
        self.voucher_code = voucher_code
        self.status = "active" # active, expired, used
        
        self.issued_at = datetime.now()
        self.expires_at = datetime.now() + timedelta(days=90)
        
        self.created_at = datetime.now()
        
    def to_dict(self):
        return {
            'voucher_type_id': self.voucher_type_id,
            'voucher_code': self.voucher_code,
            'status': self.status,
            'issued_at': self.issued_at,
            'expires_at': self.expires_at,
            'created_at': self.created_at,
        }
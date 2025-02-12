class ProductImage:
    """商品圖片類"""
    def __init__(self, public_id: str, url: str, thumbnail_url: str):
        self.public_id = public_id
        self.url = url
        self.thumbnail_url = thumbnail_url
        
    def to_dict(self):
        return {
            "public_id": self.public_id,
            "url": self.url,
            "thumbnail_url": self.thumbnail_url
        }
        
    @classmethod
    def from_dict(cls, data):
        return cls(
            public_id=data["public_id"],
            url=data["url"],
            thumbnail_url=data["thumbnail_url"]
        )

class Product:
    def __init__(self, name, description, price, category, recycle_requirement, image=None):
        self.name = name
        self.description = description
        self.price = price
        self.category = category
        self.recycle_requirement = recycle_requirement
        self.image = image
        
    def to_dict(self):
        product_dict = {
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "recycle_requirement": self.recycle_requirement
        }
        
        if self.image:
            product_dict["image"] = self.image
            
        return product_dict
    
    @classmethod
    def from_dict(cls, data):
        """從字典創建 Product 實例"""
        return cls(
            name=data["name"],
            description=data["description"],
            price=data["price"],
            recycle_requirement=data["recycle_requirement"],
            image=data["image"]
        )
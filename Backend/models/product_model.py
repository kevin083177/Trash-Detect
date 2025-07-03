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
    def __init__(self, name, description, price, theme, type, image=None):
        self.name = name
        self.description = description
        self.price = price
        self.theme = theme
        self.type = type
        # self.recycle_requirement = recycle_requirement
        self.image = image
        
    def to_dict(self):
        product_dict = {
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "theme": self.theme,
            "type": self.type
            # "recycle_requirement": self.recycle_requirement
        }
        
        if self.image:
            product_dict["image"] = self.image
            
        return product_dict
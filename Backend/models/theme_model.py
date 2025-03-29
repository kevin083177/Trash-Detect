class ThemeImage:
    """主題圖片類"""
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

class Theme:
    def __init__(self, name, description, products, created_at, image=None):
        self.name = name
        self.description = description
        self.products = [] if products is None else products
        self.created_at = created_at
        self.image = image  # 新增圖片欄位
        
    def to_dict(self):
        theme_dict = {
            'name': self.name,
            'description': self.description,
            'products': self.products,
            'created_at': self.created_at,
        }
        
        if self.image:
            theme_dict["image"] = self.image
            
        return theme_dict
    
    @classmethod
    def from_dict(cls, data):
        """從字典創建 Theme 實例"""
        return cls(
            name=data["name"],
            description=data["description"],
            products=data.get("products", []),
            created_at=data["created_at"],
            image=data.get("image")
        )
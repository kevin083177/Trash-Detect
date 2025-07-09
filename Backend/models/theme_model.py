from .image_model import Image

class Theme:
    def __init__(self, name, description, products, created_at, image: Image=None):
        self.name = name
        self.description = description
        self.products = [] if products is None else products
        self.created_at = created_at
        self.image = image
        
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
        return cls(
            name=data["name"],
            description=data["description"],
            products=data.get("products", []),
            created_at=data["created_at"],
            image=data.get("image")
        )
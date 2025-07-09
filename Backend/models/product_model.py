from .image_model import Image

class Product:
    def __init__(self, name, description, price, theme, type, image: Image=None):
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
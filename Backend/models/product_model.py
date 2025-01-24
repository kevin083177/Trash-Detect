class Product:
    def __init__(self, name, description, price, recycle_requirement):
        self.name = name
        self.description = description
        self.price = price
        self.recycle_requirement = recycle_requirement
        
    def to_dict(self):
        return {
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "recycle_requirement": self.recycle_requirement
        }
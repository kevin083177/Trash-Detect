from typing import Literal, List
from .image_model import Image
from bson import ObjectId

RecycleType = Literal['paper', 'plastic', 'containers', 'bottles', 'cans', 'battery']

class StationType:
    def __init__(self, name: str, description: str, image: Image = None):
        self.name = name
        self.description = description
        self.image = image
        
    def to_dict(self):
        station_types_dict = {
            'name': self.name,
            'description': self.description,
            'image': self.image.to_dict()
        }
        
        return station_types_dict

class Station:
    def __init__(self, station_type: str, name: str, latitude: float, longitude: float, address: str, category: List[RecycleType]):
        self.name = name
        self.station_type = station_type
        self.latitude = latitude
        self.longitude = longitude
        self.address = address
        self.category = category
        
    def to_dict(self):
        station_dict = {
            "name": self.name,
            "station_type": self.station_type,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "address": self.address,
            "category": self.category
        }
        
        return station_dict
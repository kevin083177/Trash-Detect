from bson import ObjectId
from typing import List, get_args
from services import DatabaseService
from models import StationType, Station, Image, RecycleType
from .image_service import ImageService

class StationService(DatabaseService):
    def __init__(self, mongo_uri: str, image_service: ImageService = None):
        super().__init__(mongo_uri)
        self.station_types = self.collections['station_types']
        self.stations = self.collections['stations']
        
        if image_service is not None and not isinstance(image_service, ImageService):
            raise TypeError("image_service 必須是 ImageService")
        self.image_service = image_service
        self.VALID_RECYCLE_TYPES = get_args(RecycleType)
        
    def create_station_types(self, station_types_data: dict, image_file=None) -> dict:
        try:
            if self._check_station_types_exists(station_types_data['name']):
                raise ValueError("站點類型已存在")

            if image_file and self.image_service:
                public_id = f"station_types_{station_types_data['name']}"
                image_result = self.image_service.upload_image(
                    image_file,
                    public_id,
                    folder="station_types"
                )
                
                station_types_data['image'] = Image(
                    public_id=image_result['public_id'],
                    url=image_result['url']
                )
                
            station_types = StationType(**station_types_data)
            result = self.station_types.insert_one(station_types.to_dict())
            
            if result.inserted_id:
                created_station_types = self.station_types.find_one({"_id": result.inserted_id})
                created_station_types["_id"] = str(created_station_types["_id"])
                return created_station_types
            
            return None
        
        except Exception as e:
            if 'image_result' in locals() and self.image_service:
                try:
                    self.image_service.delete_image(image_result['public_id'])
                except:
                    pass
            raise e

    def delete_station_types(self, station_types_id: str) -> dict:
        try:
            station_types_id = ObjectId(station_types_id) if not isinstance(station_types_id, ObjectId) else station_types_id
            
            station_types = self.station_types.find_one({"_id": station_types_id})
            if not station_types:
                raise ValueError("站點類型不存在")
            
            stations_using_type = self.stations.count_documents({"station_type": station_types['name']})
            if stations_using_type > 0:
                raise ValueError(f"無法刪除：有 {stations_using_type} 個站點正在使用此類型")
            
            if station_types.get('image') and self.image_service:
                try:
                    self.image_service.delete_image(station_types['image']['public_id'])
                except Exception as e:
                    print(f"刪除站點類型圖片失敗: {str(e)}")
            
            result = self.station_types.delete_one({"_id": station_types_id})
            
            return {
                "deleted": result.deleted_count > 0,
                "message": "站點類型刪除成功" if result.deleted_count > 0 else "刪除失敗"
            }
            
        except Exception as e:
            print(f"Delete station type error: {str(e)}")
            raise
    
    def update_station_types(self, station_types_id: str, update_data: dict, new_image_file=None) -> dict:
        try:
            station_types_id = ObjectId(station_types_id) if not isinstance(station_types_id, ObjectId) else station_types_id
            
            existing_station_types = self.station_types.find_one({"_id": station_types_id})
            if not existing_station_types:
                raise ValueError("站點類型不存在")
            
            updates = {}
            
            allowed_fields = ['name', 'description']
            for field in allowed_fields:
                if field in update_data:
                    updates[field] = update_data[field]
            
            if new_image_file and self.image_service:
                public_id = f"station_types_{existing_station_types['name']}"
                new_image_result = self.image_service.upload_image(
                    image_file=new_image_file,
                    public_id=public_id,
                    folder='station_types'
                )
                
                if existing_station_types.get('image'):
                    try:
                        self.image_service.delete_image(existing_station_types['image']['public_id'])
                    except Exception as e:
                        print(f"刪除舊圖片失敗: {str(e)}")
                
                updates['image'] = {
                    'public_id': new_image_result['public_id'],
                    'url': new_image_result['url']
                }
            
            if 'name' in updates and updates['name'] != existing_station_types['name']:
                if self._check_station_types_exists(updates['name']):
                    raise ValueError("站點類型名稱已存在")
                self.stations.update_many(
                    {"station_type": existing_station_types['name']},
                    {"$set": {"station_type": updates['name']}}
                )
            
            if not updates:
                existing_station_types["_id"] = str(existing_station_types["_id"])
                return existing_station_types
            
            result = self.station_types.update_one(
                {"_id": station_types_id},
                {"$set": updates}
            )
            
            if result.modified_count > 0:
                updated_station_types = self.station_types.find_one({"_id": station_types_id})
                updated_station_types["_id"] = str(updated_station_types["_id"])
                return updated_station_types
            else:
                return None
                
        except Exception as e:
            if 'new_image_result' in locals() and self.image_service:
                try:
                    self.image_service.delete_image(new_image_result['public_id'])
                except:
                    pass
            print(f"Update station type error: {str(e)}")
            raise
    
    def get_station_types(self) -> List[dict]:
        try:
            station_types = list(self.station_types.find())
            for station_type in station_types:
                station_type["_id"] = str(station_type["_id"])
                station_type["stations_count"] = self.stations.count_documents({"station_type": station_type["name"]})
            return station_types
        except Exception as e:
            print(f"Get station types error: {str(e)}")
            raise
    
    def _check_station_types_exists(self, name: str) -> bool:
        return self.station_types.find_one({"name": name}) is not None
    
    def create_station(self, station_data: dict) -> dict:
        try:
            station_type = station_data['station_type']
            
            station_type = self.station_types.find_one({"name": station_type})
            if not station_type:
                raise ValueError("站點類型不存在")
            
            if station_data['category'] not in RecycleType:
                categories = station_data['category']
                for cat in categories:
                    if cat not in self.VALID_RECYCLE_TYPES:
                        raise ValueError(f"回收類型 '{cat}' 不存在")
            
            if self._check_station_exists(station_data['name']):
                raise ValueError("站點已存在")
            
            station = Station(
                station_type=station_type['name'],
                name=station_data['name'],
                latitude=station_data['latitude'],
                longitude=station_data['longitude'],
                address=station_data['address'],
                category=station_data.get('category', [])
            )
            
            result = self.stations.insert_one(station.to_dict())
            
            if result.inserted_id:
                created_station = self.stations.find_one({"_id": result.inserted_id})
                created_station["_id"] = str(created_station["_id"])
                
                return created_station
            
            return None
        
        except Exception as e:
            print(f"Create station error: {str(e)}")
            raise
    
    def get_stations(self) -> List[dict]:
        try:
            stations = list(self.stations.find())
            
            for station in stations:
                station["_id"] = str(station["_id"])
                station_type = station["station_type"]
                
                station_type = self.station_types.find_one({"name": station_type})
                if station_type:
                    station_type.pop("_id", None)
                    station["station_type"] = station_type
            
            return stations
        
        except Exception as e:
            print(f"Get stations error: {str(e)}")
            raise
    
    def update_station(self, station_id: str, update_data: dict) -> dict:
        try:
            station_id = ObjectId(station_id) if not isinstance(station_id, ObjectId) else station_id
            
            existing_station = self.stations.find_one({"_id": station_id})
            if not existing_station:
                raise ValueError("站點不存在")
            
            updates = {}
            
            allowed_fields = ['name', 'latitude', 'longitude', 'address', 'category']
            for field in allowed_fields:
                if field in update_data:
                    updates[field] = update_data[field]
            
            if 'category' in update_data:
                categories = update_data['category']
                for cat in categories:
                    if cat not in self.VALID_RECYCLE_TYPES:
                        raise ValueError(f"回收類型 '{cat}' 不存在")
            
            if 'station_type' in update_data:
                station_type = update_data['station_type']
                
                station_type = self.station_types.find_one({"name": station_type})
                if not station_type:
                    raise ValueError("站點類型不存在")
                
                updates['station_type'] = station_type
            
            if 'name' in updates and updates['name'] != existing_station['name']:
                if self._check_station_exists(updates['name']):
                    raise ValueError("站點已存在")
            
            if not updates:
                existing_station["_id"] = str(existing_station["_id"])
                return existing_station
            
            result = self.stations.update_one(
                {"_id": station_id},
                {"$set": updates}
            )
            
            if result.modified_count > 0:
                updated_station = self.stations.find_one({"_id": station_id})
                updated_station["_id"] = str(updated_station["_id"])
                station_type = updated_station["station_type"]
                
                station_type = self.station_types.find_one({"name": station_type})
                if station_type:
                    updated_station["station_type_detail"] = {
                        "_id": str(station_type["_id"]),
                        "name": station_type["name"],
                        "description": station_type["description"],
                        "image": station_type.get("image")
                    }
                
                return updated_station
            else:
                return None
        
        except Exception as e:
            print(f"Update station error: {str(e)}")
            raise
    
    def delete_station(self, station_id: str) -> dict:
        try:
            station_id = ObjectId(station_id) if not isinstance(station_id, ObjectId) else station_id
            
            station = self.stations.find_one({"_id": station_id})
            if not station:
                raise ValueError("站點不存在")
            
            result = self.stations.delete_one({"_id": station_id})
            
            return {
                "deleted": result.deleted_count > 0,
                "message": "站點刪除成功" if result.deleted_count > 0 else "刪除失敗"
            }
        
        except Exception as e:
            print(f"Delete station error: {str(e)}")
            raise
    
    def _check_station_exists(self, name: str) -> bool:
        return self.stations.find_one({"name": name}) is not None
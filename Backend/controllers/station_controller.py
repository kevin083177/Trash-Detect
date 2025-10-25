from services import StationService, ImageService
from config import Config
from flask import request
from bson import ObjectId

image_service = ImageService(Config.get_cloudinary_config())
station_service = StationService(Config.MONGO_URI, image_service)

class StationController:
    @staticmethod
    def get_station_types(user):
        try:
            station_types = station_service.get_station_types()
            if station_types:
                return {
                    "message": "成功獲取站點列表",
                    "body": station_types
                }, 200
            return {
                "message": "無法獲取站點列表"
            }, 404
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_station_types) {str(e)}"
            }, 500
    
    @staticmethod
    def create_station_types():
        try:
            if 'image' not in request.files:
                return {
                    "message": "缺少圖片"
                }, 400
            
            image = request.files['image']
            
            if image.filename == '':
                return {
                    "message": "未選擇圖片"
                }, 400
            
            if not ImageService._allowed_file(image.filename):
                return {
                    "message": "不支援的圖片格式"
                }, 400
            
            if request.content_length > ImageService.MAX_FILE_SIZE:
                return {
                    "message": "圖片大小超過限制"
                }, 400
            
            try:
                data = {
                    'name': request.form.get('name'),
                    'description': request.form.get('description')
                }
            except Exception as e:
                return {
                    "message": "表單數據格式錯誤"
                }, 400
            
            required_fields = ['name', 'description']
            missing_fields = [field for field in required_fields if not data.get(field)]
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}"
                }, 400
            
            if station_service._check_station_types_exists(data['name']):
                return {
                    "message": "站點類型已存在"
                }, 409
            
            result = station_service.create_station_types(data, image)
            
            if result:
                return {
                    "message": "新增站點類型成功",
                    "body": result
                }, 200
            return {
                "message": "無法新增站點類型"
            }, 404
        except ValueError as e:
            return {
                "message": str(e)
            }, 400
        except Exception as e:
            return {
                "message": f"伺服器(create_station_types) {str(e)}"
            }, 500
    
    @staticmethod
    def delete_station_types():
        try:
            data = request.get_json()
            
            if "station_types_id" not in data:
                return {
                    "message": "缺少 station_types_id"
                }, 400
            
            station_types_id = data["station_types_id"]
            
            station_types = station_service.station_types.find_one({"_id": ObjectId(station_types_id)})
            if not station_types:
                return {
                    "message": "無法找到站點類型"
                }, 404
            
            result = station_service.delete_station_types(station_types_id)
            
            if result.get("deleted"):
                return {
                    "message": result.get("message")
                }, 200
            else:
                return {
                    "message": result.get("message")
                }, 500
        
        except ValueError as e:
            return {
                "message": str(e)
            }, 400
        except Exception as e:
            return {
                "message": f"伺服器錯誤(delete_station_types) {str(e)}"
            }, 500
    
    @staticmethod
    def update_station_types():
        try:
            station_types_id = request.form.get('station_types_id')
            if not station_types_id:
                return {
                    "message": "缺少 station_types_id"
                }, 400
            
            station_types = station_service.station_types.find_one({"_id": ObjectId(station_types_id)})
            if not station_types:
                return {
                    "message": "站點類型不存在"
                }, 404
            
            update_data = {}
            
            if 'name' in request.form:
                update_data['name'] = request.form.get('name')
            
            if 'description' in request.form:
                update_data['description'] = request.form.get('description')
            
            new_image_file = None
            if 'image' in request.files:
                image = request.files['image']
                
                if not ImageService._allowed_file(image.filename):
                    return {
                        "message": "不支援的圖片格式"
                    }, 400
                
                if request.content_length > ImageService.MAX_FILE_SIZE:
                    return {
                        "message": "圖片大小超過限制"
                    }, 400
                
                new_image_file = image
            
            if not update_data and not new_image_file:
                station_types["_id"] = str(station_types["_id"])
                return {
                    "message": "未更新任何數據",
                    "body": station_types
                }, 200
            
            updated_station_types = station_service.update_station_types(station_types_id, update_data, new_image_file)
            
            if updated_station_types:
                return {
                    "message": "更新站點類型成功",
                    "body": updated_station_types
                }, 200
            else:
                return {
                    "message": "更新站點類型失敗"
                }, 500
        
        except ValueError as e:
            return {
                "message": str(e)
            }, 400
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_station_types) {str(e)}"
            }, 500
            
    @staticmethod
    def create_station():
        try:
            data = request.get_json()
            
            required_fields = ['name', 'station_type', 'latitude', 'longitude', 'address', 'category']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}"
                }, 400
            
            try:
                latitude = float(data['latitude'])
                longitude = float(data['longitude'])
                
                if not (-90 <= latitude <= 90):
                    return {
                        "message": "latitude 需在 90 至 -90 之間"
                    }, 400
                
                if not (-180 <= longitude <= 180):
                    return {
                        "message": "longitude 需在 180 至 -180 之間"
                    }, 400
            
            except ValueError:
                return {
                    "message": "latitude 與 longitude 需為數字"
                }, 400
            
            if not isinstance(data['category'], list) or len(data['category']) == 0:
                return {
                    "message": "category 不能為空"
                }, 400
            
            station_data = {
                'name': data['name'],
                'station_type': data['station_type'],
                'latitude': latitude,
                'longitude': longitude,
                'address': data['address'],
                'category': data['category']
            }
            
            result = station_service.create_station(station_data)
            
            if result:
                return {
                    "message": "新增站點成功",
                    "body": result
                }, 200
            return {
                "message": "新增站點失敗"
            }, 404
        
        except ValueError as e:
            return {
                "message": str(e)
            }, 400
        except Exception as e:
            return {
                "message": f"伺服器錯誤(create_station) {str(e)}"
            }, 500
    
    @staticmethod
    def get_stations(user):
        try:
            stations = station_service.get_stations()
            
            if stations:
                return {
                    "message": "成功獲取所有站點",
                    "body": stations
                }, 200
            
            return {
                "message": "無法獲取站點"
            }, 404
        
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_stations) {str(e)}"
            }, 500
    
    @staticmethod
    def update_station():
        try:
            station_id = request.get_json().get('station_id')
            
            if not station_id:
                return {
                    "message": "缺少 station_id"
                }, 400
            
            station = station_service.stations.find_one({"_id": ObjectId(station_id)})
            station.pop("_id", None)
            
            if not station:
                return {
                    "message": "站點不存在"
                }, 404
            
            data = request.get_json()
            update_data = {}
            
            if data['name'] != station['name']:
                update_data['name'] = data['name']
            
            if data['station_type'] != station['station_type']:
                update_data['station_type'] = data['station_type']
            
            if data['latitude'] != station['latitude']:
                try:
                    latitude = float(data['latitude'])
                    if not (-90 <= latitude <= 90):
                        return {
                            "message": "latitude 需在 90 至 -90 之間"
                        }, 400
                    update_data['latitude'] = latitude
                except ValueError:
                    return {
                        "message": "latitude 需為數字"
                    }, 400
            
            if data['longitude'] != station['longitude']:
                try:
                    longitude = float(data['longitude'])
                    if not (-180 <= longitude <= 180):
                        return {
                            "message": "longitude 需在 180 至 -180 之間"
                        }, 400
                    update_data['longitude'] = longitude
                except ValueError:
                    return {
                        "message": "longitude 需為數字"
                    }, 400
            
            if data['address'] != station['address']:
                update_data['address'] = data['address']
            
            if data['category'] != station['category']:
                if not isinstance(data['category'], list) or len(data['category']) == 0:
                    return {
                        "message": "category 不能為空"
                    }, 400
                update_data['category'] = data['category']
            
            if not update_data:
                return {
                    "message": "未更新任何數據",
                    "body": station
                }, 200
            
            updated_station = station_service.update_station(station_id, update_data)
            
            if updated_station:
                return {
                    "message": "更新站點成功",
                    "body": updated_station
                }, 200
            else:
                return {
                    "message": "更新站點失敗"
                }, 500
        
        except ValueError as e:
            return {
                "message": str(e)
            }, 400
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_station) {str(e)}"
            }, 500
    
    @staticmethod
    def delete_station():
        try:
            data = request.get_json()
            
            if "station_id" not in data:
                return {
                    "message": "缺少: station_id"
                }, 400
            
            station_id = data["station_id"]
            
            station = station_service.stations.find_one({"_id": ObjectId(station_id)})
            if not station:
                return {
                    "message": "無法找到站點"
                }, 404
            
            result = station_service.delete_station(station_id)
            
            if result.get("deleted"):
                return {
                    "message": result.get("message")
                }, 200
            else:
                return {
                    "message": result.get("message")
                }, 500
        
        except ValueError as e:
            return {
                "message": str(e)
            }, 400
        except Exception as e:
            return {
                "message": f"伺服器錯誤(delete_station) {str(e)}"
            }, 500
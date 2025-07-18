from flask import request
from models import Chapter
from services import ImageService, ChapterService
from bson import ObjectId
from config import Config

image_service = ImageService(Config.get_cloudinary_config())
chapter_service = ChapterService(Config.MONGO_URI, image_service)

class ChapterController:
    @staticmethod
    def add_chapter():
        try:
            # 檢查必要的圖片檔案是否上傳
            if 'image' not in request.files:
                return {
                    "message": "缺少章節背景圖片"
                }, 400
                
            image = request.files['image']
            
            if image.filename == '':
                return {
                    "message": "未選擇背景圖片"
                }, 400
            
            # 檢查檔案類型
            if not ImageService._allowed_file(image.filename):
                return {
                    "message": f"不支援的背景圖片格式，允許的格式：{', '.join(ImageService.ALLOWED_EXTENSIONS)}"
                }, 400
                
            # 檢查檔案大小
            if request.content_length > ImageService.MAX_FILE_SIZE:
                return {
                    "message": f"圖片大小超過限制（最大 {ImageService.MAX_FILE_SIZE // 1024 // 1024}MB）"
                }, 400
            
            # 從表單獲取章節數據
            data = request.form.to_dict()
            required_fields = ['name', 'trash_requirement'] # description
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
            
            name = request.form.get('name')
            # description = request.form.get('description')
            trash_requirement = request.form.get('trash_requirement', type=int)
            
            # 創建章節數據字典
            chapter_data = {
                'name': name,
                # 'description': description,
                'trash_requirement': trash_requirement,
                'image': image
            }
            
            # 新增章節（包含圖片上傳）
            result = chapter_service.add_chapter(chapter_data)
            
            if result:
                return {
                    "message": "新增章節成功",
                    "body": result
                }, 200
            else:
                return {
                    "message": "章節已存在或創建失敗"
                }, 409
                
        except ValueError as e:
            return {
                "message": str(e)
            }, 400
        except Exception as e:
            return {
                "message": f"伺服器錯誤(add_chapter): {str(e)}"
            }, 500
            
    def get_chapter_by_name(user, chapter_name: str):
        try:
            chapter = chapter_service.get_chapter_by_name(chapter_name)
            if chapter:
                return {
                    "message": "取得章節成功",
                    "body": chapter
                }, 200
            else:
                return {
                    "message": "章節不存在"
                }, 404
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_chapter_by_name): {str(e)}"
            }, 500
            
    def delete_chapter():
        """
        刪除章節
        """
        try:
            data = request.get_json()
            name = data.get('name')
            
            if not name:
                return {
                    "message": "請提供章節名稱"
                }, 400
                
            result = chapter_service.delete_chapter(name)
            
            if result["success"]:
                return {
                    "message": f"成功刪除章節 {name}",
                }, 200
            else:
                # 檢查是否因為章節不存在而失敗
                if "不存在" in result.get("error", ""):
                    return {
                        "message": result["error"]
                    }, 404
                else:
                    return {
                        "message": result.get("error", "刪除章節失敗")
                    }, 500
                    
        except Exception as e:
            return {
                "message": f"伺服器錯誤(delete_chapter): {str(e)}"
            }, 500
            
    @staticmethod
    def update_chapter():
        """
        更新章節
        """
        try:
            data = request.form.to_dict()
            name = data.get('name')
            
            if not name:
                return {
                    "message": "請提供章節名稱"
                }, 400
                
            # 準備更新數據
            update_data = {}
            
            # 獲取描述更新
            # if 'description' in request.form:
            #     description = request.form.get('description')
            #     if description:
            #         update_data["description"] = description
            
            # 獲取所需回收量
            if 'trash_requirement' in request.form:
                trash_requirement = request.form.get('trash_requirement')
                if trash_requirement:
                    update_data["trash_requirement"] = trash_requirement
                    
            # 處理圖片更新
            if 'image' in request.files and request.files['image'].filename != '':
                image = request.files['image']
                
                # 檢查檔案類型
                if not ImageService._allowed_file(image.filename):
                    return {
                        "message": f"不支援的背景圖片格式，允許的格式：{', '.join(ImageService.ALLOWED_EXTENSIONS)}"
                    }, 400
                    
                update_data["image"] = image
            
            # 如果沒有更新的數據
            if not update_data:
                return {
                    "message": "未提供任何更新數據",
                    "body": chapter_service.get_chapter_by_name(name)
                }, 200
            
            try:
                # 更新章節
                updated_chapter = chapter_service.update_chapter(name, update_data)
                
                if updated_chapter:
                    return {
                        "message": "章節更新成功",
                        "body": updated_chapter
                    }, 200
                else:
                    return {
                        "message": "章節更新失敗"
                    }, 400
                    
            except ValueError as e:
                return {
                    "message": str(e)
                }, 404
                    
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_chapter): {str(e)}"
            }, 500
            
    def get_all_chapters(user):
        """
        獲取所有章節
        """
        try:
            chapters = chapter_service.get_all_chapters()
            return {
                "message": "取得所有章節成功",
                "body": chapters
            }, 200
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_all_chapters): {str(e)}"
            }, 500
from bson import ObjectId
from services import DatabaseService
from .image_service import ImageService
from models import Chapter

class ChapterService(DatabaseService):
    def __init__(self, mongo_uri, image_service=None):
        super().__init__(mongo_uri)
        self.chapters = self.collections['chapters']
        self.levels = self.collections['levels']
        
        if image_service is not None and not isinstance(image_service, ImageService):
            raise TypeError("image_service 必須是 ImageService")
        self.image_service = image_service
        
    def _get_next_chapter_sequence(self):
        """獲取下一個章節可用的 sequence 值"""
        max_sequence_chapter = self.chapters.find_one(
            {},
            sort=[("sequence", -1)]
        )
        
        if not max_sequence_chapter or "sequence" not in max_sequence_chapter:
            return 1
            
        return max_sequence_chapter["sequence"] + 1
    
    def _get_next_level_sequence(self):
        """獲取下一個可用的關卡 sequence 值"""
        max_sequence_level = self.levels.find_one(
            {},
            sort=[("sequence", -1)]
        )
        
        if not max_sequence_level or "sequence" not in max_sequence_level:
            return 1
            
        return max_sequence_level["sequence"] + 1
    
    def _create_chapter_levels(self, chapter_name: str, chapter_sequence: int):
        level_ids = []
        
        start_level_number = (chapter_sequence - 1) * 5 + 1
        current_level_sequence = self._get_next_level_sequence()
        
        for i in range(5):
            level_number = start_level_number + i
            level_name = f"Level {level_number}"
            
            if chapter_sequence == 1 and i == 0:
                unlock = 0
            else:
                unlock = current_level_sequence - 1
                
            level_data = {
                'sequence': current_level_sequence,
                'chapter': chapter_name,
                'name': level_name,
                'description': None,
                'unlock_requirement': unlock
            }
            
            result = self.levels.insert_one(level_data)
            level_ids.append(result.inserted_id)
            
            current_level_sequence += 1
            
        return level_ids
            
    def add_chapter(self, chapter_data: Chapter):
        """新增章節並自動創建 5 個關卡"""
        image_result = None
        created_level_ids = []
        
        try:
            if not self.image_service:
                raise ValueError("ImageService 沒有初始化")
            
            name = chapter_data.name if hasattr(chapter_data, 'name') else chapter_data.get('name')
            trash_requirement = chapter_data.trash_requirement if hasattr(chapter_data, 'trash_requirement') else chapter_data.get('trash_requirement')
            
            existing_chapter = self.chapters.find_one({"name": name})
            if existing_chapter:
                raise ValueError("章節名稱已存在")
            
            image = chapter_data.image if hasattr(chapter_data, 'image') else chapter_data.get('image')
                       
            image_result = self.image_service.upload_image(
                image_file=image,
                public_id=name + '_image',
                folder='chapters/image'
            )
            
            next_sequence = self._get_next_chapter_sequence()
            
            created_level_ids = self._create_chapter_levels(name, next_sequence)
            
            chapter_dict = {
                'name': name,
                'trash_requirement': trash_requirement,
                'image': image_result,
                'levels': created_level_ids,
                'sequence': next_sequence
            }
            
            result = self.chapters.insert_one(chapter_dict)
            
            if result.inserted_id:
                created_chapter = self.chapters.find_one({"_id": result.inserted_id})
                if created_chapter:
                    created_chapter["_id"] = str(created_chapter["_id"]) 
                    created_chapter["levels"] = [str(level_id) for level_id in created_chapter["levels"]]
                    return created_chapter
            
            return None

        except Exception as e:
            try:
                if created_level_ids:
                    self.levels.delete_many({"_id": {"$in": created_level_ids}})
                
                if hasattr(self, 'image_service') and self.image_service and image_result:
                    self.image_service.delete_image(image_result['public_id'])
            except Exception as cleanup_error:
                print(f"Cleanup image error: {str(cleanup_error)}")
            
            raise e
        
    def get_chapter_by_name(self, name):
        """
        透過名稱獲取章節
        
        Args:
            name: 章節名稱
            
        Returns:
            Dict: 章節資訊，若不存在則返回 None
        """
        try:
            chapter = self.chapters.find_one({"name": name})
            if chapter:
                chapter["_id"] = str(chapter["_id"])
                
                if "levels" in chapter and chapter["levels"]:
                    chapter["levels"] = [str(level_id) for level_id in chapter["levels"]]
                    
                return chapter
            return None
        except Exception as e:
            print(f"Failed to get chapter info: {str(e)}")
            return None
        
    def _reorder_sequences_after_delete(self, deleted_sequence):
        try:
            chapters_to_update = list(self.chapters.find(
                {"sequence": {"$gt": deleted_sequence}},
                sort=[("sequence", 1)]
            ))
            
            for chapter in chapters_to_update:
                self.chapters.update_one(
                    {"_id": chapter["_id"]},
                    {"$set": {"sequence": chapter["sequence"] - 1}}
                )
                
            return True
        except Exception as e:
            return False
    
    def _remove_level_from_chapter(self, chapter_name: str, level_id: str):
        try:
            level_object_id = ObjectId(level_id)
            
            result = self.chapters.update_one(
                {"name": chapter_name},
                {"$pull": {"levels": level_object_id}}
            )
            return result.modified_count > 0 or result.matched_count > 0
        except Exception as e:
            print(f"Failed to remove level from chapter: {str(e)}")
            return False
    
    def delete_chapter(self, name):
        """
        刪除章節及其相關的所有關卡
        
        Args:
            name: 章節名稱
            
        Returns:
            Dict: 包含刪除結果的字典
        """
        try:
            chapter = self.chapters.find_one({"name": name})
            if not chapter:
                return {
                    "success": False,
                    "error": f"章節 {name} 不存在"
                }
                
            chapter_sequence = chapter.get("sequence")
            
            max_sequence_chapter = self.chapters.find_one(
                {},
                sort=[("sequence", -1)]
            )
            
            if not max_sequence_chapter:
                return {
                    "success": False,
                    "error": "無法找到最大序號章節"
                }
            
            max_sequence = max_sequence_chapter.get("sequence")
            
            if chapter_sequence != max_sequence:
                return {
                    "success": False,
                    "error": f"只能刪除最後創建的章節（序號 {max_sequence}），無法刪除序號 {chapter_sequence} 的章節"
                }
            
            deleted_levels = self.levels.delete_many({"chapter": name})
                
            if self.image_service:
                if "image" in chapter and "public_id" in chapter["image"]:
                    try:
                        self.image_service.delete_image(chapter["image"]["public_id"])
                    except Exception as e:
                        print(f"Delete image error: {str(e)}")
            
            result = self.chapters.delete_one({"name": name})
            
            if result.deleted_count > 0:
                return {
                    "success": True,
                    "deleted_chapter": name,
                    "deleted_levels_count": deleted_levels.deleted_count
                }
            else:
                return {
                    "success": False,
                    "error": f"刪除章節失敗"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
            
    def update_chapter(self, name, update_data: Chapter):
        """
        更新章節
        
        Args:
            name: 章節名稱
            update_data: image, trash_requirement
            
        Returns:
            Dict: 更新後的章節資訊
            
        Raises:
            ValueError: 如果章節不存在
            Exception: 其他處理過程中的錯誤
        """
        image_result = None
        
        try:
            existing_chapter = self.chapters.find_one({"name": name})
            if not existing_chapter:
                raise ValueError(f"章節「{name}」不存在")
                
            updates: Chapter = {}
            
            if "trash_requirement" in update_data:
                trash_requirement = int(update_data.get('trash_requirement'))
                if trash_requirement:
                    updates["trash_requirement"] = trash_requirement
                    
            if "image" in update_data and update_data["image"]:
                image = update_data.image if hasattr(update_data, 'image') else update_data.get('image')
                
                public_id = f"{name}_image"
                image_result = self.image_service.upload_image(
                    image_file=image,
                    public_id=public_id,
                    folder='chapters/image'
                )
                
                try:
                    self.image_service.delete_image(existing_chapter["image"]["public_id"])
                except Exception as e:
                    print(f"Delete image error: {str(e)}")
                        
                updates["image"] = image_result
            
            if not updates:
                existing_chapter["_id"] = str(existing_chapter["_id"])
                return existing_chapter
                
            result = self.chapters.update_one(
                {"name": name},
                {"$set": updates}
            )
            
            if result.modified_count > 0 or result.matched_count > 0:
                updated_chapter = self.chapters.find_one({"name": name})
                updated_chapter["_id"] = str(updated_chapter["_id"])
                if "levels" in  updated_chapter and  updated_chapter["levels"]:
                     updated_chapter["levels"] = [str(level_id) for level_id in  updated_chapter["levels"]]
                return updated_chapter
                
            return None
                
        except Exception as e:
            if hasattr(self, 'image_service') and self.image_service:
                if image_result and "public_id" in image_result:
                    try:
                        self.image_service.delete_image(image_result['public_id'])
                    except:
                        pass
            raise e
        
    def get_all_chapters(self):
        """獲取所有章節"""
        try:
            chapters = list(self.chapters.find().sort("sequence", 1))
            for chapter in chapters:
                chapter["_id"] = str(chapter["_id"])
                
                if "levels" in chapter and chapter["levels"]:
                    chapter["levels"] = [str(level_id) for level_id in chapter["levels"]]
                    
            return chapters
        except Exception as e:
            print(f"Failed to get all chapters: {str(e)}")
            return []
        
    def _check_chapter_exists(self, name):
        return self.chapters.find_one({"name": name}) is not None
    
    def _add_level_to_chapter(self, chapter_name: str, level_id: str):
        """添加關卡到章節"""
        try:
            level_object_id = ObjectId(level_id)
            
            result = self.chapters.update_one(
                {"name": chapter_name},
                {"$addToSet": {"levels": level_object_id}}
            )
            return result.modified_count > 0 or result.matched_count > 0
        except Exception as e:
            print(f"Failed to add level to chapter: {str(e)}")
            return False
            
    def _remove_level_from_chapter(self, chapter_name: str, level_id: str):
        """移除章節中關卡"""
        try:
            level_object_id = ObjectId(level_id)
            
            result = self.chapters.update_one(
                {"name": chapter_name},
                {"$pull": {"levels": level_object_id}}
            )
            return result.modified_count > 0 or result.matched_count > 0
        except Exception as e:
            print(f"Failed to remove level from chapter: {str(e)}")
            return False
        
    def _get_chapter_name_by_sequence(self, sequence: int):
        chapter = self.chapters.find_one({"sequence": sequence})
        return chapter["name"] if chapter else None
    
    def _get_sequence_by_chapter_name(self, name):
        chapter = self.chapters.find_one({"name": name})
        return int(chapter["sequence"]) if chapter else None
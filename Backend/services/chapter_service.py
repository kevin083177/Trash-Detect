from bson import ObjectId
from services import DatabaseService
from .image_service import ImageService
from models import Chapter

class ChapterService(DatabaseService):
    def __init__(self, mongo_uri, image_service=None):
        super().__init__(mongo_uri)
        self.chapters = self.collections['chapters']
        
        if image_service is not None and not isinstance(image_service, ImageService):
            raise TypeError("image_service 必須是 ImageService")
        self.image_service = image_service
        
    def _get_next_sequence(self):
        """
        獲取下一個可用的 sequence 值
        
        Returns:
            int: 下一個可用的 sequence 值
        """
        # 獲取當前的最大 sequence 值
        max_sequence_chapter = self.chapters.find_one(
            {},
            sort=[("sequence", -1)]  # 按 sequence 降序排序
        )
        
        # 如果沒有章節，或章節沒有 sequence 值，則從 1 開始
        if not max_sequence_chapter or "sequence" not in max_sequence_chapter:
            return 1
            
        return max_sequence_chapter["sequence"] + 1
        
    def add_chapter(self, chapter_data):
        """
        新增章節
        
        Args:
            chapter_data: Chapter 對象或包含章節資訊的字典
                
        Returns:
            Dict: 創建成功的章節資訊
                
        Raises:
            ValueError: 如果章節名稱已存在或 ImageService 未初始化
            Exception: 其他處理過程中的錯誤
        """
        banner_result = None
        background_result = None
        
        try:
            # 檢查是否有 image_service
            if not self.image_service:
                raise ValueError("ImageService 沒有初始化")
            
            # 獲取章節名稱和描述
            name = chapter_data.name if hasattr(chapter_data, 'name') else chapter_data.get('name')
            description = chapter_data.description if hasattr(chapter_data, 'description') else chapter_data.get('description')
            trash_requirement = chapter_data.trash_requirement if hasattr(chapter_data, 'trash_requirement') else chapter_data.get('trash_requirement')
            
            # 檢查章節名稱是否已存在
            existing_chapter = self.chapters.find_one({"name": name})
            if existing_chapter:
                raise ValueError("章節名稱已存在")
            
            # 獲取圖片檔案
            banner_image = chapter_data.banner_image if hasattr(chapter_data, 'banner_image') else chapter_data.get('banner_image')
            background_image = chapter_data.background_image if hasattr(chapter_data, 'background_image') else chapter_data.get('background_image')
            
            # 上傳橫幅圖片
            banner_result = self.image_service.upload_image(
                image_file=banner_image,
                public_id=name + '_banner',
                folder='chapters/banner'
            )
            
            # 上傳背景圖片
            background_result = self.image_service.upload_image(
                image_file=background_image,
                public_id=name + '_background',
                folder='chapters/background'
            )
            
            # 獲取下一個可用的 sequence 值
            next_sequence = self._get_next_sequence()
            
            # 創建章節字典，確保包含空的 levels 陣列
            chapter_dict = {
                'name': name,
                'description': description,
                'trash_requirement': trash_requirement,
                'banner_image': banner_result,
                'background_image': background_result,
                'levels': [],  # 初始化空的關卡陣列
                'sequence': next_sequence  # 設置 sequence 值
            }
            
            # 插入到數據庫
            result = self.chapters.insert_one(chapter_dict)
            
            if result.inserted_id:
                created_chapter = self.chapters.find_one({"_id": result.inserted_id})
                if created_chapter:
                    created_chapter["_id"] = str(created_chapter["_id"])  # 轉換 ObjectId 為字符串
                    return created_chapter
            
            return None

        except Exception as e:
            # 如果在新增章節過程中發生錯誤，刪除已上傳的圖片
            if hasattr(self, 'image_service') and self.image_service:
                if banner_result:
                    try:
                        self.image_service.delete_image(banner_result['public_id'])
                    except:
                        print(f"failed to delete banner image: {str(e)}")
                
                if background_result:
                    try:
                        self.image_service.delete_image(background_result['public_id'])
                    except:
                        print(f"failed to delete background image: {str(e)}")
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
                
                # 將 levels 陣列中的 ObjectId 轉換為字符串
                if "levels" in chapter and chapter["levels"]:
                    chapter["levels"] = [str(level_id) for level_id in chapter["levels"]]
                    
                return chapter
            return None
        except Exception as e:
            print(f"failed to get chapter info: {str(e)}")
            return None
        
    def _reorder_sequences_after_delete(self, deleted_sequence):
        """
        重新排序所有 sequence 大於被刪除章節 sequence 的章節
        
        Args:
            deleted_sequence: 被刪除章節的 sequence 值
            
        Returns:
            bool: 如果重新排序成功則返回 True，否則返回 False
        """
        try:
            # 找出所有 sequence 大於被刪除 sequence 的章節
            chapters_to_update = list(self.chapters.find(
                {"sequence": {"$gt": deleted_sequence}},
                sort=[("sequence", 1)]  # 按 sequence 升序排序
            ))
            
            # 更新每個章節的 sequence，減 1
            for chapter in chapters_to_update:
                self.chapters.update_one(
                    {"_id": chapter["_id"]},
                    {"$set": {"sequence": chapter["sequence"] - 1}}
                )
                
            return True
        except Exception as e:
            print(f"重新排序 sequence 時出錯: {str(e)}")
            return False
        
    def delete_chapter(self, name):
        """
        刪除章節
        
        Args:
            name: 章節名稱
            
        Returns:
            Dict: 包含刪除結果的字典
        """
        try:
            # 檢查章節是否存在
            chapter = self.chapters.find_one({"name": name})
            if not chapter:
                return {
                    "success": False,
                    "error": f"章節 {name} 不存在"
                }
                
            # 保存被刪除章節的 sequence 值，用於後續重新排序
            deleted_sequence = chapter.get("sequence")
                
            # 刪除與章節關聯的圖片
            if self.image_service:
                if "banner_image" in chapter and "public_id" in chapter["banner_image"]:
                    try:
                        self.image_service.delete_image(chapter["banner_image"]["public_id"])
                    except Exception as e:
                        print(f"刪除橫幅圖片時出錯: {str(e)}")
                        
                if "background_image" in chapter and "public_id" in chapter["background_image"]:
                    try:
                        self.image_service.delete_image(chapter["background_image"]["public_id"])
                    except Exception as e:
                        print(f"刪除背景圖片時出錯: {str(e)}")
            
            # 刪除章節記錄
            result = self.chapters.delete_one({"name": name})
            
            if result.deleted_count > 0:
                # 重新排序後續章節的 sequence 值
                if deleted_sequence is not None:
                    self._reorder_sequences_after_delete(deleted_sequence)
                    
                return {
                    "success": True,
                    "deleted_chapter": name
                }
            else:
                return {
                    "success": False,
                    "error": f"刪除章節「{name}」失敗"
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
            update_data: 要更新的數據，可包含 description, banner_image, background_image
            
        Returns:
            Dict: 更新後的章節資訊
            
        Raises:
            ValueError: 如果章節不存在
            Exception: 其他處理過程中的錯誤
        """
        banner_result = None
        background_result = None
        
        try:
            # 獲取現有章節
            existing_chapter = self.chapters.find_one({"name": name})
            if not existing_chapter:
                raise ValueError(f"章節「{name}」不存在")
                
            # 準備更新數據
            updates = {}
            
            # 處理描述更新
            if "description" in update_data:
                description = update_data.description if hasattr(update_data, 'description') else update_data.get('description')
                if description:
                    updates["description"] = description
                    
            # 處理圖片更新
            if "banner_image" in update_data and update_data["banner_image"]:
                # 獲取圖片檔案
                banner_image = update_data.banner_image if hasattr(update_data, 'banner_image') else update_data.get('banner_image')
                
                # 上傳新的橫幅圖片
                public_id = f"{name}_banner_{str(existing_chapter['_id'])[-6:]}"
                banner_result = self.image_service.upload_image(
                    image_file=banner_image,
                    public_id=public_id,
                    folder='chapters/banner'
                )
                
                # 刪除舊的橫幅圖片
                if "banner_image" in existing_chapter and "public_id" in existing_chapter["banner_image"]:
                    try:
                        self.image_service.delete_image(existing_chapter["banner_image"]["public_id"])
                    except Exception as e:
                        print(f"刪除舊橫幅圖片時出錯: {str(e)}")
                        
                updates["banner_image"] = banner_result
                
            if "background_image" in update_data and update_data["background_image"]:
                # 獲取圖片檔案
                background_image = update_data.background_image if hasattr(update_data, 'background_image') else update_data.get('background_image')
                
                # 上傳新的背景圖片
                public_id = f"{name}_background_{str(existing_chapter['_id'])[-6:]}"
                background_result = self.image_service.upload_image(
                    image_file=background_image,
                    public_id=public_id,
                    folder='chapters/background'
                )
                
                # 刪除舊的背景圖片
                if "background_image" in existing_chapter and "public_id" in existing_chapter["background_image"]:
                    try:
                        self.image_service.delete_image(existing_chapter["background_image"]["public_id"])
                    except Exception as e:
                        print(f"刪除舊背景圖片時出錯: {str(e)}")
                        
                updates["background_image"] = background_result
            
            # 如果沒有需要更新的內容
            if not updates:
                existing_chapter["_id"] = str(existing_chapter["_id"])
                return existing_chapter
                
            # 執行更新
            result = self.chapters.update_one(
                {"name": name},
                {"$set": updates}
            )
            
            if result.modified_count > 0 or result.matched_count > 0:
                # 獲取更新後的章節
                updated_chapter = self.chapters.find_one({"name": name})
                updated_chapter["_id"] = str(updated_chapter["_id"])
                return updated_chapter
                
            return None
                
        except Exception as e:
            # 處理錯誤，刪除已上傳的新圖片
            if hasattr(self, 'image_service') and self.image_service:
                if banner_result and "public_id" in banner_result:
                    try:
                        self.image_service.delete_image(banner_result['public_id'])
                    except:
                        pass
                
                if background_result and "public_id" in background_result:
                    try:
                        self.image_service.delete_image(background_result['public_id'])
                    except:
                        pass
            raise e
        
    def get_all_chapters(self):
        """
        獲取所有章節
        
        Returns:
            List[Dict]: 包含所有章節資訊的列表
        """
        try:
            # 按 sequence 排序章節
            chapters = list(self.chapters.find().sort("sequence", 1))
            for chapter in chapters:
                chapter["_id"] = str(chapter["_id"])
                
                # 將 levels 陣列中的 ObjectId 轉換為字符串
                if "levels" in chapter and chapter["levels"]:
                    chapter["levels"] = [str(level_id) for level_id in chapter["levels"]]
                    
            return chapters
        except Exception as e:
            print(f"failed to get all chapters: {str(e)}")
            return []
        
    def _check_chapter_exists(self, name):
        """
        檢查章節是否存在
        
        Args:
            name: 章節名稱
            
        Returns:
            bool: 如果章節存在則返回 True，否則返回 False
        """
        return self.chapters.find_one({"name": name}) is not None
    
    def _add_level_to_chapter(self, chapter_name: str, level_id: str):
        """
        將關卡添加到章節
        
        Args:
            chapter_name: 章節名稱
            level_id: 關卡 ID (字符串)
            
        Returns:
            bool: 如果添加成功則返回 True，否則返回 False
        """
        try:
            level_object_id = ObjectId(level_id)
            
            result = self.chapters.update_one(
                {"name": chapter_name},
                {"$addToSet": {"levels": level_object_id}}
            )
            return result.modified_count > 0 or result.matched_count > 0
        except Exception as e:
            print(f"failed to add level to chapter: {str(e)}")
            return False
            
    def _remove_level_from_chapter(self, chapter_name: str, level_id: str):
        """
        從章節中移除關卡
        
        Args:
            chapter_name: 章節名稱
            level_id: 關卡 ID (字符串)
            
        Returns:
            bool: 如果刪除成功則返回 True，否則返回 False
        """
        try:
            # 將字符串 ID 轉換為 ObjectId
            level_object_id = ObjectId(level_id)
            
            result = self.chapters.update_one(
                {"name": chapter_name},
                {"$pull": {"levels": level_object_id}}
            )
            return result.modified_count > 0 or result.matched_count > 0
        except Exception as e:
            print(f"failed to remove level from chapter: {str(e)}")
            return False
        
    def _get_chapter_name_by_sequence(self, sequence):
        """
        根據 sequence 獲取章節名稱
        
        Args:
            sequence: 章節的 sequence 值
            
        Returns:
            str: 章節名稱，若不存在則返回 None
        """
        chapter = self.chapters.find_one({"sequence": sequence})
        return chapter["name"] if chapter else None
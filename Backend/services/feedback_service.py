from typing import List, Optional
from .db_service import DatabaseService
from .image_service import ImageService
from .email_service import EmailService
from bson import ObjectId
from models import Feedback, Image
from datetime import datetime

class FeedbackService(DatabaseService):
    def __init__(self, mongo_uri: str, image_service: ImageService = None):
        super().__init__(mongo_uri)
        self.feedbacks = self.collections['feedbacks']
        self.users = self.collections['users']
        
        if image_service is not None and not isinstance(image_service, ImageService):
            raise TypeError("image_service 必須是 ImageService")
        
        self.image_service = image_service
        self.email_service = EmailService()
        
    def create_feedback(self, user_id: str, title: str, category: str, content: str, images_file: list = None) -> dict:
        try:
            user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id
            
            if category not in Feedback.CATEGORIES:
                raise ValueError(f"無效的分類: {category}")

            images = []
            if images_file and self.image_service:
                if len(images_file) > 3:
                    raise ValueError("最多只能上傳3張圖片")
                    
                for i, image_file in enumerate(images_file):
                    if image_file and image_file.filename:
                        if not ImageService._allowed_file(image_file.filename):
                            raise ValueError("不支援的圖片格式")
                        
                    public_id = f"feedback_{user_id}_{int(datetime.now().timestamp())}_{i + 1}"
                    image_result = self.image_service.upload_image(image_file, public_id, folder='feedbacks')
                    
                    images.append(Image(
                        public_id=image_result['public_id'],
                        url=image_result['url']
                    ))
                    
            feedback = Feedback(user_id, title, category, content, images)
            
            result = self.feedbacks.insert_one(feedback.to_dict())
            
            if result.inserted_id:
                return self.get_feedback(str(result.inserted_id))
            else:
                return None
                
        except Exception as e:
            if 'images' in locals():
                self._cleanup_images(images)
            print(f"Create feedback error: {str(e)}")
            raise e
            
    def get_feedback(self, feedback_id: str) -> Optional[dict]:
        try:
            feedback = self.feedbacks.find_one({"_id": ObjectId(feedback_id)})
            if feedback:
                feedback["_id"] = str(feedback["_id"])
                feedback["user_id"] = str(feedback["user_id"])
                
                user = self.users.find_one({"_id": ObjectId(feedback["user_id"])})
                if user:
                    feedback['user_info'] = {
                        'username': user['username'],
                        'email': user['email']
                    }
                    
                return feedback
            return None
        except Exception as e:
            print(f"Get feedback error: {str(e)}")
            raise
    
    def get_user_feedbacks(self, user_id: str) -> list[dict]:
        try:
            feedbacks_cursor = self.feedbacks.find({"user_id": ObjectId(user_id)})
            feedbacks = []
            
            for feedback in feedbacks_cursor:
                feedback["_id"] = str(feedback["_id"])
                feedback.pop("user_id", None)
                feedbacks.append(feedback)
            
            return feedbacks
        
        except Exception as e:
            print(f"Get user feedbacks error: {str(e)}")
            raise
    
    def get_all_feedbacks(self) -> list[dict]:
        try:
            feedbacks = self.feedbacks.find()
            result = []
            
            for feedback in feedbacks:
                feedback["_id"] = str(feedback["_id"])
                feedback["user_id"] = str(feedback["user_id"])
                if feedback["admin_id"]:
                    admin_id = feedback.pop("admin_id", None)
                    admin = self.users.find_one({"_id": admin_id})
                    feedback["admin_name"] = admin["username"] if admin else None
                    
                user = self.users.find_one({"_id": ObjectId(feedback["user_id"])})
                if user:
                    feedback["user_info"] = {
                        "username": user.get("username", ""),
                        "email": user.get("email", "")
                    }
                
                result.append(feedback)
            
            return result
        except Exception as e:
            print(f"Get all feedbacks error: {str(e)}")
            raise
    
    def _cleanup_images(self, images: List[Image]):
        """清理上傳的圖片"""
        if self.image_service:
            for image in images:
                try:
                    self.image_service.delete_image(image.public_id)
                except:
                    pass
    
    def delete_feedback(self, feedback_id: str) -> bool:
        try:
            feedback = self.get_feedback(feedback_id)
            if not feedback:
                return False
            
            if feedback.get('images') and self.image_service:
                try:
                    for image in feedback['images']:
                        public_id = image.get('public_id')
                        if public_id:
                            self.image_service.delete_image(public_id)
                            
                except Exception as e:
                    print(f"Delete images error: {str(e)}")
                    raise
            
            result = self.feedbacks.delete_one({"_id": ObjectId(feedback_id)})
            return result.deleted_count > 0
        
        except Exception as e:
            print(f"Delete feedback error: {str(e)}")
            return False
        
    def update_feedback_status(self, feedback_id: str, new_status: str, admin_id: str) -> tuple[bool, str]:
        try:
            result = self.feedbacks.update_one(
                {"_id": ObjectId(feedback_id)},
                {
                    "$set": {
                        "status": new_status,
                        "admin_id": ObjectId(admin_id),
                    }
                }
            )
            
            if result.modified_count > 0:
                return True,
            
            return False            
        except Exception as e:
            print(f"Update feedback status error: {str(e)}")
            raise e
        
    def add_reply(self, feedback_id: str, reply_content: str, admin_id: str) -> bool:
        try:
            feedback = self.get_feedback(feedback_id)
            if not feedback:
                return False
            
            result = self.feedbacks.update_one(
                {"_id": ObjectId(feedback_id)},
                {
                    "$set": {
                        "reply_content": reply_content,
                        "reply_at": datetime.now(),
                        "status": "processing",
                        "admin_id": ObjectId(admin_id)
                    }
                }
            )
            
            if result.modified_count > 0:
                return True
            
            return False
        
        except Exception as e:
            print(f"Add reply error: {str(e)}")
            return False
from datetime import datetime

from bson import ObjectId
from models import Image

class Feedback:
    CATEGORIES = {
        'bug': '錯誤回報',
        'detect': '辨識問題',
        'improvement': '改善建議',
        'other': '其他'
    }
    
    STATUS_TYPES = {
        'pending': '待處理',
        'processing': '處理中', 
        'resolved': '已解決',
        'closed': '已關閉'
    }
    
    def __init__(self, user_id, title: str, category: str, content: str, images: list = None, status: str = 'pending'):
        self.user_id = user_id
        self.title = title
        self.category = category
        self.content = content
        self.images = images if images is not None else []
        self.status = status
        self.created_at = datetime.now()
        self.admin_id = None
        self.reply_content = None
        self.reply_at = None
        
    def to_dict(self):
        return {
            "user_id": self.user_id,
            "admin_id": self.admin_id,
            "title": self.title,
            "category": self.category,
            "content": self.content,
            "status": self.status,
            "images": [img.to_dict() if isinstance(img, Image) else img for img in self.images],
            "reply_content": self.reply_content,
            "reply_at": self.reply_at,
            "created_at": self.created_at,
        }
    
    def add_reply(self, admin_id: str, reply_content: str):
        self.admin_id = ObjectId(admin_id)
        self.reply_content = reply_content
        self.reply_at = datetime.now()
        
    def update_status(self, new_status: str):
        if new_status in self.STATUS_TYPES:
            self.status = new_status
            return True
        return False
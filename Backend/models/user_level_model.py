from typing import Dict, Any, Optional

class ChapterProgress:
    def __init__(self, unlocked: bool = False, completed: bool = False):
        self.unlocked = unlocked
        self.completed = completed
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "unlocked": self.unlocked,
            "completed": self.completed
        }

class UserLevel:
    def __init__(self, user_id, highest_level: int, chapter_progress: Optional[Dict[str, ChapterProgress]] = None):
        self.user_id = user_id
        self.highest_level = highest_level
        self.chapter_progress = chapter_progress if chapter_progress else {}
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "highest_level": self.highest_level,
            "chapter_progress": {chapter: progress.to_dict() for chapter, progress in self.chapter_progress.items()}
        }
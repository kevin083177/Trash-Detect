from typing import Dict, Any, Optional

class LevelData:
    def __init__(self, score: int = 0, stars: int = 0):
        self.score = score
        self.stars = stars
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "score": self.score,
            "stars": self.stars
        }

class CompletedChapter:
    def __init__(self, remaining: int = 20, highest_score: int = 0):
        self.remaining = remaining
        self.highest_score = highest_score

    def to_dict(self) -> Dict[str, Any]:
        return {
            "remaining": self.remaining,
            "highest_score": self.highest_score
        }
        
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
    def __init__(self, user_id, highest_level: int, 
                chapter_progress: Optional[Dict[str, ChapterProgress]] = None, 
                level_progress: Optional[Dict[str, LevelData]] = None,
                completed_chapter: Optional[Dict[str, CompletedChapter]] = None):
        self.user_id = user_id
        self.highest_level = highest_level
        self.chapter_progress = chapter_progress if chapter_progress else {}
        self.level_progress = level_progress if level_progress else {}
        self.completed_chapter = completed_chapter if completed_chapter else {}
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "highest_level": self.highest_level,
            "chapter_progress": {chapter: progress.to_dict() for chapter, progress in self.chapter_progress.items()},
            "level_progress": {level: data.to_dict() for level, data in self.level_progress.items()},
            "completed_chapter": {chapter: data.to_dict() for chapter, data in self.completed_chapter.items()}
        }
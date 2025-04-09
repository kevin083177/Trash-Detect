class ChapterBannerImage:
    def __init__(self, public_id: str, url: str, thumbnail_url: str):
        self.public_id = public_id
        self.url = url
        self.thumbnail_url = thumbnail_url
        
    def to_dict(self):
        return {
            "public_id": self.public_id,
            "url": self.url,
            "thumbnail_url": self.thumbnail_url
        }

class ChapterBackgroundImage:
    def __init__(self, public_id: str, url: str, thumbnail_url: str):
        self.public_id = public_id
        self.url = url
        self.thumbnail_url = thumbnail_url
        
    def to_dict(self):
        return {
            "public_id": self.public_id,
            "url": self.url,
            "thumbnail_url": self.thumbnail_url
        }

class Chapter:
    def __init__(self, name: str, description: str, trash_requirement: int,
                 banner_image: ChapterBannerImage = None, 
                 background_image: ChapterBackgroundImage = None,
                 levels: list = None,
                 sequence: int = None):
        self.name = name
        self.levels = levels if levels is not None else []
        self.trash_requirement = trash_requirement
        self.description = description
        self.banner_image = banner_image
        self.background_image = background_image
        self.sequence = sequence
        
    def to_dict(self):
        chapter_dict = {
            'sequence': self.sequence,
            'name': self.name,
            'description': self.description,
            'trash_requirement': self.trash_requirement,
            'levels': [str(level_id) if not isinstance(level_id, str) else level_id for level_id in self.levels],
        }
        
        if self.banner_image:
            chapter_dict["banner_image"] = self.banner_image.to_dict()
            
        if self.background_image:
            chapter_dict["background_image"] = self.background_image.to_dict()
            
        return chapter_dict
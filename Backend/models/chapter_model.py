from .image_model import Image

class Chapter:
    def __init__(self, name: str, description, trash_requirement: int,
                 image: Image = None,
                 levels: list = None,
                 sequence: int = None):
        self.name = name
        self.levels = levels if levels is not None else []
        self.trash_requirement = trash_requirement
        # self.description = description
        self.image = image
        self.sequence = sequence
        
    def to_dict(self):
        chapter_dict = {
            'sequence': self.sequence,
            'name': self.name,
            # 'description': self.description,
            'trash_requirement': self.trash_requirement,
            'levels': [str(level_id) if not isinstance(level_id, str) else level_id for level_id in self.levels],
        }
        
        if self.image:
            chapter_dict["image"] = self.image.to_dict()
            
        return chapter_dict
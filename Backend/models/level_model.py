class Level:
    def __init__(self, sequence: int, chapter: str, name: str, description: str, unlock_requirement: int):
        self.sequence = sequence
        self.chapter = chapter
        self.name = name
        self.description = description
        self.unlock_requirement = unlock_requirement
        
    def to_dict(self):
        return {
            "sequence": self.sequence,
            "chapter": self.chapter,
            "name": self.name,
            "description": self.description,
            "unlock_requirement": self.unlock_requirement
        }
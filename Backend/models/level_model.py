class Level:
    def __init__(self, sequence: int, name: str, description: str, unlock_requirement: int):
        self.sequence = sequence
        self.name = name
        self.description = description
        self.unlock_requirement = unlock_requirement
        
    def to_dict(self):
        return {
            "sequence": self.sequence,
            "name": self.name,
            "description": self.description,
            "unlock_requirement": self.unlock_requirement
        }
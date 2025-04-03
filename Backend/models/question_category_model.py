from datetime import datetime

class QuestionCategory:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.questions = []
        self.created_at = None

    def to_dict(self):
        return {
            "name": self.name,
            "description": self.description,
            "questions": self.questions,
            "created_at": self.created_at
        }
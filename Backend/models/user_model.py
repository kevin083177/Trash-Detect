from datetime import datetime
from bson import ObjectId

class User:
    def __init__(self, userRole, username, email, password):
        self.userRole = userRole
        self.username = username
        self.email = email
        self.password = password
        self.money = 0
        self.profile = None
        self.verification = False
        self.trash_stats = {
            "bottles": 0,
            "containers": 0,
            "cans": 0,
            "paper": 0,
            "plastic": 0,
        }
        self.question_stats = {
            "bottles": {"total": 0, "correct": 0},
            "containers": {"total": 0, "correct": 0},
            "cans": {"total": 0, "correct": 0},
            "paper": {"total": 0, "correct": 0},
            "plastic": {"total": 0, "correct": 0},
        }
        self.last_check_in = None
        self.created_at = datetime.now()

    def to_dict(self):
        return {
            "userRole": self.userRole,
            "username": self.username,
            "email": self.email,
            "password": self.password,
            "money": self.money,
            "profile": self.profile,
            "trash_stats": self.trash_stats,
            "question_stats": self.question_stats,
            "verification": self.verification,
            "last_check_in": self.last_check_in,
            "created_at": self.created_at
        }
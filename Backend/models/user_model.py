from datetime import datetime
from bson import ObjectId

class User:
    def __init__(self, userRole, username, email, password, money):
        self.userRole = userRole
        self.username = username
        self.email = email
        self.password = password
        self.money = int(money)
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "userRole": self.userRole,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at
        }
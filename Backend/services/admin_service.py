from services import DatabaseService

class AdminService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)

import bcrypt
from models.user_model import User
from utils.token import generate_token
from services.db_service import DatabaseService
from services.record_service import RecordService

class AuthService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.users = self.collections['users'] # 查詢users資訊
        self.record_service = RecordService(mongo_uri)
        
    def login(self, email, password):
        """使用者登入"""
        user = self.users.find_one({"email": email})
        if not user:
            return None, None  # 使用者不存在
        
        if not self.verify_password(password, user['password']):
            return None, None  # 密碼錯誤
        
        try:
            # 確保 userRole 不是元組格式
            user_role = user['userRole']
            token = generate_token(str(user['_id']), user_role)
            return token, user
        except Exception as e:
            print(f"Token generation error: {str(e)}")
            return None, None
    
    def register(self, user_data):
        hashed_password = bcrypt.hashpw(
            user_data['password'].encode('utf-8'), 
            bcrypt.gensalt()
        ).decode('utf-8')  # 將 bytes 轉換為字串
        
        user = User(
            userRole=user_data['userRole'],
            username=user_data['username'],
            email=user_data['email'],
            password=hashed_password
        )
        result = self.users.insert_one(user.__dict__)
        
        self.record_service.init_record(result.inserted_id)
        
        return str(result.inserted_id)
    def logout(self, token):
        """使用者登出
        
        Args:
            token (str): 使用者的認證token
            
        Returns:
            bool: 登出是否成功
        """
        try:
            return True
        except Exception as e:
            print(f"Logout error: {str(e)}")
            return False
    def verify_password(self, plain_password, hashed_password):
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )

    def check_username_exists(self, username):
        """檢查用戶名是否已存在"""
        return self.users.find_one({"username": username}) is not None

    def check_email_exists(self, email):
        """檢查郵箱是否已存在"""
        return self.users.find_one({"email": email}) is not None
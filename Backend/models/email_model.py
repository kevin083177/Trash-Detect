from datetime import datetime, timedelta

class EmailVerification:
    def __init__(self, email: str, username: str, password: str, verification_code: str, user_role: str = "user"):
        self.email = email
        self.username = username
        self.password = password
        self.verification_code = verification_code
        self.user_role = user_role
        self.created_at = datetime.now()
        self.expires_at = datetime.now() + timedelta(minutes=5)  # 5分鐘後過期
        self.is_verified = False
        self.attempts = 0
        
    def to_dict(self):
        return {
            "email": self.email,
            "username": self.username,
            "password": self.password,
            "verification_code": self.verification_code,
            "userRole": self.user_role,
            "created_at": self.created_at,
            "expires_at": self.expires_at,
            "is_verified": self.is_verified,
            "attempts": self.attempts
        }
        
    def is_expired(self) -> bool:
        """檢查驗證碼是否已過期"""
        return datetime.now() > self.expires_at
    
    def can_attempt(self) -> bool:
        """檢查是否還能嘗試驗證"""
        return self.attempts < 5
    
    def verify_code(self, input_code: str) -> bool:
        """驗證輸入的驗證碼"""
        if self.is_expired():
            return False
        
        if not self.can_attempt():
            return False
            
        self.attempts += 1
        
        if self.verification_code == input_code:
            self.is_verified = True
            return True
        
        return False
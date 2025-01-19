from datetime import datetime, timedelta
import jwt
from config import Config

def generate_token(self, user_id):
    """生成 JWT token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=1),  # token 過期時間
        'iat': datetime.utcnow()  # token 建立時間
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')

def verify_token(self, token):
    """驗證 JWT token"""
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None  # token 已過期
    except jwt.InvalidTokenError:
        return None  # token 無效
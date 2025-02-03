import os
import jwt
from datetime import datetime, timedelta

def get_secret_key():
    return os.getenv("SECRET_KEY")

def generate_token(user_id, userRole):
    try:
        payload = {
            'user_id': str(user_id),
            'userRole': userRole,
            'exp': datetime.utcnow() + timedelta(days=1)
        }
        return jwt.encode(payload, get_secret_key(), algorithm='HS256')
    except Exception as e:
        print(f"Error generating token: {str(e)}")
        return None

def verify_token(token):
    try:
        return jwt.decode(token, get_secret_key(), algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
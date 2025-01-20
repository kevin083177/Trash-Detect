from functools import wraps
from flask import request, jsonify
from services.user_service import UserService
from config import Config
from utils.token import verify_token

user_service = UserService(Config.MONGO_URI)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({"message": "Token 格式錯誤"}), 401

        if not token:
            return jsonify({"message": "缺少 Token"}), 401

        token_data = verify_token(token)
        if not token_data:
            return jsonify({"message": "Token 無效或已過期"}), 401

        user = user_service.get_user(token_data['user_id'])
        if not user:
            return jsonify({"message": "使用者不存在"}), 401
        
        # 將用戶角色添加到請求中
        user['userRole'] = token_data['role']
        return f(user, *args, **kwargs)
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({"message": "Token 格式錯誤"}), 401

        if not token:
            return jsonify({"message": "缺少 Token"}), 401

        token_data = verify_token(token)
        if not token_data:
            return jsonify({"message": "Token 無效或已過期"}), 401

        if token_data['userRole'] != 'admin':
            return jsonify({"message": "需要管理員權限"}), 403

        user = user_service.get_user(token_data['user_id'])
        if not user:
            return jsonify({"message": "使用者不存在"}), 401

        user['userRole'] = token_data['userRole']
        return f(user, *args, **kwargs)
    
    return decorated
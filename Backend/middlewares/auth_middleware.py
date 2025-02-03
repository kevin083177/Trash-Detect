from functools import wraps
from flask import request, jsonify
from services import UserService
from config import Config
from utils import verify_token

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
        user['userRole'] = token_data['userRole']
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
            return jsonify({"message": "權限不足"}), 403

        user = user_service.get_user(token_data['user_id'])
        if not user:
            return jsonify({"message": "使用者不存在"}), 401

        user['userRole'] = token_data['userRole']
        return f(*args, **kwargs)
    
    return decorated

# def self_required(f):
#     @wraps(f)
#     def decorated(*args, **kwargs):
#         token = None
#         requested_user_id = None
       
#         # 優先從路由參數取得user_id
#         requested_user_id = kwargs.get('user_id')
       
#         if not requested_user_id:
#             try:
#                 data = request.get_json()
#                 if data and data.get('user_id'):
#                     requested_user_id = data.get('user_id')
#             except:
#                 pass
           
#         if not requested_user_id:
#             return jsonify({"message": "缺少 user_id"}), 400
            
#         if 'Authorization' in request.headers:
#             auth_header = request.headers['Authorization']
#             try:
#                 token = auth_header.split(" ")[1]
#             except IndexError:
#                 return jsonify({"message": "Token 格式錯誤"}), 401

#         if not token:
#             return jsonify({"message": "缺少 Token"}), 401

#         token_data = verify_token(token)
#         if not token_data:
#             return jsonify({"message": "Token 無效或已過期"}), 401

#         if token_data['user_id'] != requested_user_id and token_data['userRole'] != 'admin':
#             return jsonify({"message": "權限不足"}), 403

#         user = user_service.get_user(token_data['user_id'])
#         if not user:
#             return jsonify({"message": "使用者不存在"}), 401

#         user['userRole'] = token_data['userRole']
#         return f(user, *args, **kwargs)
    
#     return decorated
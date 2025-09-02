from flask import request
from services import FeedbackService, ImageService, UserService
from models import Feedback
from config import Config
from utils import verify_token

image_service = ImageService(Config.get_cloudinary_config())
feedback_service = FeedbackService(Config.MONGO_URI, image_service)
user_service = UserService(Config.MONGO_URI)

class FeedbackController:
    @staticmethod
    def create_feedback(user_id):
        try:
            title = request.form.get("title")
            category = request.form.get("category")
            content = request.form.get("content")
            
            if not all([title, category, content]):
                return {
                    "message": "缺少必要欄位： title, category, content"
                }, 400
                
            image_files = []
            
            if 'images' in request.files:
                uploaded_files = request.files.getlist('images')
                
                for idx, file in enumerate(uploaded_files):
                    
                    if file and hasattr(file, 'filename') and file.filename and file.filename.strip():
                        
                        if not image_service._allowed_file(file.filename):
                            return {
                                "message": f"圖片格式不支援: {file.filename}"
                            }, 400
                        
                        try:
                            file_content = file.read()
                            file_size = len(file_content)
                            
                            if file_size > image_service.MAX_FILE_SIZE:
                                return {
                                    "message": f"圖片 {file.filename} 大小超過限制 ({file_size} > {image_service.MAX_FILE_SIZE})"
                                }, 400
                            
                            file.seek(0)
                            
                            image_files.append(file)
                            
                        except Exception as e:
                            return {
                                "message": f"讀取圖片 {file.filename} 時出錯: {str(e)}"
                            }, 400
            
            # 檢查圖片數量限制
            if len(image_files) > 3:
                return {
                    "message": f"最多只能上傳3張圖片"
                }, 400
                
            # 建立反饋
            feedback = feedback_service.create_feedback(
                user_id,
                title,
                category,
                content,
                images_file=image_files if image_files else None
            )
            
            if feedback:
                return {
                    "message": "提交反饋成功",
                    "body": feedback
                }, 200
            else:
                return {
                    "message": "提交反饋失敗"
                }, 500
                
        except ValueError as e:
            print(f"ValueError: {str(e)}")
            return {
                "message": str(e)
            }, 400
        except Exception as e:
            print(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "message": f"伺服器錯誤(create_feedback): {str(e)}"
            }, 500
            
    
    @staticmethod
    def get_feedback(user, feedback_id):
        try:
            feedback = feedback_service.get_feedback(feedback_id)
            
            if not feedback:
                return {
                "message": "反饋不存在"  
                }, 404
                
            if user['userRole'] != 'admin' and str(feedback['user_id']) != str(user['_id']):
                return {
                    "message": "無權限訪問此反饋"
                }, 403
                       
            return {
                "message": "獲取反饋成功",
                "body": feedback
            }, 200
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_feedback): {str(e)}"
            }, 500
            
    @staticmethod
    def get_user_feedbacks(user_id):
        try:
            feedbacks = feedback_service.get_user_feedbacks(user_id)
            
            for feedback in feedbacks:
                admin_id = feedback.pop('admin_id', None)
                
                if admin_id:
                    try:
                        admin = user_service.get_user(admin_id)
                        feedback['admin_name'] = admin['username'] if admin else '未知管理員'
                    except:
                        feedback['admin_name'] = '獲取失敗'
                else:
                    feedback['admin_name'] = '未分配'
            
            return {
                "message": "獲取反饋成功",
                "body": feedbacks
            }, 200

        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_user_feedbacks): {str(e)}"
            }, 500
            
    @staticmethod
    def get_all_feedbacks():
        try:
            feedback = feedback_service.get_all_feedbacks()
            
            return {
                "message": "獲取反饋成功",
                "body": feedback
            }, 200
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_all_feedbacks): {str(e)}"
            }, 500
            
    @staticmethod
    def update_feedback_status():
        try:
            data = request.get_json()
            
            required_fields = ['feedback_id', 'status']
            missing_fields = [field for field in required_fields if not data.get(field)]            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
                
            feedback_id = data['feedback_id']
            status = data['status']            
            
            if status not in Feedback.STATUS_TYPES:
                return {
                    "message": "無效的狀態"
                }, 400
            
            feedback = feedback_service.get_feedback(feedback_id)
            
            if not feedback:
                return {
                    "message": "找不到回饋訊息"
                }, 404
            
            auth_header = request.headers.get('Authorization')
            token = auth_header.split(' ')[1]
            token_data = verify_token(token)
            admin_id = token_data['user_id']
            
            success = feedback_service.update_feedback_status(feedback_id, status, admin_id)
            
            if success:
                return {
                    "message": "成功修改回饋狀態"
                }, 200
                
            return {
                "message": "修改回饋狀態失敗"
            }, 400
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(update_feedback_status): {str(e)}"
            }, 500
            
    @staticmethod
    def add_reply():
        try:
            data = request.get_json()
            
            required_fields = ['feedback_id', 'reply_content']
            missing_fields = [field for field in required_fields if not data.get(field)]            
            if missing_fields:
                return {
                    "message": f"缺少: {', '.join(missing_fields)}",
                }, 400
                
            feedback_id = data['feedback_id']
            reply_content = data['reply_content']     
            
            feedback = feedback_service.get_feedback(feedback_id)
            
            if not feedback:
                return {
                    "message": "找不到回饋訊息"
                }, 404
            
            auth_header = request.headers.get('Authorization')
            
            token = auth_header.split(' ')[1]
            token_data = verify_token(token)
            
            admin_id = token_data['user_id']
            
            result = feedback_service.add_reply(feedback_id, reply_content, admin_id)
            
            if result:
                return {
                    "message": "新增回應成功"
                }, 200
                
            return {
                "message": "新增回應失敗"
            }, 400
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(add_reply): {str(e)}"
            }, 500
            
    @staticmethod
    def delete_feedback():
        try:
            data = request.get_json()
            if 'feedback_id' not in data:
                return {
                    "message": "缺少: feedback_id"
                }, 400
                
            feedback_id = data['feedback_id']
        
            success = feedback_service.delete_feedback(feedback_id)
            
            if success:
                return {
                    "message": "刪除回饋訊息成功"
                }, 200
                
            return {
                "message": "找不到回饋訊息"
            }, 404
                
        except Exception as e:
            return {
                "message": f"伺服器錯誤(delete_feedback): {str(e)}"
            }, 500
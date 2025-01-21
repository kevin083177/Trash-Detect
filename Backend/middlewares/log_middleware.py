from functools import wraps
from flask import request
from datetime import datetime
import json
from utils.logger_config import logger

def log_request(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # 獲取請求開始時間
        start_time = datetime.now()
        
        # 準備請求日誌數據
        request_data = {
            'method': request.method,
            'url': request.url,
            'path': request.path,
        }

        # 獲取請求體（如果有）
        if request.is_json:
            try:
                request_data['body'] = request.get_json()
            except Exception as e:
                request_data['body'] = str(e)
        
        # 記錄請求信息
        logger.http(f"Request: {json.dumps(request_data, ensure_ascii=False)}")

        try:
            # 執行原始請求
            response = f(*args, **kwargs)
            
            # 計算響應時間
            duration = (datetime.now() - start_time).total_seconds()

            # 準備響應日誌數據
            response_data = {
                'status_code': response[1] if isinstance(response, tuple) else 200,
                'duration': f"{duration:.3f}s"
            }

            # 記錄響應信息
            logger.info(f"Response: {json.dumps(response_data, ensure_ascii=False)}")
            
            return response

        except Exception as e:
            # 記錄錯誤信息
            logger.error(f"Error: {str(e)}", exc_info=True)
            return {
                "message": "伺服器錯誤",
                "error": str(e)
            }, 500

    return decorated
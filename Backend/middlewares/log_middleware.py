from functools import wraps
from flask import request
from datetime import datetime
import json
from utils import logger

def log_request(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        start_time = datetime.now()
        
        request_data = {
            'method': request.method,
            'url': request.url,
            'path': request.path,
        }

        if request.is_json:
            try:
                request_data['body'] = request.get_json()
            except Exception as e:
                request_data['body'] = str(e)
        
        try:
            response = f(*args, **kwargs)
            
            duration = (datetime.now() - start_time).total_seconds()

            response_data = {
                'status_code': response[1] if isinstance(response, tuple) else 200,
                'duration': f"{duration:.3f}s"
            }

            logger.info(f"Response: {json.dumps(response_data, ensure_ascii=False)}")
            
            return response

        except Exception as e:
            logger.error(f"Error: {str(e)}", exc_info=True)
            return {
                "message": "伺服器錯誤",
                "error": str(e)
            }, 500

    return decorated
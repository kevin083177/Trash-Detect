from functools import wraps
from flask import request
from datetime import datetime
from utils import logger

def log_request(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        start_time = datetime.now()
        
        try:
            response = f(*args, **kwargs)
            
            status_code = response[1] if isinstance(response, tuple) else 200
            
            timestamp = start_time.strftime('%d/%b/%Y %H:%M:%S')
            
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
            if client_ip and ',' in client_ip:
                client_ip = client_ip.split(',')[0].strip()
            
            log_msg = f'{client_ip} - - [{timestamp}] "{request.method} {request.path} HTTP/1.1" {status_code} -'
            
            logger.info(log_msg)
            
            return response
            
        except Exception as e:
            timestamp = start_time.strftime('%d/%b/%Y %H:%M:%S')
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
            if client_ip and ',' in client_ip:
                client_ip = client_ip.split(',')[0].strip()
                
            log_msg = f'{client_ip} - - [{timestamp}] "{request.method} {request.path} HTTP/1.1" 500 -'
            logger.info(log_msg)
            
            logger.error(f"Error in {request.method} {request.path}: {str(e)}", exc_info=True)
            
            return {
                "message": "伺服器錯誤",
                "error": str(e)
            }, 500
    
    return decorated
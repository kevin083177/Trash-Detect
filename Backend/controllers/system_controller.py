from services import SystemInfo

class SystemController:    
    @staticmethod
    def get_system_info():
        """獲取系統資訊"""
        try:
            system_info = SystemInfo.get_all_system_info()
            
            return {
                "message": "成功獲取系統資訊",
                "body": system_info
            }, 200
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_system_info) {str(e)}"
            }, 500
from flask import request
from config import Config
from services import DailyTrashService

daily_trash_service = DailyTrashService(Config.MONGO_URI)

class DailyTrashController:
    # @staticmethod
    # def create_daily_trash():
    #     """生成每日統計 (for test)"""
    #     try:
    #         data = request.get_json()
    #         target_date = data.get('date')
            
    #         daily_trash = daily_trash_service._create_daily_trash(target_date)
            
    #         if daily_trash:
    #             return {
    #                 "message": f"成功生成 {daily_trash['date']} 的統計數據",
    #                 "body": daily_trash
    #             }, 200
    #         else:
    #             return {
    #                 "message": "生成統計數據失敗"
    #             }, 400
                
    #     except Exception as e:
    #         return {
    #             "message": f"伺服器錯誤(generate_daily_stats) {str(e)}"
    #         }, 500
            
    @staticmethod
    def get_daily_trash():
        try:
            date = request.args.get("date") # YYYY-MM-DD
            
            if not date:
                return {
                    "message": "缺少 date"
                }, 400
                
            daily_trash = daily_trash_service.get_daily_trash(date)
            
            if daily_trash:
                return {
                    "message": f"成功查詢 {daily_trash['date']} 的統計數據",
                    "body": daily_trash
                }, 200
            else:
                return {
                    "message": f"無法查詢 {daily_trash['date']} 的統計數據"
                }, 400
                
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_daily_trash) {str(e)}"
            }, 500
            
    @staticmethod
    def get_all_trash():
        try:
            result = daily_trash_service.get_all_trash()
            
            return {
                "message": f"成功獲取共 {result['summary']['total_days']} 天的統計數據",
                "body": result
            }, 200
            
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_all_trash) {str(e)}"
            }, 500
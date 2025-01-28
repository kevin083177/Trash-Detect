from flask import request

from services.record_service import RecordService
from config import Config

record_service = RecordService(Config.MONGO_URI)

class RecordController:
    @staticmethod
    def get_record_by_id(record_id):
        try:
            record = record_service.get_record_by_id(record_id)
            if record:
                record["_id"] = str(record["_id"])
                record.pop("user_id", None)
                return {
                    "message": "成功找到回收紀錄",
                    "body": record
                }, 200
            return {
                "message": "無法找到使用者"
            }, 404
        except Exception as e:
            return {
                "message": f"伺服器錯誤(get_record_by_id) {str(e)}"
            }, 500
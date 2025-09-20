from .db_service import DatabaseService
from typing import Optional
from datetime import datetime
from models import DailyTrash

class DailyTrashService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.users = self.collections['users']
        self.daily_trash = self.collections['daily_trash']
        
    def _create_daily_trash(self, target_date: Optional[str] = None):
        """生成指定日期的每日垃圾統計
        
        Args:
            target_date: 目標日期 (YYYY-MM-DD)，如果為 None 則使用今天
            
        Returns:
            dict: 生成的統計數據
        """
        
        try:
            if not target_date:
                target_date = datetime.now().strftime("%Y-%m-%d")
            
            existing_stats = self.daily_trash.find_one({"date": target_date})
            if existing_stats:
                existing_stats["_id"] = str(existing_stats["_id"])
                return existing_stats
            
            total_trash = self._calculate_all_users_trash()
            
            daily_trash = DailyTrash(
                date = target_date,
                plastic = total_trash.get("plastic"),
                paper = total_trash.get("paper"),
                cans = total_trash.get("cans"),
                bottles = total_trash.get("bottles"),
                containers = total_trash.get("containers"),
            )
            
            result = self.daily_trash.insert_one(daily_trash.to_dict())
            
            if result.inserted_id:
                created_stats = self.daily_trash.find_one({"_id": result.inserted_id})
                created_stats["_id"] = str(created_stats["_id"])
                
                return created_stats

            return None
        
        except Exception as e:
            print(f"Create Daily Trash Error: {str(e)}")
            raise
        
    def _update_daily_trash(self, trash_type:str, count: int, target_date: Optional[str] = None):
        """更新每日垃圾統計中的特定類別數量
        
        Args:
            trash_type: 垃圾類型 (plastic, paper, cans, bottles, containers)
            count: 增加的數量
            target_date: 目標日期，如果為 None 則是今天
            
        Returns:
            bool: 更新是否成功
        """
        try:
            if not target_date:
                target_date = datetime.now().strftime("%Y-%m-%d")
                
            valid_types = ['plastic', 'paper', 'cans', 'bottles', 'containers']
            if trash_type not in valid_types:
                raise ValueError(f"無效的垃圾類型: {trash_type}")
            
            if not self.daily_trash.find_one({"date": target_date}):
                self._create_daily_trash(target_date)
            
            update_result = self.daily_trash.update_one(
                {"date": target_date},
                {
                    "$inc": {trash_type: count},
                }
            )
            
            if update_result.modified_count > 0:
                updated_record = self.daily_trash.find_one({"date": target_date})
                new_total = (
                    updated_record.get("plastic", 0) +
                    updated_record.get("paper", 0) +
                    updated_record.get("cans", 0) +
                    updated_record.get("bottles", 0) +
                    updated_record.get("containers", 0)
                )
                
                self.daily_trash.update_one(
                    {"date": target_date},
                    {"$set": {"total": new_total}}
                )
                
                return True
            
            return False
        
        except Exception as e:
            print(f"Update Daily Trash Error: {str(e)}")
            raise
        
    def _calculate_all_users_trash(self):
        try:
            pipeline = [
                {
                    "$group": {
                        "_id": None,
                        "plastic": {"$sum": "$total_trash.plastic"},
                        "paper": {"$sum": "$total_trash.paper"},
                        "cans": {"$sum": "$total_trash.cans"},
                        "bottles": {"$sum": "$total_trash.bottles"},
                        "containers": {"$sum": "$total_trash.containers"}
                    }
                }
            ]
            
            result = list(self.users.aggregate(pipeline))
            
            if result:
                stats = result[0]
                stats.pop("_id", None)
                return stats
            
            return {
                "plastic": 0,
                "paper": 0,
                "cans": 0,
                "bottles": 0,
                "containers": 0
            }
        
        except Exception as e:
            print(f"Calculate All Users Trash Stats Error: {str(e)}")
            raise
        
    def get_daily_trash(self, target_date: str):
        """獲取指定日期的統計數據
        
        Args:
            target_date: 目標日期 (YYYY-MM-DD)
            
        Returns:
            dict: 統計數據，如果不存在則返回 None
        """
        try:
            trash = self.daily_trash.find_one({"date": target_date})
            if trash:
                trash["_id"] = str(trash["_id"])
                return trash
            
        except Exception as e:
            print(f"Get Daily Trash Error: {str(e)}")
            raise
    
    def auto_create_daily_trash(self):
        """自動生成今日統計"""
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            return self._create_daily_trash(today)
            
        except Exception as e:
            print(f"Auto Generate Daily Stats Error: {str(e)}")
            raise
        
    def get_all_trash(self):
        """取得全部統計數據"""
        try:
            all_trash = list(self.daily_trash.find().sort("date", 1))
            
            for trash in all_trash:
                trash["_id"] = str(trash["_id"])
            
            if not all_trash:
                return {
                    "daily_trash": [],
                    "summary": {
                        "total_days": 0,
                        "date_range": {},
                        "totals": {
                            "plastic": 0,
                            "paper": 0,
                            "cans": 0,
                            "bottles": 0,
                            "containers": 0,
                            "active_users": 0,
                            "new_registered": 0
                        }
                    }
                }
                
            total_days = len(all_trash)
            
            totals = {
                "plastic": sum(stat.get("plastic") for stat in all_trash),
                "paper": sum(stat.get("paper") for stat in all_trash),
                "cans": sum(stat.get("cans") for stat in all_trash),
                "bottles": sum(stat.get("bottles") for stat in all_trash),
                "containers": sum(stat.get("containers") for stat in all_trash),
                "active_users": sum(stat.get("active_users") for stat in all_trash),
                "new_registered": sum(stat.get("new_registered") for stat in all_trash)
            }
            
            date_range = {
                "start_date": all_trash[0]["date"],
                "end_date": all_trash[-1]["date"]
            }
            
            summary = {
                "total_days": total_days,
                "date_range": date_range,
                "totals": totals
            }
            
            return {
                "daily_stats": all_trash,
                "summary": summary
            }
        except Exception as e:
            print(f"Get All Trash Error: {str(e)}")
            raise
        
    def _update_new_registered(self):
        try:
            date = datetime.now().strftime("%Y-%m-%d")
            
            if not self.daily_trash.find_one({"date": date}):
                self._create_daily_trash(date)
            
            update_result = self.daily_trash.update_one(
                {"date": date},
                {"$inc": {"new_registered": 1}}
            )
            
            return update_result.modified_count > 0
        
        except Exception as e:
            print(f"Update New Registered Error: {str(e)}")
            raise
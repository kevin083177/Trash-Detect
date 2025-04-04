from services import DatabaseService
from models import QuestionCategory
from datetime import datetime
from bson import ObjectId

class QuestionCategoryService(DatabaseService):
    def __init__(self, mongo_uri: str):
        super().__init__(mongo_uri)
        self.questions = self.collections['questions']
        self.question_categories = self.collections['question_categories']

    def add_category(self, category_data: dict) -> dict:
        """新增題目類別"""
        try:
            category = {
                "name": category_data["name"],
                "description": category_data["description"],
                "questions": [],
                "created_at": datetime.now()
            }
            
            result = self.question_categories.insert_one(category)
            return result.inserted_id
        except Exception as e:
            print(f"add question's category error: {str(e)}")
            raise
    
    def delete_category(self, category_name: str) -> bool:
        """刪除題目類別"""
        try:
            result = self.question_categories.delete_one({"name": category_name})
            return result.deleted_count > 0
        except Exception as e:
            print(f"delete question's category error: {str(e)}")
            raise 
    
    def update_category(self, category_id: str, category_data: dict) -> bool:
        """更新題目類別"""
        try:
            # 獲取原始類別資訊
            original_category = self.question_categories.find_one({"_id": ObjectId(category_id)})
            if not original_category:
                return False  # 類別不存在
                
            # 如果類別名稱有變更，需要更新所有使用該類別的題目
            if "name" in category_data and category_data["name"] != original_category["name"]:
                original_name = original_category["name"]
                
                # 更新類別
                result = self.question_categories.update_one(
                    {"_id": ObjectId(category_id)},
                    {"$set": category_data}
                )
                
                # 如果有成功更新類別名稱，還需要更新所有使用該類別的題目
                if result.modified_count > 0:
                    # 更新所有相關題目的類別名稱
                    questions = self.questions.update_many(
                        {"category": original_name},
                        {"$set": {"category": category_data["name"]}}
                    )
                
                return questions.modified_count
            else:
                # 如果沒有要更改名稱，直接更新其他欄位
                result = self.question_categories.update_one(
                    {"_id": ObjectId(category_id)},
                    {"$set": category_data}
                )
                return result.modified_count > 0
                
        except Exception as e:
            print(f"update category error: {str(e)}")
            raise
    
    def get_all_categories(self) -> list:
        """獲取所有題目分類"""
        try:
            categories = list(self.question_categories.find())
            
            for category in categories:
                # 將 _id 轉換為字符串
                category['_id'] = str(category['_id'])
                
                # 移除 questions 欄位，避免 ObjectId 序列化問題
                if 'questions' in category:
                    category.pop('questions', None)
                
            return categories
            
        except Exception as e:
            print(f"get all question's category error: {str(e)}")
            raise
    
    def get_category_names(self) -> list:
        """獲取所有題目分類名稱列表"""
        try:
            categories = self.question_categories.find()
            # 只提取每個類別的名稱
            category_names = [category["name"] for category in categories]
            return category_names
            
        except Exception as e:
            print(f"get category names error: {str(e)}")
            raise
    
    def _check_category_exists(self, category_name: str) -> bool:
        """檢查題目類別是否存在"""
        try:
            category = self.question_categories.find_one({"name": category_name})
            return category is not None
        except Exception as e:
            print(f"check question's category exists error: {str(e)}")
            raise
        
    def _find_all_labels(self) -> list:
        """獲取所有題目分類標籤
        
        Returns:
            list: 題目分類標籤列表 [塑膠, 紙類, 紙容器, 寶特瓶, 鐵鋁罐]
        """
        try:
            categories = self.question_categories.find()
            labels = [category["name"] for category in categories]
            return labels
        except Exception as e:
            print(f"find all question's category error: {str(e)}")
            raise
        
    def _add_question_to_category(self, category_name: str, question_id: ObjectId) -> bool:
        """將題目添加到指定的題目分類"""
        try:
            result = self.question_categories.update_one(
                {"name": category_name},
                {"$push": {"questions": question_id}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"add question to category error: {str(e)}")
            raise
        
    def _remove_question_from_category(self, question_category: str, question_id: str) -> bool:
        """從題目分類中移除題目"""
        try:
            result = self.question_categories.update_one(
                {"name": question_category},
                {"$pull": {"questions": ObjectId(question_id)}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"remove question from category error: {str(e)}")
            raise
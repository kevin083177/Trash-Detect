from services import DatabaseService
from datetime import datetime
from bson import ObjectId

class QuestionService(DatabaseService):
    def __init__(self, mongo_uri: str):
        super().__init__(mongo_uri)
        self.questions = self.collections['questions']
    
    def get_question(self, question_id: str) -> dict:
        """獲取題目"""
        try:
            question = self.questions.find_one({"_id": ObjectId(question_id)})
            if question:
                question['_id'] = str(question['_id'])
                return question
            else:
                return None
        except Exception as e:
            print(f"get question error: {str(e)}")
            raise
    
    def get_question_by_category(self, category: str) -> list:
        """根據類別獲取題目"""
        try:
            questions = list(self.questions.find({"category": category}))
            for question in questions:
                question['_id'] = str(question['_id'])
            return questions
        except Exception as e:
            print(f"get question by category error: {str(e)}")
            raise
    
    def add_question(self, question_data: dict) -> ObjectId:
        """新增題目"""
        try:
            question = {
                "content": question_data["content"],
                "category": question_data["category"],
                "options": question_data["options"],
                "correct_answer": question_data["correct_answer"],
                "created_at": datetime.now()
            }
            
            # 插入問題並獲取結果
            result = self.questions.insert_one(question)
                    
            return result.inserted_id
        except Exception as e:
            print(f"add question error: {str(e)}")
            raise
        
    def delete_question(self, question_id: str) -> bool:
        """刪除題目"""
        try:
            result = self.questions.delete_one({"_id": ObjectId(question_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"delete question error: {str(e)}")
            raise
    
    def update_question(self, question_id: str, question_data: dict) -> bool:
        """更新題目"""
        try:
            result = self.questions.update_one(
                {"_id": ObjectId(question_id)},
                {"$set": question_data}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"update question error: {str(e)}")
            raise
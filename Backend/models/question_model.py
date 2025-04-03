from datetime import datetime
class Question:
    def __init__(self, content, options, correct_answer):
        """題目模型
        
        Args:
            content: 題目內容
            options: 選項列表 [{"id": "A", "text": "選項A"}, ...]
            correct_answer: 正確答案ID (例如 "A")
            created_at: 創建時間
        """
        self.content = content
        self.options = options
        self.correct_answer = correct_answer
        self.created_at = datetime.now()
        
    def to_dict(self):
        """轉換為字典格式"""
        return {
            "content": self.content,
            "options": self.options,
            "correct_answer": self.correct_answer,
            "created_at": self.created_at
        }
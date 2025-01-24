class Purchase:
    def __init__(self, user_id, product):
        self.user_id = user_id
        self.product = [] if product is None else product # 以陣列儲存
        
    def to_dict(self):
        return {
            "user_id": self.user_id,
            "product": self.product,
        }
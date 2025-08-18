class Purchase:
    def __init__(self, user_id, product, voucher):
        self.user_id = user_id
        self.product = [] if product is None else product
        self.voucher = [] if voucher is None else voucher
        
    def to_dict(self):
        return {
            "user_id": self.user_id,
            "product": self.product,
            "voucher": self.voucher
        }
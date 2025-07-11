class Image:
    def __init__(self, public_id: str, url: str):
        self.public_id = public_id
        self.url = url
        
    def to_dict(self):
        return {
            "public_id": self.public_id,
            "url": self.url,
        }
        
    @classmethod
    def from_dict(cls, data):
        return cls(
            public_id=data["public_id"],
            url=data["url"],
        )
class Image:
    def __init__(self, public_id: str, url: str, thumbnail_url: str):
        self.public_id = public_id
        self.url = url
        self.thumbnail_url = thumbnail_url
        
    def to_dict(self):
        return {
            "public_id": self.public_id,
            "url": self.url,
            "thumbnail_url": self.thumbnail_url
        }
        
    @classmethod
    def from_dict(cls, data):
        return cls(
            public_id=data["public_id"],
            url=data["url"],
            thumbnail_url=data["thumbnail_url"]
        )
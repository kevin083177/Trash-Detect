class DetectionResult:
    def __init__(self, category, confidence, bbox):
        self.category = category
        self.confidence = confidence
        self.bbox = bbox

    def to_dict(self):
        return {
            "category": self.category,
            "confidence": self.confidence,
            "bbox": self.bbox
        }


class DetectionResponse:
    def __init__(self, detections, image_size):
        self.detections = detections
        self.image_size = image_size

    def to_dict(self):
        return {
            "detections": [d.to_dict() for d in self.detections],
            "image_size": self.image_size
        }
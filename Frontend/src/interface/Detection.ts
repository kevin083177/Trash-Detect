export interface DetectionResult {
  detections: Detection[];
  image_size: { width: number; height: number };
  timestamp: number;
}

export interface Detection {
  category: string;
  confidence: number;
  bbox: number[];
}

export interface ResultDisplayProps {
  detections: Detection[];
}
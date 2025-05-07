from ultralytics import YOLO

# 載入模型（請填入正確路徑）
model = YOLO(r"C:\Users\我想划船\Downloads\weights-20250501T050156Z-001\weights\best.pt")

# 匯出為 ONNX 格式
model.export(format='onnx')

# 匯出為 TFLite 格式
model.export(format='tflite')

print("模型已成功轉換為 ONNX 與 TFLite 格式。")
import pytest
from ultralytics import YOLO
from PIL import Image, ImageDraw, ImageFont

def test_yolo_model_prediction():
    model = YOLO(r"C:\trash_yolo_1\ultralytics\runs\detect\my_roboflow_model_1\weights\best.pt")
    image_path = r"C:\Users\我想划船\Desktop\專題垃圾圖片\垃圾圖片\寶特瓶\879504-MESSAGEIMAGE_1708667040420.jpg"
    image = Image.open(image_path)
    results = model(image)
    boxes = results[0].boxes

    # 畫框
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    for box in boxes:
        # 使用 xyxy 而不是 xy
        xyxy = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
        conf = float(box.conf[0])  # 信心分數
        cls = int(box.cls[0])  # 類別索引
        cls_name = model.names[cls]  # 從模型取得類別名稱
        
        label = f"{cls_name} {conf*100:.1f}%"
        draw.rectangle(xyxy, outline="red", width=3)
        draw.text((xyxy[0], xyxy[1]), label, fill="yellow", font=font)

    # 儲存結果圖片
    output_path = "prediction_result.jpg"
    image.save(output_path)
    print(f"已輸出結果到 {output_path}")

    # 驗證
    predictions = boxes.data.tolist()
    assert predictions is not None
    assert len(predictions) > 0
    assert all(isinstance(pred, list) for pred in predictions)
    
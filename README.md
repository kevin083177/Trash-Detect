# Trash Detect App

垃圾檢測應用程式，用於自動識別和分類垃圾類型。

## 後端 (Backend)

### 技術架構

- Web Framework: Flask
- 資料庫: MongoDB
- 認證機制: JWT (JSON Web Token)
- 日誌系統: Python logging

### API 文件

詳細的 API 端點說明請參考: [API Documentation](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/API.md)

主要功能包括:
- 使用者認證與授權
- 歷史記錄查詢
- 系統管理功能

### 中介軟體文件

中介軟體相關說明請參考: [Middleware Documentation](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md)

實作功能包括:
- 請求日誌記錄
- JWT 驗證
- 錯誤處理

### 安裝與使用說明

1. 安裝相依套件
```bash
pip install -r requirements.txt
```

2. 環境設定
建立 `.env` 檔案並設定以下參數:

```bash
# MongoDB 設定
MONGO_USERNAME="使用者名稱"     # MongoDB 連線用戶名
MONGO_PASSWORD="密碼"          # MongoDB 連線密碼
MONGO_HOST="主機位址"          # MongoDB 主機位址 (例如: localhost 或雲端服務位址)
DB_NAME="資料庫名稱"           # MongoDB 資料庫名稱
MONGO_OPTIONS="連線選項"       # MongoDB 連線選項 (例如: retryWrites=true&w=majority)

# 日誌設定
LogPath="logs"                # 日誌檔案儲存路徑

# JWT 設定
SECRET_KEY="密鑰"             # JWT 加密用密鑰，建議使用強密碼

# Flask 設定
PORT="埠號"                   # 伺服器監聽埠號 (例如: 8000)
FLASK_ENV="production"        # 執行環境 (development/production)
```

3. 切換至後端目錄
```bash
cd ./Backend/
```

4. 啟動伺服器
```bash
python app.py
```

### 錯誤處理

系統錯誤代碼說明:
- 200: 請求成功
- 400: 請求參數錯誤
- 401: 未授權訪問
- 403: 禁止訪問(權限)
- 404: 資源不存在
- 500: 伺服器內部錯誤


## 前端 (Frontend)


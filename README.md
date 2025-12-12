# Garbi App
一款結合 AI 垃圾識別與環保教育的互動式應用程式

<img src="https://raw.githubusercontent.com/kevin083177/Trash-Detect/refs/heads/main/Frontend/src/assets/images/icon.png" alt="Logo" width="300" height="300">

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

### 中介文件

中介相關說明請參考: [Middleware Documentation](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md)

實作功能包括:
- 請求日誌記錄
- JWT 驗證
- 錯誤處理

### 一鍵部屬

1. 安裝並啟動 [Docker Desktop](https://www.docker.com/products/docker-desktop/)

2. 設置環境變數 (.env)

3. 啟動
    - 部屬至伺服器端
        ```bash
        docker-compose up --build -d
        ```
    - 本地端啟動 (包含客戶端)
        > [!IMPORTANT]
        > 請確認 `CURRENT_IP` 是否為主機之 IP (非 localhost)
        > 並請將手機與主機進行 `adb` 連線
        

        ```bash
        ./setup.sh
        ```

    > [!Note] 獲取主機 IP 方法
    > \*# macOS
    > ipconfig getifaddr en0
    > \*# Linux
    > hostname -I | awk '{print $1}'
    > \*# Windows
    > ipconfig \*# find ipv4

### 錯誤處理

系統錯誤代碼說明:
- 200: 請求成功
- 400: 請求參數錯誤
- 401: 未授權訪問
- 403: 禁止訪問(權限)
- 404: 資源不存在
- 500: 伺服器內部錯誤

## 前端 (Frontend)

### 環境需求
- Node.js 22+
- npm or yarn
- Expo CLI
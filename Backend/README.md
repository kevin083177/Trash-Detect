# Backend Architecture

+ ## Application
    - ### `app.py`: 應用程式入口
    - ### `config.py`: 應用程式設定
    
+ ## Controllers(控制器)
    - 負責使用者互動，在收到使用者指令後，將結果回覆給使用者，回應內容為 `code`、`message`、`body`
        * ### `auth_controller`: 登入與註冊系統控制器
        * ### `user_controller`: 使用者控制器

+ ## Routes(路由層)
    - 負責管理 API 端點與 URL 路徑配置
        * ### `auth_route`: 處理認證相關路由
        * ### `user_route`: 處理使用者相關路由

+ ## Services(服務層)
    - 應用程式的業務邏輯、處理數據處理與業務規則
        * ### `auth_service`: 認證相關的業務邏輯
        * ### `user_service`: 使用者相關的業務邏輯
        * ### `record_service`: 使用者回收記錄相關的業務邏輯
        * ### `db_service`: 數據庫操作服務

+ ## Logs(紀錄)
    - 伺服器的運行記錄、API的Response與Request
    - 按日期組織的日誌文件（例如：2025-01-22-18.log）
    - 用於追蹤系統行為與調適問題

+ ## Middlewares(中介層)
    - 處理請求在到達路由處理器之前的中間處理邏輯
        * ### `auth_middleware`: 認證驗證中介
        * ### `log_middleware`: 日誌記錄中介

+ ## Models(模型)
    - 定義數據結構和數據庫模式
        * ### `user_model`: 使用者數據結構
        * ### `record_model`: 回收記錄數據結構

+ ## Utils(工具)
    - 各種通用功能和輔助工具
        * ### `token`: 生成、驗證 JWT token
        * ### `reloader`: 伺服器重新加載設定工具
        * ### `logger_config`: 日誌配置工具

+ ## Configuration Files
    - ### `.env.example`: 環境變數範例文件
    - ### `.gitignore`: Git 忽略文件配置
    - ### `requirement.txt`: Python 套件依賴清單

+ ## [API呼叫範例](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/API.md)
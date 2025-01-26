# Backend Server api endpoint

## Middleware
+ ### Auth
    + [**token_required**](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md#token_required): 驗證 API 請求是否包含有效的 JWT token，確保用戶已登入
    + [**admin_required**](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md#admin_required): 確認用戶是否具有管理員權限，僅允許管理員訪問特定功能
    + [**self_required**](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md#self_required): 驗證請求的用戶是否為擁有者，只允許用戶操作自己的資料
+ ### Log
    + [**log_request**](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md#log_request): 記錄 API 請求的資訊，包含請求方法、路徑、狀態碼等

## Auth

### Login
+ **URL**
    + `POST auth/login`
+ #### Request
    Body:
    ```json
    {
        "email": "test123@gmail.com",
        "password": "123456",
    }
    ```
+ #### Response
    - 200
    ```json
    {
        "body": {
            "token": "token",
            "user": {
                "_id": "67924db047f2215a859e005c",
                "created_at": "Thu, 23 Jan 2025 14:09:52 GMT",
                "email": "test123@gmail.com",
                "userRole": "user",
                "username": "test123"
            }
        },
        "message": "登入成功"
    }
    ```
    - 400
    ```json
    {
        "message": "電子郵件或密碼錯誤"
    }
    ```
    - 401
    ```json
    {
        "message": "電子郵件或密碼錯誤"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(login) {error}"
    }
    ```

### Register
+ **URL**
    + `POST auth/register`
+ #### Request
    Body:
    ```json
    {
        "username": "test123",
        "password": "123456",
        "email": "test123@gmail.com",
        "userRole": "user"
    }
    ```
+ #### Response
    - 200
    ```json
    {
        "body": {
            "_id": "67924db047f2215a859e005c",
            "created_at": "Thu, 23 Jan 2025 14:09:52 GMT",
            "email": "test123@gmail.com",
            "userRole": "user",
            "username": "test123"
        },
        "message": "註冊成功"
    }
    ```
    - 400
    ```json
    {
        "message": "缺少username / password / email / userRole資料"
    }
    ```
    - 409
    ```json
    {
        "message": "使用者名稱已存在 / 電子郵件已被註冊"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(register) {error}"
    }
    ```

### Logout
+ **URL**
    + `POST auth/logout`
+ #### Request
    Headers:
    ```json
    {
        "Authorization": "Bearer token" 
    }
    ```
+ #### Response
    - 200
    ```json
    {
        "message": "登出成功"
    }
    ```
    - 401
    ```json
    {
        "message": "Token 格式錯誤 / 缺少 Token / Token 無效或已過期 / 使用者不存在"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(logout) {error}"
    }
    ```
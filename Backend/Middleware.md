# Backend Server Middleware

## Auth

### token_required
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
    ```

    - 401
    ```json
    {
        "message": "Token 格式錯誤 / 缺少 Token / Token 無效或已過期 / 使用者不存在"
    }
    ```
### admin_required
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
    ```
    
    - 401
    ```json
    {
        "message": "Token 格式錯誤 / 缺少 Token / Token 無效或已過期 / 使用者不存在"
    }
    ```
    
    - 403
    ```json
    {
        "message": "權限不足
    }
    ```

### self_required
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
    ```
    
    - 401
    ```json
    {
        "message": "Token 格式錯誤 / 缺少 Token / Token 無效或已過期 / 使用者不存在"
    }
    ```
    
    - 403
    ```json
    {
        "message": "權限不足
    }
    ```
## Log
### log_request
記錄 API 請求與響應的中間件裝飾器
**功能:**
- 記錄請求資訊：方法、URL、路徑、請求體
- 追蹤響應時間與狀態碼
- 記錄錯誤資訊 (如果發生)

**日誌格式:**
```json
// 請求日誌
{
 "method": "POST",
 "url": "http://example.com/api/v1/users",
 "path": "/api/v1/users",
 "body": "{request data}"
}

// 響應日誌 
{
 "status_code": 200,
 "duration": "0.123s"
}

// 錯誤日誌
{
 "error": "錯誤訊息",
 "status_code": 500
}
```
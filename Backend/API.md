# Backend Server api endpoint

## Middleware
+ ### Auth
    + [**token_required**](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md#token_required): 驗證 API 請求是否包含有效的 JWT token，確保用戶已登入
    + [**admin_required**](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md#admin_required): 確認用戶是否具有管理員權限，僅允許管理員訪問特定功能
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
            "last_check_in": null,
            "money": 0,
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

## Users
+ **For all Users endpoints with [token_required](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md#token_required) middleware.**
### Get User
+ **URL**
    + `GET users/<user_id>`
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
        "message": "成功找到使用者",
        "body": {
            "_id": "67936880fe029c9249bb9021",
            "created_at": "Fri, 24 Jan 2025 10:16:32 GMT",
            "email": "test123@gmail.com",
            "money": 500,
            "userRole": "user",
            "username": "test123"
        }
    }
    ```
    - 401
    - 500
    ```json
    {
        "message": "伺服器錯誤(get_user) {error}"
    }
    ```

### Update User
+ **URL**
    + `PUT users/update`
+ #### Request
    Headers:
    ```json
    {
        "Authorization": "Bearer token" 
    }
    ```
    Body:
    ```json
    {
        "username": "test1234",
        "email": "test1234@gmail.com",
        "password": "123456"
    }
+ #### Response
    - 200
    ```json
    {
        "message": "使用者資料更新成功",
        "body": {
            "_id": "67a6f1e103e184aefa53767f",
            "created_at": "Sat, 08 Feb 2025 13:55:45 GMT",
            "email": "test1234@gmail.com",
            "last_check_in": "Sun, 09 Feb 2025 16:29:43 GMT",
            "money": 200,
            "userRole": "user",
            "username": "test1234"
        }
    }
    ```
    - 401
    - 404
    ```json
    {
        "message": "無法找到使用者"
    }
    ```
    - 409
    ```json
    {
        "message": "電子郵件已被使用 / 使用者名稱已被使用"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(update_user) {error}"
    }
    ```

### Get User Record
+ **URL**
    + `GET users/record/<user_id>`
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
        "message": "成功找到使用者回收紀錄",
        "body": {
            "_id": "679871cba2285a8eb90d351d",
            "bottles": 0,
            "cans": 0,
            "containers": 0,
            "paper": 0,
            "plastic": 0
        }
    }
    ```
    - 401
    - 404
    ```json
    {
        "message": "無法找到使用者"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(get_user_record) {error}"
    }
    ```

### Add User Money
+ **URL**
    + `PUT users/money/add`
+ #### Request
    Headers:
    ```json
    {
        "Authorization": "Bearer token" 
    }
    ```
    Body:
    ```json
    {
        "user_id": "679871cba2285a8eb90d351c",
        "money": 100
    }
    ```
+ #### Response
    - 200
    ```json
    {
        "message": "金錢更新成功",
        "body": {
            "_id": "679871cba2285a8eb90d351c",
            "created_at": "Tue, 28 Jan 2025 05:57:31 GMT",
            "email": "test123@gmail.com",
            "money": 100,
            "userRole": "user",
            "username": "test123"
        },
    }
    ```
    - 400
    ```json
    {
        "message": "缺少 money / user_id"
    }
    ```
    - 401
    - 404
    ```json
    {
        "message": "無法找到使用者"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(add_money) {error}"
    }
    ```

### Subtract User Money
+ **URL**
    + `PUT users/money/subtract`
+ #### Request
    Headers:
    ```json
    {
        "Authorization": "Bearer token" 
    }
    ```
    Body:
    ```json
    {
        "user_id": "679871cba2285a8eb90d351c",
        "money": 50
    }
    ```
+ #### Response
    - 200
    ```json
    {
        "message": "金錢更新成功",
        "body": {
            "_id": "679871cba2285a8eb90d351c",
            "created_at": "Tue, 28 Jan 2025 05:57:31 GMT",
            "email": "test123@gmail.com",
            "money": 50,
            "userRole": "user",
            "username": "test123"
        },
    }
    ```
    - 400
    ```json
    {
        "message": "缺少 money / user_id"
    }
    ```
    - 401
    - 404
    ```json
    {
        "message": "無法找到使用者"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(subtract_money) {error}"
    }
    ```

### Get User Record by token
+ **URL**
    + `GET users/record`
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
        "message": "成功找到使用者回收紀錄",
        "body": {
            "_id": "67a6f1e103e184aefa537680",
            "bottles": 0,
            "cans": 0,
            "containers": 0,
            "paper": 0,
            "plastic": 0
        }
    }
    ```
    - 401
    - 404
    ```json
    {
        "message": "無法找到回收紀錄"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(get_record_by_user) {error}"
    }
    ```

### Daily Check In
+ **URL**
    + `POST users/checkIn`
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
        "message": "簽到成功",
        "body": {
            "_id": "67a6f1e103e184aefa53767f",
            "created_at": "Sat, 08 Feb 2025 13:55:45 GMT",
            "email": "test123@gmail.com",
            "last_check_in": "Sat, 08 Feb 2025 19:55:18 GMT",
            "money": 150,
            "userRole": "user",
            "username": "test123"
        }
    }
    ```
    - 400
    ```json
    {
        "message": "今日已簽到"
    }
    ```
    - 401
    - 404
    ```json
    {
        "message": "無法找到使用者"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(daily_check_in) {error}"
    }
    ```

### Get Daily Check In Status
+ **URL**
    + `GET users/checkIn/status`
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
        "body": {
            "hasCheckedIn": true
        }
    }
    ```
    - 401
    - 404
    ```json
    {
        "message": "無法找到使用者"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(daily_check_in_status) {error}"
    }
    ```

## Admin
+ **For all Admin endpoints with [admin_required](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md#admin_required) middleware.**
### Delete User
+ **URL**
    + `POST admin/delete_user`
+ #### Request
    Headers:
    ```json
    {
        "Authorization": "Bearer token"
    }
    ```
    Body:
    ```json
    {
        "user_id": "67a6f1e103e184aefa53767f"
    }
    ```
+ #### Response
    - 200
    ```json
    {
        "message": "使用者與相關資料已刪除 / 使用者已刪除，但以下資料刪除失敗: users, records, purchases"
    }
    ```
    - 400
    ```json
    {
        "message": "缺少user_id"
    }
    ```
    - 401 403
    - 404
    ```json
    {
        "message": "無法找到使用者"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(delete_user) {error}"
    }
    ```

## Record
+ **For all Record endpoints with [token_required](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md#token_required) middleware.**
### Get Users' Record by record id
+ **URL**
    + `GET record/<record_id>`
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
        "message": "成功找到回收紀錄",
        "body": {
            "_id": "67a6f1e103e184aefa537680",
            "bottles": 0,
            "cans": 0,
            "containers": 0,
            "paper": 0,
            "plastic": 0
        }
    }
    ```
    - 401
    - 404
    ```json
    {
        "message": "無法找到回收紀錄"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(get_record_by_id) {error}"
    }
    ```

### Get Users' Record category count
+ **URL**
    + `GET record/<record_id>/<recycle_category>`
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
        "body": 0,
        "message": "成功取得<recycle_category>數量"
    }
    ```
    - 401
    - 404
    ```json
    {
        "message": "無法找到回收資料或分類不存在"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(get_category_count) {error}"
    }
    ```

### Add Users' Record category count
+ **URL**
    + `POST record/add`
+ #### Request
    Headers:
    ```json
    {
        "Authorization": "Bearer token"
    }
    ```
    Body:
    ```json
    {
        "category": "bottles / cans / containers / paper / plastic",
        "count": 20
    }
    ```
+ #### Response
    - 200
    ```json
    {
        "message": "成功增加 bottles 數量",
        "body": {
            "_id": "67a6f1e103e184aefa537680",
            "bottles": 20,
            "cans": 0,
            "containers": 0,
            "paper": 0,
            "plastic": 0
        }
    }
    ```
    - 400
    ```json
    {
        "message": "缺少: category / count"
    }
    ```
    - 401
    - 404
    ```json
    {
        "message": "無法找到回收資料或分類不存在"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(add_category_count) {error}"
    }
    ```
## Purchase
+ **For all Purchase endpoints with [token_required](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md#token_required) middleware.**

### Get User purchase by token
+ **URL**
    + `GET purchase/`
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
        "message": "成功找到使用者購買紀錄",
        "body": {
            "_id": "67a6f1e103e184aefa537681",
            "product": [
                {
                    "_id": "67a74cdd624a35e6891e6247",
                    "description": "這是一個測試商品",
                    "name": "測試商品",
                    "price": 0,
                    "recycle_requirement": {
                        "bottles": 20,
                        "paper": 20
                    }
                }
            ]
        }
    }
    ```
    - 401
    - 404
    ```json
    {
        "message": "無法找到購買紀錄"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(get_purchase_by_user) {error}"
    }
    ```

### Purchase product
+ **URL**
    + `POST purchase/purchase_product`
+ #### Request
    Headers:
    ```json
    {
        "Authorization": "Bearer token"
    }
    ```
    Body:
    ```json
    {
        "product_id": "67a74cdd624a35e6891e6247",
        "payment_type": "money / recycle"
    }
    ```
+ #### Response
    - 200
    ```json
    {
        "message": "購買成功",
        "body": {
            "product": {
                "_id": "67a74cdd624a35e6891e6247",
                "description": "這是一個測試商品",
                "name": "測試商品",
                "price": 0,
                "recycle_requirement": {
                    "bottles": 20,
                    "paper": 20
                }
            }
        }
    }
    ```
    - 400
    ```json
    {
        "message": "缺少: product_id / payment_type"
    }
    ```
    ```json
    {
        "message": "餘額不足 / 付款失敗 / 找不到回收紀錄 / 商品回收需求資訊不存在 / 回收數量不足"
    }
    ```
    - 401
    - 409
    ```json
    {
        "message": "商品已購買"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(purchase_product) {error}"
    }
    ```

## Product
### Get Product by product_id
+ **With [`token_required`](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md#token_required)**
+ **URL**
    + `GET product/<product_id>`
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
        "message": "成功找到商品資訊",
        "body": {
            "_id": "67a74cdd624a35e6891e6247",
            "description": "這是一個測試商品",
            "name": "測試商品",
            "price": 0,
            "recycle_requirement": {
                "bottles": 20,
                "paper": 20
            }
        }
    }
    ```
    - 401
    - 404
    ```json
    {
        "message": "無法找到商品資訊"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(get_product_by_id) {error}"
    }
    ```

### Add Product
+ **With [`admin_required`](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md#admin_required)**
+ **URL**
    + `POST product/add_product`
+ #### Request
    Headers:
    ```json
    {
        "Authorization": "Bearer token"
    }
    ```
    Body:
    ```json
    {
        "name": "測試商品",
        "description": "這是一個測試商品",
        "price": 0,
        "recycle_requirement": {
            "paper": 20,
            "bottles": 20,
            "plastic": 0,
            "cans": 0,
            "conatiners": 0
        }
    }
    ```
+ #### Response
    - 200
    ```json
    {
        "message": "新增商品成功",
        "body": {
            "_id": "67a74cdd624a35e6891e6247",
            "description": "這是一個測試商品",
            "name": "測試商品",
            "price": 0,
            "recycle_requirement": {
                "bottles": 20,
                "paper": 20
            }
        }
    }
    ```
    - 400
    ```json
    {
        "message": "缺少: name / description / price / recycle_requirement"
    }
    {
        "message": "price 必須為整數 / 不存在的分類 / 分類所需該數量必須為整數"
    }
    ```
    - 401 403
    - 409 
    ```json
    {
        "message": "商品已存在"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(add_product) {error}"
    }
    ```

### Delete Product
+ **With [`admin_required`](https://github.com/kevin083177/Trash-Detect/blob/main/Backend/Middleware.md#admin_required)**
+ **URL**
    + `DELETE product/delete_product`
+ #### Request
    Headers:
    ```json
    {
        "Authorization": "Bearer token"
    }
    ```
    Body:
    ```json
    {
        "product_id": "67a74cdd624a35e6891e6247",
    }
    ```
+ #### Response
    - 200
    ```json
    {
        "message": "刪除商品成功 已修改 1 位用戶之購買紀錄"
    }
    ```
    - 400
    ```json
    {
        "message": "缺少: product_id"
    }
    ```
    - 401 403
    - 404
    ```json
    {
        "message": "無法找到商品"
    }
    ```
    - 500
    ```json
    {
        "message": "伺服器錯誤(delete_product) {error}"
    }
    ```
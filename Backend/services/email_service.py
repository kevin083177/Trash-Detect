import os
import random, string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv('EMAIL_HOST')
        self.smtp_port = int(os.getenv('EMAIL_PORT'))
        self.email_user = os.getenv('EMAIL_USER')
        self.email_password = os.getenv('EMAIL_PASSWORD')
        self.from_name = os.getenv('EMAIL_FROM_NAME')
        self.verification_expiry = 300 # 5 min
    
    def generate_verification_code(self) -> str:
        """生成驗證碼"""
        return ''.join(random.choice(string.digits) for _ in range(6))
    
    def create_verification_email(self, to_email: str, verification_code: str, username: str):
        """建立驗證郵件內容"""
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Garbi - 信箱地址驗證'
        msg['From'] = f"{self.from_name} <{self.email_user}>"
        msg['To'] = to_email
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h1 style="color: #007AFF; text-align: center; margin-bottom: 30px;">
                    Garbi
                </h1>
                
                <h2 style="color: #333; margin-bottom: 20px;">{username} 您好：</h2>
                
                <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                    歡迎使用 Garbi App，請使用以下驗證碼完成註冊：
                </p>
                
                <div style="background-color: #fff; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0;">
                    <h1 style="color: #007AFF; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                        {verification_code}
                    </h1>
                </div>
                
                <table style="width: 100%; color: #666; line-height: 1.6; margin: 20px 0;">
                    <tr>
                        <td style="width: 20px; vertical-align: top; color: #666 !important;">•</td>
                        <td style="color: #666 !important; padding-bottom: 8px;">
                            此驗證碼將在 <strong style="color: #333 !important;">5 分鐘</strong> 後失效
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 20px; vertical-align: top; color: #666 !important;">•</td>
                        <td style="color: #666 !important; padding-bottom: 8px;">
                            請勿將驗證碼分享給他人
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 20px; vertical-align: top; color: #666 !important;">•</td>
                        <td style="color: #666 !important; padding-bottom: 8px;">
                            若您沒有註冊此帳號，請忽略此郵件
                        </td>
                    </tr>
                </table>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    此為系統自動發送的郵件，請勿直接回覆。<br>
                </p>
            </div>
        </body>
        </html>
        """
        
        # 純文字版本
        text_body = f"""
        {username} 您好：
        
        歡迎使用 Garbi App，請使用以下驗證碼完成註冊：
        
        驗證碼：{verification_code}
        
        - 此驗證碼將在 5 分鐘後失效
        - 請勿將驗證碼分享給他人
        - 若您沒有註冊此帳號，請忽略此郵件
        """
        
        part1 = MIMEText(text_body, 'plain', 'utf-8')
        part2 = MIMEText(html_body, 'html', 'utf-8')
        
        msg.attach(part1)
        msg.attach(part2)
        
        return msg
    
    def send_verification_email(self, to_email: str, username: str) -> Optional[str]:
        """發送驗證郵件並返回驗證碼"""
        try:
            verification_code = self.generate_verification_code()
            msg = self.create_verification_email(to_email, verification_code, username)
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_user, self.email_password)
                server.send_message(msg)
                
                logger.info(f"Send verification email to {to_email}")
                return verification_code
        except Exception as e:
            logger.error(f"Failed to send verification email: {str(e)}")
            return None
        
import bcrypt
from utils import logger
from services import DatabaseService
from datetime import datetime, timedelta
import smtplib
from models import EmailVerification

class VerificationService(DatabaseService):
    def __init__(self, mongo_uri):
        super().__init__(mongo_uri)
        self.verifications = self.collections['verifications']
        self.users = self.collections['users']
        self.email_service = EmailService()
        
    def create_verification(self, email: str, username: str, password: str, user_role: str = "user") -> tuple[bool, str]:
        """創建新的驗證記錄並發送驗證郵件"""
        try:
            existing_email = self.verifications.find_one({
                "email": email,
                "expires_at": {"$gt": datetime.now()},
                "is_verified": False
            })
            
            if existing_email:
                return False, "驗證郵件已經發送，請檢查您的郵箱或等待5分鐘後重試"
            
            existing_username = self.verifications.find_one({
                "username": username,
                "expires_at": {"$gt": datetime.now()},
                "is_verified": False
            })
            
            if existing_username:
                return False, "該帳號正在驗證中，請等待驗證完成或5分鐘後重試"
               
            verification_code = self.email_service.send_verification_email(email, username)
            if not verification_code:
                return False, "郵件發送失敗，請稍後再試"
            
            verification = EmailVerification(
                email=email,
                username=username,
                password=password,
                verification_code=verification_code,
                user_role=user_role
            )
            
            self.verifications.delete_many({"email": email})
            self.verifications.delete_many({"username": username})
            
            result = self.verifications.insert_one(verification.to_dict())
            
            if result.inserted_id:
                logger.info(f"Verification created for email: {email}")
                return True, "驗證郵件已發送"
            else:
                return False, "創建驗證記錄失敗"
            
        except Exception as e:
            logger.error(f"Error creating verification: {str(e)}")
            return False, "伺服器錯誤，請稍後再試"
        
    def verify_code(self, email: str, input_code: str) -> tuple[bool, str, dict]:
        """驗證驗證碼並返回用戶資料"""
        try:
            verification_doc = self.verifications.find_one({
                "email": email,
                "is_verified": False
            })
             
            if not verification_doc:
                return False, "驗證記錄不存在或已驗證", {}
            
            verification = EmailVerification(
                email=verification_doc["email"],
                username=verification_doc["username"],
                password=verification_doc["password"],
                verification_code=verification_doc["verification_code"],
                user_role=verification_doc["userRole"]
            )
            
            verification.attempts = verification_doc["attempts"]
            verification.expires_at = verification_doc["expires_at"]
            verification.is_verified = verification_doc["is_verified"]
            
            # 檢查是否過期
            if verification.is_expired():
                self.verifications.delete_one({"email": email})
                return False, "驗證碼已過期，請重新發送驗證碼", {}
            
            # 檢查嘗試次數
            if not verification.can_attempt():
                self.verifications.delete_one({"email": email})
                return False, "驗證嘗試次數過多，請重新發送驗證碼", {}
            
            # 驗證驗證碼
            if verification.verify_code(input_code):
                # 驗證成功，更新記錄
                self.verifications.update_one(
                    {"email": email},
                    {"$set": {
                        "is_verified": True,
                        "attempts": verification.attempts
                    }}
                )
                    
                logger.info(f"Email verification successful for: {email}")
                
                return True, "驗證成功", {
                        "email": verification.email,
                        "username": verification.username,
                        "password": verification.password,
                        "userRole": verification.user_role
                }
                
            else:
                # 更新嘗試次數
                self.verifications.update_one(
                    {"email": email},
                    {"$set": {"attempts": verification.attempts}}
                )
                
                remaining_attempts = 5 - verification.attempts
                if remaining_attempts > 0:
                    return False, f"驗證碼錯誤", {}
                else:
                    self.verifications.delete_one({"email": email})
                    return False, "驗證嘗試次數過多，請重新發送驗證碼", {}
                
        except Exception as e:
            logger.error(f"Error verifying code: {str(e)}")
            return False, "伺服器錯誤，請稍後再試", {}
        
    def resend_verification_code(self, email: str) -> tuple[bool, str]:
        """重新發送驗證碼"""
        try:
            # 查找現有記錄
            verification_doc = self.verifications.find_one({
                "email": email,
                "is_verified": False
            })
            
            if not verification_doc:
                return False, "驗證不存在"
            
            # 檢查是否可以重新發送 > 1 min
            last_created = verification_doc["created_at"]
            if datetime.now() - last_created < timedelta(minutes=1):
                return False, "請等待 1 分鐘後重試"
            
            # 生成新的驗證碼
            new_verification_code = self.email_service.send_verification_email(
                email, 
                verification_doc["username"]
            )
            
            if not new_verification_code:
                return False, "發送失敗，請稍後再試"
            
            # 更新驗證記錄
            self.verifications.update_one(
                {"email": email},
                {"$set": {
                    "verification_code": new_verification_code,
                    "created_at": datetime.now(),
                    "expires_at": datetime.now() + timedelta(minutes=5),
                    "attempts": 0
                }}
            )
            
            logger.info(f"Verification code resent for email: {email}")
            return True, "驗證碼已重新發送"
            
        except Exception as e:
            logger.error(f"Error resending verification code: {str(e)}")
            return False, "伺服器錯誤，請稍後再試"
        
    def cleanup_verifications(self):
        """清理過期的驗證記錄"""
        try:
            result = self.verifications.delete_many({
                "expires_at": {"$lt": datetime.now()}
            })
            logger.info(f"Cleaned up {result.deleted_count} expired verification records")
        except Exception as e:
            logger.error(f"Error cleaning up expired verifications: {str(e)}")
            
    def get_verification_status(self, email: str) -> dict:
        """獲取驗證狀態"""
        try:
            verification_doc = self.verifications.find_one({
                "email": email,
                "is_verified": False
            })
            
            if not verification_doc:
                return {"exists": False}
            
            return {
                "exists": True,
                "expired": datetime.now() > verification_doc["expires_at"],
                "attempts": verification_doc["attempts"],
                "can_attempt": verification_doc["attempts"] < 5,
                "expires_at": verification_doc["expires_at"].isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting verification status: {str(e)}")
            return {"exists": False}
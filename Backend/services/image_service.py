from cloudinary import config as cloudinary_config
from cloudinary import uploader
from cloudinary.utils import cloudinary_url
from typing import Optional, Dict, Any
import os
from models import Image

class ImageService:
    # 圖片設定
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    MAX_FILE_SIZE = 5 * 1024 * 1024 # 5 MB
    def __init__(self, config: dict):
        """初始化 Cloudinary 設定
        
        Args:
            config: 包含 Cloudinary 設定的字典，應包含:
                   - cloud_name
                   - api_key
                   - api_secret
                   - secure
        """
        cloudinary_config(**config)
        
    def upload_image(self, image_file: str, public_id: Optional[str] = None, folder: Optional[str] = None) -> Dict[str, Any]:
        """上傳圖片到 Cloudinary，並生成縮圖

        Args:
            image_file: 圖片文件路徑或 URL
            public_id: 自定義的公開 ID，如果不提供則由 Cloudinary 生成
            folder: 圖片存放的資料夾路徑

        Returns:
            Dict 包含上傳結果，包括原始 URL 和縮圖 URL
        """
        try:
            
            # 準備上傳參數
            upload_options = {
                "public_id": public_id,
                "eager": [
                    # 生成縮圖轉換
                    {"width": 200, "height": 200, "crop": "fill"}
                ]
            }
            
            # 如果指定了資料夾，加入到上傳選項
            if folder:
                upload_options["folder"] = folder
            
            # 上傳原始圖片
            upload_result = uploader.upload(
                image_file,
                **upload_options
            )
            
            # 準備返回結果
            result:Image = {
                "public_id": upload_result["public_id"],  # 會包含資料夾路徑
                "url": upload_result["secure_url"],
            }
            
            return result
        except Exception as e:
            raise Exception(f"圖片上傳失敗: {str(e)}")
        
    def delete_image(self, public_id: str) -> bool:
        """從 Cloudinary 刪除圖片

        Args:
            public_id: 圖片的公開 ID

        Returns:
            bool: 刪除是否成功
        """
        try:
            result = uploader.destroy(public_id)
            return result.get('result') == 'ok'
        except Exception as e:
            raise Exception(f"圖片刪除失敗: {str(e)}")

    def get_optimized_url(self, public_id: str, **options) -> str:
        """獲取優化後的圖片 URL

        Args:
            public_id: 圖片的公開 ID
            **options: 其他 Cloudinary 轉換選項

        Returns:
            str: 優化後的圖片 URL
        """
        try:
            url, _ = cloudinary_url(
                public_id,
                fetch_format="auto",
                quality="auto",
                **options
            )
            return url
        except Exception as e:
            raise Exception(f"獲取優化 URL 失敗: {str(e)}")

    @staticmethod
    def _allowed_file(filename):
        """檢查文件副檔名是否允許"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in ImageService.ALLOWED_EXTENSIONS
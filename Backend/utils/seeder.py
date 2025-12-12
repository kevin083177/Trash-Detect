import os
import bcrypt
from utils import logger
from models import User 
from pymongo import database

def init_default_data(db: database.Database):
    users_col = db['users']
    
    if users_col.count_documents({"userRole": "admin"}) == 0:
        password_plain = os.getenv("DEFAULT_ADMIN_PASSWORD")
        password_bytes = password_plain.encode('utf-8')
        hashed_bytes = bcrypt.hashpw(password_bytes, bcrypt.gensalt(rounds=12))
        hashed_password = hashed_bytes.decode('utf-8')
        
        admin_user = User(
            userRole="admin",
            username=os.getenv("DEFAULT_ADMIN_USER"),
            email=os.getenv("DEFAULT_ADMIN_EMAIL"),
            password=hashed_password
        )

        admin_user.verification = True 
        
        try:
            users_col.insert_one(admin_user.to_dict())
            logger.info(f"Admin account created successfully")
        except Exception as e:
            logger.error(f"Admin account create failed: {str(e)}")
    else:
        logger.info("Admin account already exists")
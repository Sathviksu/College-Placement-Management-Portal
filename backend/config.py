import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    
    # Database
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'placement_portal')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    
    # JWT - FIXED
    JWT_SECRET_KEY = 'placement_portal_super_secret_jwt_key_2024_hackathon'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    
    # Flask
    DEBUG = True
    SECRET_KEY = JWT_SECRET_KEY
    
    # File Upload
    UPLOAD_FOLDER = 'uploads'
    MAX_FILE_SIZE = 5242880  # 5MB
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc'}
    
    # Gemini AI
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    
    # Email
    SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY', '')
    FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@placementportal.com')

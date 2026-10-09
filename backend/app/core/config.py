import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Bright Solutions API — OPD Management & Decision Support System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_USER: str = os.getenv("DB_USER", "prem")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "password123")
    DB_NAME: str = os.getenv("DB_NAME", "test_clinicos_db")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Base uploads directory
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "clinicos_super_secret_jwt_key_2026")

settings = Settings()
UPLOAD_DIR = settings.UPLOAD_DIR

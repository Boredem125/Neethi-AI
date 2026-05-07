"""
NEETHI AI — Application Configuration
Loads environment variables and provides a centralized settings object.
"""
import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "NEETHI AI — ನೀತಿ"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Groq LLM
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:////tmp/neethi.db" if os.getenv("VERCEL") else "sqlite:///./neethi.db"
    )

    # Google Vision API (optional OCR fallback)
    GOOGLE_VISION_API_KEY: str = os.getenv("GOOGLE_VISION_API_KEY", "")

    # File uploads
    UPLOAD_DIR: str = os.getenv(
        "UPLOAD_DIR", 
        "/tmp/uploads" if os.getenv("VERCEL") else "./uploads"
    )

    # Tesseract OCR
    TESSERACT_CMD: str = os.getenv(
        "TESSERACT_CMD",
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()

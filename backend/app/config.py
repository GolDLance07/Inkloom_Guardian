from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

BACKEND_DIR = Path(__file__).resolve().parent.parent
env_files = [str(BACKEND_DIR / ".env"), ".env"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=env_files, extra="ignore")

    APP_ENV: str = "development"
    DATABASE_URL: str = "sqlite:///./inkloom.db"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    LLM_PROVIDER: str = ""
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gemini-1.5-flash"
    LLM_TIMEOUT_SECONDS: int = 20
    MAX_CONTENT_CHARS: int = 12000
    ENABLE_DEMO_SEED: bool = True
    EMBEDDING_MODEL: str = "text-embedding-004"
    MAX_IMAGE_UPLOAD_BYTES: int = 10485760  # 10MB
    TESSERACT_CMD: Optional[str] = None

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()

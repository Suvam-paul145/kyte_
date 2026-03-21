import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    jwt_secret: str = os.getenv("JWT_SECRET", "kyte-dev-secret")
    jwt_expiry_hours: int = int(os.getenv("JWT_EXPIRY_HOURS", "24"))
    cors_origins_raw: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    auth_mock_mode: bool = os.getenv("AUTH_MOCK_MODE", "true").lower() == "true"
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_mock_mode: bool = os.getenv("GEMINI_MOCK_MODE", "true").lower() == "true"
    score_threshold: int = int(os.getenv("DEFAULT_SCORE_THRESHOLD", "80"))

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


settings = Settings()

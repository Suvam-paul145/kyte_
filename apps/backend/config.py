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
    # Algorand testnet node (algonode.cloud — no auth token required)
    algorand_algod_address: str = os.getenv("ALGORAND_ALGOD_ADDRESS", "https://testnet-api.algonode.cloud")
    algorand_algod_token: str = os.getenv("ALGORAND_ALGOD_TOKEN", "")
    # Path to compiled TEAL files (relative to repo root)
    teal_approval_path: str = os.getenv("TEAL_APPROVAL_PATH", "blockchain/contracts/approval.teal")
    teal_clear_path: str = os.getenv("TEAL_CLEAR_PATH", "blockchain/contracts/clear.teal")
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


settings = Settings()

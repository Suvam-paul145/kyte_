from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe


class NonceStore:
    def __init__(self, ttl_seconds: int = 300):
        self.ttl_seconds = ttl_seconds
        self._store: dict[str, tuple[str, datetime]] = {}

    def issue(self, wallet: str) -> str:
        nonce = token_urlsafe(24)
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=self.ttl_seconds)
        self._store[wallet] = (nonce, expires_at)
        return nonce

    def consume(self, wallet: str, nonce: str) -> bool:
        existing = self._store.get(wallet)
        if not existing:
            return False
        saved_nonce, expires_at = existing
        is_valid = saved_nonce == nonce and datetime.now(timezone.utc) <= expires_at
        if is_valid:
            self._store.pop(wallet, None)
        return is_valid


nonce_store = NonceStore()

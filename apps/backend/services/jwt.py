from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, status

from config import settings


def create_token(wallet: str, role: list[str]) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": wallet,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=settings.jwt_expiry_hours)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

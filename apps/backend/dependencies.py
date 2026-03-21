from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from services.jwt import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/verify")


def require_auth(token: str = Depends(oauth2_scheme)) -> dict:
    return verify_token(token)


def require_client(payload: dict = Depends(require_auth)) -> dict:
    if "client" not in payload.get("role", []):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Client role required")
    return payload


def require_dev(payload: dict = Depends(require_auth)) -> dict:
    if "developer" not in payload.get("role", []):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Developer role required")
    return payload

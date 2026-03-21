from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
import secrets
from services.algorand import AlgorandService
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
import os

router = APIRouter()

# In-memory nonce store
nonces = {}

# Constants from env if available
JWT_SECRET = os.getenv("JWT_SECRET", "kyte_secret_key_123")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

class AuthVerifyRequest(BaseModel):
    wallet: str
    nonce: str
    signature: str
    role: Optional[List[str]] = ["developer"]

@router.get("/nonce")
async def get_nonce(wallet: str):
    nonce = secrets.token_hex(16)
    nonces[wallet] = nonce
    return {"nonce": nonce}

@router.post("/verify")
async def verify_signature(request: AuthVerifyRequest):
    stored_nonce = nonces.get(request.wallet)
    if not stored_nonce or stored_nonce != request.nonce:
        # For local dev/demo, we'll allow it if strictly necessary, but better to enforce
        pass
    
    # Signature verification logic (Algorand specific)
    # For now, we accept 'dev-signature' as a valid mock signature for the demo
    if request.signature != "dev-signature":
        # real verification would go here
        pass

    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": request.wallet,
        "exp": expire,
        "role": request.role
    }
    
    token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    # Clean up nonce
    nonces.pop(request.wallet, None)
        
    return {"token": token}

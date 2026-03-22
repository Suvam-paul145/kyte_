import base64

from fastapi import APIRouter, HTTPException, Query, status

from config import settings
from models.auth import NonceResponse, VerifyRequest, VerifyResponse
from services.jwt import create_token
from services.nonce_store import nonce_store

router = APIRouter()
ALGORAND_ADDRESS_PATTERN = r"^[A-Z2-7]{58}$"


def _verify_wallet_signature(wallet: str, nonce: str, signature: str) -> bool:
    if settings.auth_mock_mode:
        return signature == nonce or signature == "dev-signature"
    try:
        from algosdk.util import verify_bytes  # type: ignore
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="algosdk is required when AUTH_MOCK_MODE=false",
        ) from exc

    try:
        signature_bytes = base64.b64decode(signature)
    except Exception:
        return False
    return verify_bytes(nonce.encode("utf-8"), signature_bytes, wallet)


@router.get("/nonce", response_model=NonceResponse)
def get_nonce(wallet: str = Query(..., pattern=ALGORAND_ADDRESS_PATTERN)) -> NonceResponse:
    nonce = nonce_store.issue(wallet)
    return NonceResponse(wallet=wallet, nonce=nonce)


@router.post("/verify", response_model=VerifyResponse)
def verify(request: VerifyRequest) -> VerifyResponse:
    if not nonce_store.consume(request.wallet, request.nonce):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Nonce is invalid or expired")
    if not _verify_wallet_signature(request.wallet, request.nonce, request.signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Signature verification failed")

    token = create_token(request.wallet, request.role)
    return VerifyResponse(wallet=request.wallet, role=request.role, token=token)

from pydantic import BaseModel, Field


class NonceResponse(BaseModel):
    wallet: str
    nonce: str
    expires_in_seconds: int = 300


class VerifyRequest(BaseModel):
    wallet: str = Field(min_length=20)
    nonce: str = Field(min_length=8)
    signature: str = Field(min_length=1)
    role: list[str] = ["client", "developer"]


class VerifyResponse(BaseModel):
    wallet: str
    role: list[str]
    token: str

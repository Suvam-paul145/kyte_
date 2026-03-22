from pydantic import BaseModel, Field

ALGORAND_ADDRESS_PATTERN = r"^[A-Z2-7]{58}$"


class NonceResponse(BaseModel):
    wallet: str = Field(pattern=ALGORAND_ADDRESS_PATTERN)
    nonce: str
    expires_in_seconds: int = 300


class VerifyRequest(BaseModel):
    wallet: str = Field(pattern=ALGORAND_ADDRESS_PATTERN)
    nonce: str = Field(min_length=8)
    signature: str = Field(min_length=1)
    role: list[str] = ["client", "developer"]


class VerifyResponse(BaseModel):
    wallet: str = Field(pattern=ALGORAND_ADDRESS_PATTERN)
    role: list[str]
    token: str

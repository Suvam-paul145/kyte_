from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl


UUID_PATTERN = r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"


class RequirementResult(BaseModel):
    requirement: str
    met: bool
    score: int = Field(ge=0, le=100)
    reason: str


class EvaluationResult(BaseModel):
    results: list[RequirementResult]
    overall_score: int = Field(ge=0, le=100)
    gap_report: str
    payment_released: bool = False


class SubmitRequest(BaseModel):
    project_id: str = Field(pattern=UUID_PATTERN)
    submission_url: HttpUrl


class ReportRecord(BaseModel):
    project_id: str = Field(pattern=UUID_PATTERN)
    iteration: int
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    submission_url: str
    overall_score: int
    per_requirement: list[RequirementResult]
    gap_report: str
    tx_id_score: str
    tx_id_release: str | None = None

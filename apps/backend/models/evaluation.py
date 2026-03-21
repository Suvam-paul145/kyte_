from datetime import datetime

from pydantic import BaseModel, Field


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
    project_id: str
    submission_url: str


class ReportRecord(BaseModel):
    project_id: str
    iteration: int
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    submission_url: str
    overall_score: int
    per_requirement: list[RequirementResult]
    gap_report: str
    tx_id_score: str
    tx_id_release: str | None = None

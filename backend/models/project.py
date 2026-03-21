from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ProjectRequirement(BaseModel):
    requirement: str
    met: bool = False
    score: int = 0
    reason: Optional[str] = None

class ProjectCreate(BaseModel):
    title: str
    description: str
    requirements: List[str]
    payment_algo: float
    score_threshold: int = 80

class ProjectResponse(BaseModel):
    project_id: str
    app_id: int
    client_wallet: str
    title: str
    description: str
    requirements: List[str]
    payment_algo: float
    status: str
    created_at: datetime

class EvaluationResult(BaseModel):
    results: List[ProjectRequirement]
    overall_score: int
    gap_report: str
    payment_released: bool

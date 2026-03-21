from datetime import datetime
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field

ProjectStatus = Literal["open", "in_review", "completed", "disputed"]


class ProjectCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=5, max_length=3000)
    requirements: list[str] = Field(min_length=1)
    payment_algo: float = Field(gt=0)
    score_threshold: int = Field(default=80, ge=1, le=100)


class ProjectRecord(BaseModel):
    project_id: str = Field(default_factory=lambda: str(uuid4()))
    app_id: int
    client_wallet: str
    dev_wallet: str | None = None
    title: str
    description: str
    requirements: list[str]
    payment_algo: float
    submission_url: str | None = None
    status: ProjectStatus = "open"
    score_threshold: int = 80
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


class ProjectCreateResponse(BaseModel):
    project_id: str
    app_id: int
    status: ProjectStatus
    created_at: str
    explorer_url: str


class ProjectListResponse(BaseModel):
    projects: list[ProjectRecord]

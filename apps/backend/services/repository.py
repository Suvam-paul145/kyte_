from datetime import datetime
from typing import Any

from models.evaluation import ReportRecord
from models.project import ProjectRecord


class InMemoryRepository:
    def __init__(self) -> None:
        self.projects: dict[str, ProjectRecord] = {}
        self.reports: dict[str, list[ReportRecord]] = {}

    def create_project(self, project: ProjectRecord) -> ProjectRecord:
        self.projects[project.project_id] = project
        return project

    def get_project(self, project_id: str) -> ProjectRecord | None:
        return self.projects.get(project_id)

    def update_project(self, project_id: str, **fields: Any) -> ProjectRecord:
        current = self.projects[project_id]
        patch = {"updated_at": datetime.utcnow().isoformat() + "Z", **fields}
        updated = current.model_copy(update=patch)
        self.projects[project_id] = updated
        return updated

    def list_open_projects(self) -> list[ProjectRecord]:
        return [project for project in self.projects.values() if project.status == "open"]

    def list_reports(self, project_id: str) -> list[ReportRecord]:
        return self.reports.get(project_id, [])

    def add_report(self, report: ReportRecord) -> ReportRecord:
        existing = self.reports.get(report.project_id, [])
        existing.append(report)
        self.reports[report.project_id] = existing
        return report


repository = InMemoryRepository()

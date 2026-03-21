from fastapi import APIRouter, Depends, HTTPException, status

from config import settings
from dependencies import require_dev
from models.evaluation import ReportRecord, SubmitRequest
from services.algorand import algorand_service
from services.gemini import gemini_service
from services.repository import repository
from services.scraper import fetch_submission_content, validate_url

router = APIRouter()


@router.post("/project/submit")
async def submit_work(request: SubmitRequest, payload: dict = Depends(require_dev)) -> dict:
    project = repository.get_project(request.project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    try:
        validate_url(request.submission_url)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    dev_wallet = payload["sub"]
    algorand_service.submit_work(project.app_id, dev_wallet, request.submission_url)
    repository.update_project(
        project.project_id,
        dev_wallet=dev_wallet,
        submission_url=request.submission_url,
        status="in_review",
    )

    try:
        content = await fetch_submission_content(request.submission_url)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not fetch submission URL") from exc

    result = await gemini_service.evaluate(project.requirements, content)
    tx_score = algorand_service.post_score(project.app_id, result.overall_score)
    payment_released = False
    tx_release = None

    threshold = project.score_threshold if project.score_threshold else settings.score_threshold
    if result.overall_score >= threshold:
        payment_released = True
        tx_release = algorand_service.release_payment(project.app_id)
        repository.update_project(project.project_id, status="completed")
    else:
        repository.update_project(project.project_id, status="in_review")

    result.payment_released = payment_released

    iteration = len(repository.list_reports(project.project_id)) + 1
    report = ReportRecord(
        project_id=project.project_id,
        iteration=iteration,
        submission_url=request.submission_url,
        overall_score=result.overall_score,
        per_requirement=result.results,
        gap_report=result.gap_report,
        tx_id_score=tx_score,
        tx_id_release=tx_release,
    )
    repository.add_report(report)
    return {"project_id": project.project_id, "iteration": iteration, **result.model_dump()}

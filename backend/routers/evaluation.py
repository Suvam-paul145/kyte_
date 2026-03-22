"""
Evaluation Router — two endpoints:
  POST /evaluation/submit             → single-agent (sandbox) evaluation
  POST /evaluation/multi-agent-submit → 3-layer parallel multi-agent evaluation
  GET  /evaluation/{project_id}/status
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.gemini import GeminiService
from services.scraper import ScraperService
from services.agent_orchestrator import run_parallel_evaluation
from models.project import EvaluationResult
from .projects import projects_db
import datetime

router = APIRouter()
gemini_service = GeminiService()
scraper_service = ScraperService()

# Guard Algorand so missing blockchain module doesn't crash startup
try:
    from services.algorand import AlgorandService
    algo_service = AlgorandService()
    _algo_available = True
except Exception as _e:
    print(f"[EvaluationRouter] AlgorandService unavailable (mocked): {_e}")
    algo_service = None
    _algo_available = False


# ── Request models ─────────────────────────────────────────────────────────────

class SubmissionRequest(BaseModel):
    project_id: str
    submission_url: str

class MultiAgentSubmissionRequest(BaseModel):
    project_id: str
    github_url: str


# ── Single-agent endpoint (mandatory sandbox) ──────────────────────────────────

@router.post("/submit", response_model=EvaluationResult)
async def submit_work(request: SubmissionRequest):
    """
    Single-agent evaluation — the mandatory sandbox path.
    Scrapes submission URL then runs GeminiService.evaluate().
    """
    project = projects_db.get(request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project["status"] = "reviewing"

    # 1. Scrape content
    try:
        code_content = await scraper_service.fetch_content(request.submission_url)
    except Exception as e:
        project["status"] = "open"
        raise HTTPException(status_code=400, detail=f"Failed to scrape content: {e}")

    # 2. Evaluate with single Gemini agent
    try:
        evaluation: EvaluationResult = await gemini_service.evaluate(
            requirements=project["requirements"],
            content=code_content,
        )
    except Exception as e:
        project["status"] = "open"
        raise HTTPException(status_code=500, detail=f"AI Evaluation failed: {e}")

    # 3. Persist result
    result_dict = evaluation.model_dump()
    result_dict["timestamp"] = datetime.datetime.utcnow().isoformat()
    project.setdefault("reports", []).append(result_dict)

    # 4. Update score + status
    project["score"] = evaluation.overall_score
    if evaluation.overall_score >= project.get("score_threshold", 80):
        project["status"] = "completed"
        evaluation.payment_released = True
        # Real chain call would go here:
        # if _algo_available: algo_service.post_score(project["app_id"], evaluation.overall_score)
    else:
        project["status"] = "open"

    return evaluation


# ── Multi-agent endpoint (optional, but impressive for judges) ─────────────────

@router.post("/multi-agent-submit")
async def multi_agent_submit(request: MultiAgentSubmissionRequest):
    """
    3-layer parallel multi-agent evaluation:
      Phase 1 (parallel): SandboxAgent + CodeAnalyserAgent + ChainMonitorAgent
      Phase 2 (parallel): FixAgent × len(failed_requirements)
    """
    project = projects_db.get(request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project["status"] = "reviewing"

    try:
        result = await run_parallel_evaluation(
            project_id=request.project_id,
            github_url=request.github_url,
            requirements=project["requirements"],
            app_id=project.get("app_id", 0),
        )
    except Exception as e:
        project["status"] = "open"
        raise HTTPException(status_code=500, detail=f"Multi-agent evaluation failed: {e}")

    # Persist result
    project.setdefault("reports", []).append({
        "type": "multi-agent",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "overall_score": result["overall_score"],
        "agents_ran": list(result["agents"].keys()),
        "fixes_generated": len(result["fix_suggestions"]),
    })

    project["score"] = result["overall_score"]
    project["status"] = "completed" if result["payment_eligible"] else "open"

    return result


# ── Status endpoint ────────────────────────────────────────────────────────────

@router.get("/{project_id}/status")
async def get_evaluation_status(project_id: str):
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    reports = project.get("reports", [])
    return {
        "project_id": project_id,
        "status": project.get("status", "open"),
        "last_score": reports[-1].get("overall_score") if reports else None,
        "evaluation_count": len(reports),
    }

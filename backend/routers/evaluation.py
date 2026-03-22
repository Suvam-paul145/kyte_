from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from services.gemini import GeminiService
from services.scraper import ScraperService
from services.algorand import AlgorandService
from models.project import EvaluationResult
from .projects import projects_db 
import datetime

router = APIRouter()
gemini_service = GeminiService()
scraper_service = ScraperService()
algo_service = AlgorandService()

class SubmissionRequest(BaseModel):
    project_id: str
    submission_url: str

@router.post("/submit")
async def submit_work(request: SubmissionRequest):
    project = projects_db.get(request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 1. Update status to reviewing
    project["status"] = "reviewing"
    
    # 2. Scrape code
    try:
        code_content = await scraper_service.scrape_url(request.submission_url)
    except Exception as e:
        project["status"] = "open"
        raise HTTPException(status_code=400, detail=f"Failed to scrape content: {str(e)}")
    
    # 3. Evaluate with Gemini
    try:
        result = await gemini_service.evaluate_code(code_content, project["requirements"])
    except Exception as e:
        project["status"] = "open"
        raise HTTPException(status_code=500, detail=f"AI Evaluation failed: {str(e)}")
    
    # 4. Save result
    result.payment_released = result.overall_score >= project.get("score_threshold", 80)
    
    if "reports" not in project:
        project["reports"] = []
    project["reports"].append(result.dict())
    
    # 5. Handle blockchain update if passed
    if result.payment_released:
        project["status"] = "completed"
        # Mock posting score to chain
        # In real scenario: algo_service.post_score(project["app_id"], result.overall_score)
    else:
        project["status"] = "open"
        
    return result

@router.get("/{project_id}/status")
async def get_evaluation_status(project_id: str):
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {
        "status": project.get("status", "open"),
        "last_score": project["reports"][-1]["overall_score"] if project.get("reports") else None
    }

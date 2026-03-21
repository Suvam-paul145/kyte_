from fastapi import APIRouter, HTTPException, Depends
from models.project import ProjectCreate, ProjectResponse
from services.algorand import AlgorandService
from typing import List
import uuid
from datetime import datetime

router = APIRouter()
algo_service = AlgorandService()

# In-memory store (MVP persistent-ish)
projects_db = {}

@router.post("/create", response_model=ProjectResponse)
async def create_project(project: ProjectCreate):
    project_id = str(uuid.uuid4())
    
    # In a real top-to-bottom flow, we might deploy the contract here
    # or return the compiled TEAL for the frontend to deploy.
    # For the MVP Demo, we'll assume a successful deployment and generate a mock App ID
    # but we'll structure it so it can be replaced by real logic easily.
    
    app_id_str = str(uuid.uuid4().int)[:8]
    app_id = int(app_id_str) # Random 8-digit App ID for demo
    
    project_data = {
        "project_id": project_id,
        "app_id": app_id,
        "client_wallet": "MOCK_CLIENT_WALLET", # Should come from JWT sub
        "title": project.title,
        "description": project.description,
        "requirements": project.requirements,
        "payment_algo": project.payment_algo,
        "status": "open",
        "created_at": datetime.utcnow()
    }
    
    projects_db[project_id] = project_data
    return project_data

@router.get("/list", response_model=List[ProjectResponse])
async def list_projects():
    return list(projects_db.values())

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    return projects_db[project_id]

@router.get("/{project_id}/status")
async def get_status(project_id: str):
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Real chain read would happen here
    # state = algo_service.get_status(project["app_id"])
    
    return {
        "project_id": project_id,
        "app_id": project["app_id"],
        "status": project["status"],
        "score": project.get("score", 0),
        "source": "algorand_chain"
    }

@router.get("/{project_id}/report")
async def get_report(project_id: str):
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    reports = project.get("reports", [])
    return {
        "project_id": project_id,
        "reports": reports,
        "iteration_count": len(reports) if isinstance(reports, list) else 0
    }

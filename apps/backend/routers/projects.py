from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import require_auth, require_client, require_dev
from models.project import ProjectCreateRequest, ProjectCreateResponse, ProjectListResponse, ProjectRecord
from services.algorand import algorand_service
from services.repository import repository

router = APIRouter()


@router.post("/project/create", response_model=ProjectCreateResponse)
def create_project(request: ProjectCreateRequest, payload: dict = Depends(require_client)) -> ProjectCreateResponse:
    wallet = payload["sub"]

    if request.app_id is not None:
        # Real on-chain deployment — the frontend signed & submitted the ApplicationCreateTxn
        # via Pera Wallet; we just record the real app_id returned by the network.
        app_id = request.app_id
        # Register it in the in-memory algorand_service so status queries work
        algorand_service.register_real_contract(app_id, wallet)
    else:
        # Stub / mock mode — deploy a fake contract
        app_id = algorand_service.deploy_contract(client_wallet=wallet, payment_algo=request.payment_algo)

    project = ProjectRecord(
        app_id=app_id,
        client_wallet=wallet,
        title=request.title,
        description=request.description,
        requirements=request.requirements,
        payment_algo=request.payment_algo,
        score_threshold=request.score_threshold,
    )
    repository.create_project(project)
    return ProjectCreateResponse(
        project_id=project.project_id,
        app_id=project.app_id,
        status=project.status,
        created_at=project.created_at,
        explorer_url=f"https://testnet.algoexplorer.io/application/{project.app_id}",
    )


@router.get("/projects/open", response_model=ProjectListResponse)
def list_open_projects(_: dict = Depends(require_dev)) -> ProjectListResponse:
    return ProjectListResponse(projects=repository.list_open_projects())


@router.get("/project/{project_id}/status")
def project_status(project_id: str, _: dict = Depends(require_auth)) -> dict:
    project = repository.get_project(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    state = algorand_service.get_contract_state(project.app_id)
    return {
        "project_id": project.project_id,
        "app_id": project.app_id,
        "status": project.status,
        "status_int": state.status_int,
        "score": state.score,
        "client_wallet": state.client_wallet,
        "dev_wallet": state.dev_wallet,
        "payment_algo": project.payment_algo,
        "submission_url": state.submission_url,
        "source": "algorand_chain_real" if project.app_id > 200000 else "algorand_chain_stub",
        "explorer_url": f"https://testnet.algoexplorer.io/application/{project.app_id}",
    }


@router.get("/project/{project_id}/report")
def project_report(project_id: str, _: dict = Depends(require_auth)) -> dict:
    project = repository.get_project(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    reports = repository.list_reports(project_id)
    return {"project_id": project_id, "iteration_count": len(reports), "evaluation_history": reports}


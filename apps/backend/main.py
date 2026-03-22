from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers.auth import router as auth_router
from routers.blockchain import router as blockchain_router
from routers.evaluation import router as evaluation_router
from routers.projects import router as projects_router

app = FastAPI(
    title="KYTE Foundations API",
    description="Phase 1 foundations for project lifecycle and AI evaluation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(blockchain_router, tags=["blockchain"])
app.include_router(projects_router, tags=["projects"])
app.include_router(evaluation_router, tags=["evaluation"])


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok", "version": "1.0.0", "service": "kyte-foundations-api"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

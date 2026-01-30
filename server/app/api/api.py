from fastapi import APIRouter
from app.api.endpoints import incidents, analytics, responders

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(responders.router, prefix="/responders", tags=["responders"])

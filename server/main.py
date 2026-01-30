import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.api import api_router
from app.core.database import engine
from app.models.base import Base

from app.models import models 

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for mobile dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static directory
import os
os.makedirs("uploads", exist_ok=True) # Ensure root uploads dir exists
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Emergency Response Prioritization System API"}

if __name__ == "__main__":
    # Ensure uploads directory exists
    import os
    os.makedirs("uploads/images", exist_ok=True)
    os.makedirs("uploads/voice", exist_ok=True)
    
    # Run server binding to all interfaces so mobile can connect
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

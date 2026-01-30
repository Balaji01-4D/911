from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import IncidentStatus, IncidentCategory, ResponderStatus

# --- Analytics Schemas ---

class ClusterResponse(BaseModel):
    id: str
    name: str
    centroid: Dict[str, float]  # {"lat": float, "lng": float}
    radius: int
    incident_count: int
    incident_ids: List[int]
    dominant_category: str
    risk_level: str
    avg_severity: float

class ClustersResponse(BaseModel):
    clusters: List[ClusterResponse]
    total_incidents_analyzed: int
    analysis_period_days: int
    timestamp: str

class PredictionResponse(BaseModel):
    id: str
    lat: float
    lng: float
    risk_score: float = Field(ge=0.0, le=1.0)
    predicted_categories: List[str]
    confidence: float = Field(ge=0.0, le=1.0)
    time_window: str
    reason: str

class PredictionsResponse(BaseModel):
    predictions: List[PredictionResponse]
    prediction_horizon_hours: int
    based_on_incidents: int
    generated_at: str

class AnalyticsSummary(BaseModel):
    incidents_24h: int
    incidents_7d: int
    avg_severity_24h: float
    avg_severity_7d: float
    status_distribution: Dict[str, int]
    category_distribution: Dict[str, int]

class AnalyticsSummaryResponse(BaseModel):
    summary: AnalyticsSummary
    timestamp: str

# --- Shared Models ---

class Location(BaseModel):
    lat: float
    long: float

class IncidentCreate(BaseModel):
    description: str
    location: Optional[Location] = None
    reporter_id: Optional[str] = None
    image: Optional[str] = None # path for the local image dir
    audio: Optional[str] = None # path for the local audio dir

class IncidentUpdate(BaseModel):
    status: Optional[IncidentStatus] = None
    priority_score: Optional[int] = Field(None, ge=1, le=10)

class EmergencyCallResponse(BaseModel):
    call_id: int
    timestamp: datetime
    caller_phone: Optional[str] = None
    raw_transcript: str
    media_url: Optional[str] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    location_lat: Optional[float] = None
    location_long: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)

class IncidentResponse(BaseModel):
    id: int
    call_id: int
    status: IncidentStatus
    priority_score: int
    created_at: datetime
    category: Optional[IncidentCategory] = None
    summary: Optional[str] = None
    call: Optional[EmergencyCallResponse] = None

    model_config = ConfigDict(from_attributes=True)

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import IncidentStatus, IncidentCategory, ResponderStatus

# Shared properties
class Location(BaseModel):
    lat: float
    long: float

# --- Incident Schemas ---

class IncidentCreate(BaseModel):
    description: str
    location: Optional[Location] = None
    reporter_id: Optional[str] = None

class IncidentUpdate(BaseModel):
    status: Optional[IncidentStatus] = None
    priority_score: Optional[int] = Field(None, ge=1, le=10)

class EmergencyCallResponse(BaseModel):
    call_id: int
    timestamp: datetime
    caller_phone: Optional[str] = None
    raw_transcript: str
    media_url: Optional[str] = None
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

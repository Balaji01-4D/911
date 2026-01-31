from typing import Optional
from pydantic import BaseModel
from app.models.enums import ResponderStatus, ResponderType

class ResponderBase(BaseModel):
    name: str
    type: ResponderType
    latitude: float
    longitude: float

class ResponderCreate(ResponderBase):
    pass

class ResponderUpdateLocation(BaseModel):
    latitude: float
    longitude: float

class ResponderResponse(ResponderBase):
    id: int
    status: ResponderStatus
    current_incident_id: Optional[int] = None
    distance: Optional[float] = None

    class Config:
        from_attributes = True

class DispatchRequest(BaseModel):
    responder_id: int
    incident_id: int

class RecommendationRequest(BaseModel):
    incident_id: int

class RecommendationResponse(BaseModel):
    recommended_type: ResponderType
    reasoning: str

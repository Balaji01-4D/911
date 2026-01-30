from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Responder, Incident
from app.models.enums import ResponderStatus, ResponderType, IncidentStatus
from app.schemas.responder import ResponderResponse, ResponderUpdateLocation, DispatchRequest, RecommendationRequest, RecommendationResponse
from app.utils.distance import calculate_haversine_distance
from app.ai.client import recommend_response_unit
import random

router = APIRouter()

@router.post("/recommend", response_model=RecommendationResponse)
async def recommend_responder(
    request: RecommendationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Use AI to determine the best responder type for an incident.
    """
    result = await db.execute(select(Incident).where(Incident.id == request.incident_id))
    incident = result.scalars().first()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    # Prepare context for AI
    context = {
        "description": incident.summary,
        "category": incident.category.value if incident.category else "unknown",
        "priority": incident.priority_score
    }
    
    recommendation = await recommend_response_unit(context)
    
    return recommendation

@router.get("/nearby", response_model=List[ResponderResponse])
async def get_nearby_responders(
    latitude: float,
    longitude: float,
    radius_km: float = 10.0,
    type: Optional[ResponderType] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get nearby IDLE responders sorted by distance.
    """
    query = select(Responder).where(Responder.status == ResponderStatus.IDLE)
    
    if type:
        query = query.where(Responder.type == type)
    
    result = await db.execute(query)
    responders = result.scalars().all()
    
    # Calculate distances and filter
    nearby_responders = []
    for responder in responders:
        if responder.latitude is not None and responder.longitude is not None:
            dist = calculate_haversine_distance(
                latitude, longitude, 
                responder.latitude, responder.longitude
            )
            if dist <= radius_km:
                # Add distance attribute dynamically for sorting (won't be in response model by default but useful)
                responder.distance = dist 
                nearby_responders.append(responder)
    
    # Sort by distance
    nearby_responders.sort(key=lambda x: x.distance)
    
    return nearby_responders

@router.post("/dispatch", response_model=ResponderResponse)
async def dispatch_responder(
    dispatch_data: DispatchRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Dispatch a responder to an incident.
    """
    # Fetch responder
    result = await db.execute(select(Responder).where(Responder.id == dispatch_data.responder_id))
    responder = result.scalars().first()
    
    if not responder:
        raise HTTPException(status_code=404, detail="Responder not found")
        
    if responder.status != ResponderStatus.IDLE:
        raise HTTPException(status_code=400, detail="Responder is not IDLE")
        
    # Fetch incident
    result = await db.execute(select(Incident).where(Incident.id == dispatch_data.incident_id))
    incident = result.scalars().first()
        
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Update states
    responder.status = ResponderStatus.DISPATCHED
    responder.current_incident_id = incident.id
    
    incident.status = IncidentStatus.DISPATCHED
    
    db.add(responder)
    db.add(incident)
    await db.commit()
    await db.refresh(responder)
    
    return responder

@router.patch("/{id}/location", response_model=ResponderResponse)
async def update_responder_location(
    id: int,
    location: ResponderUpdateLocation,
    db: AsyncSession = Depends(get_db)
):
    """
    Update responder's real-time location.
    """
    result = await db.execute(select(Responder).where(Responder.id == id))
    responder = result.scalars().first()
    
    if not responder:
        raise HTTPException(status_code=404, detail="Responder not found")
        
    responder.latitude = location.latitude
    responder.longitude = location.longitude
    
    db.add(responder)
    await db.commit()
    await db.refresh(responder)
    
    return responder

@router.post("/seed", status_code=201)
async def seed_responders(
    lat: float = 40.7128, 
    long: float = -74.0060,
    db: AsyncSession = Depends(get_db)
):
    """
    Seed dummy responders around a central point.
    """
    # Check if already seeded
    result = await db.execute(select(Responder))
    existing = result.scalars().first()
    if existing:
        return {"message": "Responders already exist"}
        
    def random_point(lat, long, radius_km=5):
        # Rough approximation
        mdelta = radius_km / 111.0
        return (
            lat + random.uniform(-mdelta, mdelta),
            long + random.uniform(-mdelta, mdelta)
        )

    responders_data = [
        ("Unit-101", ResponderType.POLICE),
        ("Unit-102", ResponderType.POLICE),
        ("Unit-103", ResponderType.POLICE),
        ("Engine-21", ResponderType.FIRE),
        ("Engine-22", ResponderType.FIRE),
        ("Ladder-5", ResponderType.FIRE),
        ("Medic-51", ResponderType.MEDICAL),
        ("Medic-52", ResponderType.MEDICAL),
        ("Medic-53", ResponderType.MEDICAL),
        ("Ambulance-4", ResponderType.MEDICAL),
    ]
    
    created = []
    for name, r_type in responders_data:
        r_lat, r_long = random_point(lat, long)
        responder = Responder(
            name=name,
            type=r_type,
            status=ResponderStatus.IDLE,
            latitude=r_lat,
            longitude=r_long
        )
        db.add(responder)
        created.append(responder)
        
    await db.commit()
    return {"message": f"Seeded {len(created)} responders"}

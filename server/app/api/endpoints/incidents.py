from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc
from app.core.database import get_db
from app.models.models import Incident, EmergencyCall
from app.models.enums import IncidentStatus, IncidentCategory
from app.schemas.incident import IncidentCreate, IncidentResponse, IncidentUpdate

router = APIRouter()

@router.post("/", response_model=IncidentResponse, status_code=201)
async def create_incident(
    incident_in: IncidentCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new incident.
    Accepts description, location, reporter_id.
    """
    # 1. Create the EmergencyCall record
    db_call = EmergencyCall(
        raw_transcript=incident_in.description,
        caller_phone=incident_in.reporter_id,
        location_lat=incident_in.location.lat if incident_in.location else None,
        location_long=incident_in.location.long if incident_in.location else None
        # timestamp is set by server_default
    )
    db.add(db_call)
    await db.flush() # Flush to get the call_id

    # 2. Create the Incident record linked to the call
    db_incident = Incident(
        call_id=db_call.call_id,
        status=IncidentStatus.PENDING,
        priority_score=1, # Default starting score
        summary=incident_in.description # Initial summary is the description
    )
    
    # TODO: Call AI Brain
    # Here we would call the AI service to analyze the description/transcript
    # to determine the category, severity, and generate a better summary.
    
    db.add(db_incident)
    await db.commit()
    await db.refresh(db_incident)
    
    # Refresh to load relationships if needed (though eager loading setup might differ)
    # Re-fetch with eager load to ensure response matches schema with nested objects
    result = await db.execute(
        select(Incident).where(Incident.id == db_incident.id).options(
            # dependent relations loading strategy if needed, e.g. .joinedload(Incident.call)
            # For now default lazy loading might not work in async if session closed? 
            # Actually asyncpg requires explicit loading or joinedload usually for relations accessed after session.
            # But the 'response_model' will trigger access inside the route while session open? 
            # Better to be explicit:
        )
    )
    # Actually, we should just return db_incident, but let's ensure 'call' is loaded for the response model
    # SQLAlchemy Async usually requires explicit loading.
    # Let's do a select with joinedload
    from sqlalchemy.orm import joinedload
    query = select(Incident).where(Incident.id == db_incident.id).options(joinedload(Incident.call))
    result = await db.execute(query)
    incident = result.scalars().first()
    
    return incident

@router.get("/", response_model=List[IncidentResponse])
async def read_incidents(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve incidents.
    Sorted by severity_score (priority_score) Descending, then created_at Ascending.
    """
    from sqlalchemy.orm import joinedload
    query = (
        select(Incident)
        .options(joinedload(Incident.call))
        .order_by(desc(Incident.priority_score), asc(Incident.created_at))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    incidents = result.scalars().all()
    return incidents

@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: int,
    incident_in: IncidentUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update incident status or manually override priority_score.
    """
    from sqlalchemy.orm import joinedload
    # Fetch existing
    query = select(Incident).where(Incident.id == incident_id).options(joinedload(Incident.call))
    result = await db.execute(query)
    incident = result.scalars().first()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    update_data = incident_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(incident, field, value)

    db.add(incident)
    await db.commit()
    await db.refresh(incident)
    return incident

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc
from app.core.database import get_db
from app.models.models import Incident, EmergencyCall
from app.models.enums import IncidentStatus, IncidentCategory
from app.schemas.incident import IncidentCreate, IncidentResponse, IncidentUpdate
from app.ai.client import analyze_incident_description
import shutil
import os
import uuid

router = APIRouter()

@router.post("", response_model=IncidentResponse, status_code=201)
async def create_incident(
    description: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    reporter_id: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new incident with optional file uploads.
    """
    image_path = None
    audio_path = None
    
    if image:
        filename = f"{uuid.uuid4()}_{image.filename}"
        save_path = f"uploads/images/{filename}"
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_path = save_path
        
    if audio:
        filename = f"{uuid.uuid4()}_{audio.filename}"
        save_path = f"uploads/voice/{filename}"
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        audio_path = save_path

    # 1. Create the EmergencyCall record
    db_call = EmergencyCall(
        raw_transcript=description,
        caller_phone=reporter_id,
        location_lat=latitude,
        location_long=longitude,
        media_url=image_path or audio_path, # Legacy support
        image_url=image_path,
        audio_url=audio_path
    )
    db.add(db_call)
    await db.flush()

    # AI Analysis
    analysis = await analyze_incident_description(description)

    # 2. Create the Incident record linked to the call
    db_incident = Incident(
        call_id=db_call.call_id,
        status=IncidentStatus.PENDING,
        priority_score=analysis.get("priority_score", 1),
        summary=analysis.get("summary", description),
        category=analysis.get("category")
    )
    
    db.add(db_incident)
    await db.commit()
    await db.refresh(db_incident)
    
    from sqlalchemy.orm import joinedload
    query = select(Incident).where(Incident.id == db_incident.id).options(joinedload(Incident.call))
    result = await db.execute(query)
    incident = result.scalars().first()
    
    return incident

@router.get("", response_model=List[IncidentResponse])
async def read_incidents(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
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
    
    # Add filtering
    if category:
        try:
            category_enum = IncidentCategory(category)
            query = query.where(Incident.category == category_enum)
        except ValueError:
            pass  # Invalid category, ignore filter
    
    if status:
        try:
            status_enum = IncidentStatus(status)
            query = query.where(Incident.status == status_enum)
        except ValueError:
            pass  # Invalid status, ignore filter
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

@router.get("/geojson")
async def get_incidents_geojson(
    category: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Get incidents as GeoJSON FeatureCollection for map rendering.
    Optimized for map libraries like Mapbox/MapLibre.
    """
    from sqlalchemy.orm import joinedload
    from datetime import datetime
    
    query = (
        select(Incident)
        .options(joinedload(Incident.call))
        .order_by(desc(Incident.created_at))
        .limit(500)  # Reasonable limit for map performance
    )
    
    # Add filters
    if category:
        try:
            category_enum = IncidentCategory(category)
            query = query.where(Incident.category == category_enum)
        except ValueError:
            pass
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.where(Incident.created_at >= start_dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.where(Incident.created_at <= end_dt)
        except ValueError:
            pass
    
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    # Build GeoJSON FeatureCollection
    features = []
    for incident in incidents:
        if incident.call.location_lat and incident.call.location_long:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [incident.call.location_long, incident.call.location_lat]
                },
                "properties": {
                    "id": incident.id,
                    "category": incident.category.value if incident.category else None,
                    "status": incident.status.value,
                    "priority_score": incident.priority_score,
                    "created_at": incident.created_at.isoformat(),
                    "summary": incident.summary,
                    "caller_phone": incident.call.caller_phone
                }
            })
    
    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "total_features": len(features),
            "generated_at": datetime.utcnow().isoformat()
        }
    }

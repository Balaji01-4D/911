from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.models import Incident
from app.ai.analytics import analyze_incident_clusters, generate_risk_predictions
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload

router = APIRouter()

@router.get("/clusters")
async def get_incident_clusters(
    category: Optional[str] = Query(None),
    days_back: int = Query(7, description="Number of days to look back for clustering"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get AI-powered incident clusters based on geographic proximity, 
    category similarity, and temporal patterns.
    """
    # Query incidents from the specified time range
    cutoff_date = datetime.utcnow() - timedelta(days=days_back)
    
    query = (
        select(Incident)
        .options(joinedload(Incident.call))
        .where(Incident.created_at >= cutoff_date)
        .order_by(desc(Incident.created_at))
        .limit(50)  # Limit for performance
    )
    
    if category:
        from app.models.enums import IncidentCategory
        try:
            category_enum = IncidentCategory(category)
            query = query.where(Incident.category == category_enum)
        except ValueError:
            pass  # Invalid category, ignore filter
    
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    # Convert to dict format for AI analysis
    incidents_data = []
    for incident in incidents:
        incidents_data.append({
            "id": incident.id,
            "category": incident.category.value if incident.category else None,
            "priority_score": incident.priority_score,
            "created_at": incident.created_at.isoformat(),
            "status": incident.status.value,
            "summary": incident.summary,
            "call": {
                "location_lat": incident.call.location_lat,
                "location_long": incident.call.location_long,
                "raw_transcript": incident.call.raw_transcript
            }
        })
    
    # Use AI to analyze and create clusters
    clusters = await analyze_incident_clusters(incidents_data)
    
    return {
        "clusters": clusters,
        "total_incidents_analyzed": len(incidents_data),
        "analysis_period_days": days_back,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/predictions")
async def get_risk_predictions(
    hours_ahead: int = Query(24, description="Hours ahead to predict"),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate AI-powered risk predictions for future incidents
    based on historical patterns and trends.
    """
    # Query historical data (last 30 days for pattern analysis)
    cutoff_date = datetime.utcnow() - timedelta(days=30)
    
    query = (
        select(Incident)
        .options(joinedload(Incident.call))
        .where(Incident.created_at >= cutoff_date)
        .order_by(desc(Incident.created_at))
        .limit(100)  # More data for better predictions
    )
    
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    # Convert to dict format for AI analysis
    historical_data = []
    for incident in incidents:
        historical_data.append({
            "id": incident.id,
            "category": incident.category.value if incident.category else None,
            "priority_score": incident.priority_score,
            "created_at": incident.created_at.isoformat(),
            "status": incident.status.value,
            "summary": incident.summary,
            "call": {
                "location_lat": incident.call.location_lat,
                "location_long": incident.call.location_long,
                "raw_transcript": incident.call.raw_transcript
            }
        })
    
    # Use AI to generate predictions
    predictions = await generate_risk_predictions(historical_data)
    
    return {
        "predictions": predictions,
        "prediction_horizon_hours": hours_ahead,
        "based_on_incidents": len(historical_data),
        "generated_at": datetime.utcnow().isoformat()
    }

@router.get("/summary")
async def get_analytics_summary(db: AsyncSession = Depends(get_db)):
    """
    Get a summary of key analytics metrics
    """
    # Last 24 hours
    last_24h = datetime.utcnow() - timedelta(hours=24)
    # Last 7 days  
    last_7d = datetime.utcnow() - timedelta(days=7)
    
    # Query recent incidents
    recent_query = (
        select(Incident)
        .where(Incident.created_at >= last_24h)
    )
    
    weekly_query = (
        select(Incident)
        .where(Incident.created_at >= last_7d)
    )
    
    recent_result = await db.execute(recent_query)
    weekly_result = await db.execute(weekly_query)
    
    recent_incidents = recent_result.scalars().all()
    weekly_incidents = weekly_result.scalars().all()
    
    # Calculate metrics
    total_24h = len(recent_incidents)
    total_7d = len(weekly_incidents)
    
    avg_severity_24h = sum(i.priority_score for i in recent_incidents) / max(1, total_24h)
    avg_severity_7d = sum(i.priority_score for i in weekly_incidents) / max(1, total_7d)
    
    # Count by status
    status_counts = {}
    for incident in recent_incidents:
        status = incident.status.value
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # Count by category
    category_counts = {}
    for incident in weekly_incidents:
        if incident.category:
            category = incident.category.value
            category_counts[category] = category_counts.get(category, 0) + 1
    
    return {
        "summary": {
            "incidents_24h": total_24h,
            "incidents_7d": total_7d,
            "avg_severity_24h": round(avg_severity_24h, 1),
            "avg_severity_7d": round(avg_severity_7d, 1),
            "status_distribution": status_counts,
            "category_distribution": dict(list(category_counts.items())[:5])  # Top 5
        },
        "timestamp": datetime.utcnow().isoformat()
    }

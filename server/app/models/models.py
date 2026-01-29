from sqlalchemy import Column, Integer, String, Text, Enum as SQLEnum, DateTime, ForeignKey, Numeric, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base
from app.models.enums import ResponderStatus, IncidentStatus, IncidentCategory

class Responder(Base):
    __tablename__ = "responders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    department = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    status = Column(SQLEnum(ResponderStatus), default=ResponderStatus.IDLE)
    current_lat = Column(Float, nullable=True)
    current_long = Column(Float, nullable=True)

class EmergencyCall(Base):
    __tablename__ = "emergency_calls"

    call_id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    caller_phone = Column(String, nullable=True)
    raw_transcript = Column(Text, nullable=False)
    media_url = Column(Text, nullable=True)
    location_lat = Column(Float, nullable=True)
    location_long = Column(Float, nullable=True)
    
    # Relationships
    incidents = relationship("Incident", back_populates="call")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("emergency_calls.call_id"), nullable=False, unique=True)
    status = Column(SQLEnum(IncidentStatus), default=IncidentStatus.PENDING)
    priority_score = Column(Integer, default=0) # 1 - 10
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    category = Column(SQLEnum(IncidentCategory), nullable=True)
    summary = Column(Text, nullable=True)

    # Relationships
    call = relationship("EmergencyCall", back_populates="incidents")

import asyncio
import sys
import os
import random
from sqlalchemy import text

# Add server directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import AsyncSessionLocal
from app.models.models import Incident, EmergencyCall
from app.models.enums import IncidentStatus, IncidentCategory

# Center of Chennai (matching other scripts)
CENTER_LAT = 13.0827
CENTER_LONG = 80.2707
RADIUS_KM = 6.0 

def random_point(lat, long, radius_km=5):
    # 1 deg lat ~= 111km
    mdelta = radius_km / 111.0
    return (
        lat + random.uniform(-mdelta, mdelta),
        long + random.uniform(-mdelta, mdelta)
    )

INCIDENT_DATA = [
    {
        "transcript": "Help! My father is having severe chest pains and trouble breathing. He just collapsed in the living room.",
        "category": IncidentCategory.MEDICAL_EMERGENCY,
        "priority": 9,
        "summary": "Male, 60s, suspected cardiac arrest",
        "phone": "+91 98765 43210"
    },
    {
        "transcript": "There is a large fire breaking out on the second floor of the apartment complex. I see black smoke everywhere!",
        "category": IncidentCategory.FIRE,
        "priority": 10,
        "summary": "Structure fire, multi-story residential building",
        "phone": "+91 91234 56789"
    },
    {
        "transcript": "Two cars just collided at the intersection. One person looks stuck inside and is bleeding from the head.",
        "category": IncidentCategory.MEDICAL_EMERGENCY,
        "priority": 8,
        "summary": "MVA with entrapment and head injury",
        "phone": "+91 99887 76655"
    },
    {
        "transcript": "A tree fell on the power lines, there are sparks flying everywhere near the petrol bunk.",
        "category": IncidentCategory.FIRE,
        "priority": 9,
        "summary": "Electrical hazard/Fire risk near fuel station",
        "phone": "+91 88888 22222"
    },
    {
        "transcript": "I found an elderly woman wandering on the road, she seems confused and dehydrated.",
        "category": IncidentCategory.MEDICAL_EMERGENCY,
        "priority": 4,
        "summary": "Disoriented elderly female, non-critical",
        "phone": "+91 77777 33333"
    }
]

async def seed():
    print("Connecting to database...")
    
    # We won't drop tables here to avoid killing Responders, just clear Incidents/Calls
    async with AsyncSessionLocal() as db:
        print("Clearing existing incidents and calls...")
        try:
            # Delete incidents first due to foreign key constraint
            await db.execute(text("TRUNCATE TABLE incidents CASCADE")) 
            await db.execute(text("TRUNCATE TABLE emergency_calls CASCADE"))
        except Exception as e:
            print(f"Truncate failed ({e}), trying DELETE...")
            await db.execute(text("DELETE FROM incidents"))
            await db.execute(text("DELETE FROM emergency_calls"))
            
        await db.commit()
        
        print(f"Seeding {len(INCIDENT_DATA)} incidents around Chennai...")
        
        count = 0
        for data in INCIDENT_DATA:
            lat, long = random_point(CENTER_LAT, CENTER_LONG, RADIUS_KM)
            
            # Create Call
            call = EmergencyCall(
                raw_transcript=data["transcript"],
                caller_phone=data["phone"],
                location_lat=lat,
                location_long=long,
            )
            db.add(call)
            await db.flush() # flush to get call_id
            
            incident = Incident(
                call_id=call.call_id,
                status=IncidentStatus.PENDING,
                priority_score=data["priority"],
                category=data["category"],
                summary=data["summary"]
            )
            db.add(incident)
            count += 1
            
        await db.commit()
        print(f"Successfully populated {count} incidents!")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    try:
        asyncio.run(seed())
    except ImportError as e:
        print(f"Import Error: {e}") 
    except Exception as e:
        print(f"Error: {e}")

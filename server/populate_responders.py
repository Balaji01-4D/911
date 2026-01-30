import asyncio
import sys
import os
import random
from sqlalchemy import text

# Add server directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import AsyncSessionLocal, engine
from app.models.models import Responder
from app.models.enums import ResponderType, ResponderStatus
from app.models.base import Base

# Center of Chennai (from IncidentMap.tsx)
CENTER_LAT = 13.0827
CENTER_LONG = 80.2707
RADIUS_KM = 8.0 # Spread them out a bit

def random_point(lat, long, radius_km=5):
    # 1 deg lat ~= 111km
    mdelta = radius_km / 111.0
    return (
        lat + random.uniform(-mdelta, mdelta),
        long + random.uniform(-mdelta, mdelta)
    )

UNITS = [
    ("PCR-Alpha", ResponderType.POLICE),
    ("PCR-Bravo", ResponderType.POLICE),
    ("Traffic-1", ResponderType.POLICE),
    ("SWAT-Team", ResponderType.POLICE),
    ("Fire-Red-1", ResponderType.FIRE),
    ("Fire-Red-2", ResponderType.FIRE),
    ("Rescue-1", ResponderType.FIRE),
    ("Amb-108-A", ResponderType.MEDICAL),
    ("Amb-108-B", ResponderType.MEDICAL),
    ("Amb-Private-1", ResponderType.MEDICAL),
    ("Paramedic-Bike", ResponderType.MEDICAL),
    ("First-Response-ZR", ResponderType.POLICE),
]

async def seed():
    print("Connecting to database...")
    
    # Re-create table to ensure schema is up to date
    async with engine.begin() as conn:
        print("Dropping responders table and enums to ensure clean schema...")
        await conn.execute(text("DROP TABLE IF EXISTS responders CASCADE"))
        
        # Drop Enums if they exist (Postgres specific)
        # Note: We need to drop dependent tables first or cascade, which we did for responders.
        # But other tables might use these Enums if we were fully resetting.
        # For now, we assume this script is for responders mainly.
        try:
            await conn.execute(text("DROP TYPE IF EXISTS responderstatus CASCADE"))
            await conn.execute(text("DROP TYPE IF EXISTS respondertype CASCADE"))
            # We don't drop Incident types here as we might break Incidents table if we don't drop it too.
            # But "DISPATCHED" failed for ResponderStatus.
        except Exception as e:
            print(f"Warning dropping types: {e}")

        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print(f"Seeding {len(UNITS)} units around Chennai ({CENTER_LAT}, {CENTER_LONG})...")
        
        count = 0
        for name, r_type in UNITS:
            lat, long = random_point(CENTER_LAT, CENTER_LONG, RADIUS_KM)
            
            unit = Responder(
                name=name,
                type=r_type,
                status=ResponderStatus.IDLE,
                latitude=lat,
                longitude=long
            )
            db.add(unit)
            count += 1
            
        await db.commit()
        print(f"Successfully populated {count} responders!")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    try:
        asyncio.run(seed())
    except ImportError as e:
        print(f"Import Error: {e}")
        print("Make sure you are running this from the 'server' directory.")
        print("Usage: python populate_responders.py")
    except Exception as e:
        print(f"Error: {e}")

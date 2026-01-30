import asyncio
import random
import sys
import os

# Add the parent directory (server) to sys.path to allow imports from app
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from app.core.database import AsyncSessionLocal
from app.models.models import Responder
from app.models.enums import ResponderType, ResponderStatus

# Chennai Coordinates
CHENNAI_LAT_RANGE = (12.9833, 13.1500)  # 12° 59' N to 13° 09' N
CHENNAI_LONG_RANGE = (80.2000, 80.3167) # 80° 12' E to 80° 19' E

# Chengalpattu Coordinates
CHENGALPATTU_LAT_RANGE = (12.2333, 13.0333) # 12° 14' N to 13° 02' N
CHENGALPATTU_LONG_RANGE = (79.5250, 80.2583) # 79° 31' 30" E to 80° 15' 30" E

RESPONDER_TYPES = [ResponderType.POLICE, ResponderType.FIRE, ResponderType.MEDICAL]

def generate_random_coords(lat_range, long_range):
    return (
        random.uniform(lat_range[0], lat_range[1]),
        random.uniform(long_range[0], long_range[1])
    )

async def seed_responders():
    print("Seeding responders...")
    responders_data = []
    
    # Generate 15 responders for Chennai
    for i in range(15):
        lat, long = generate_random_coords(CHENNAI_LAT_RANGE, CHENNAI_LONG_RANGE)
        r_type = random.choice(RESPONDER_TYPES)
        responders_data.append({
            "name": f"Chennai {r_type.value.capitalize()} Unit-{i+1}",
            "type": r_type,
            "status": ResponderStatus.IDLE,
            "latitude": lat,
            "longitude": long
        })

    # Generate 15 responders for Chengalpattu
    for i in range(15):
        lat, long = generate_random_coords(CHENGALPATTU_LAT_RANGE, CHENGALPATTU_LONG_RANGE)
        r_type = random.choice(RESPONDER_TYPES)
        responders_data.append({
            "name": f"Chengalpattu {r_type.value.capitalize()} Unit-{i+1}",
            "type": r_type,
            "status": ResponderStatus.IDLE,
            "latitude": lat,
            "longitude": long
        })

    async with AsyncSessionLocal() as session:
        for data in responders_data:
            responder = Responder(**data)
            session.add(responder)
        
        await session.commit()
        print(f"Successfully added {len(responders_data)} responders.")

if __name__ == "__main__":
    asyncio.run(seed_responders())

from enum import Enum

class ResponderStatus(str, Enum):
    IDLE = "idle"
    DISPATCHED = "dispatched"
    BUSY = "busy"

class ResponderType(str, Enum):
    POLICE = "police"
    FIRE = "fire"
    MEDICAL = "medical"

class IncidentStatus(str, Enum):
    PENDING = "pending"
    DISPATCHED = "dispatched"
    RESOLVED = "resolved"

class IncidentCategory(str, Enum):
    FIRE = "fire"
    MEDICAL_EMERGENCY = "medical_emergency"
    TRAFFIC_ACCIDENT = "traffic_accident"
    CRIME_IN_PROGRESS = "crime_in_progress"
    DOMESTIC_VIOLENCE = "domestic_violence"
    ASSAULT = "assault"
    BURGLARY = "burglary"
    ROBBERY = "robbery"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    MISSING_PERSON = "missing_person"
    OVERDOSE = "overdose"
    NATURAL_DISASTER = "natural_disaster"
    HAZARDOUS_MATERIAL = "hazardous_material"
    PUBLIC_DISTURBANCE = "public_disturbance"
    WELFARE_CHECK = "welfare_check"

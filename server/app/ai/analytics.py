import json
from groq import AsyncGroq
from app.core.config import settings
from typing import List, Dict, Any

# Initialize Groq client following the same pattern as client.py
client = AsyncGroq(api_key=settings.GROQ_API_KEY2)

async def analyze_incident_clusters(incidents_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Use Groq AI to analyze incident patterns and create intelligent clusters
    """
    if not incidents_data:
        return []
    
    prompt = f"""
    Analyze the following emergency incidents and create intelligent clusters based on:
    1. Geographic proximity (lat/long)
    2. Incident type/category similarity
    3. Time patterns
    4. Severity scores
    
    Incidents data:
    {json.dumps(incidents_data[:20], default=str)}  # Limit to avoid token limits
    
    Return a JSON array of clusters with this exact format:
    [
        {{
            "id": "cluster_1",
            "name": "Downtown Fire Cluster",
            "centroid": {{"lat": 40.7128, "lng": -74.0060}},
            "radius": 1000,
            "incident_count": 3,
            "incident_ids": [1, 2, 3],
            "dominant_category": "fire",
            "risk_level": "high",
            "avg_severity": 8.5
        }}
    ]
    
    Create 3-5 meaningful clusters maximum. Only respond with valid JSON.
    """
    
    try:
        completion = await client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
        )
        
        response_text = completion.choices[0].message.content
        # Clean response to extract JSON
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
            
        clusters = json.loads(response_text.strip())
        return clusters
        
    except Exception as e:
        print(f"Error in cluster analysis: {e}")
        # Fallback simple clustering by location
        return create_simple_location_clusters(incidents_data)

async def generate_risk_predictions(historical_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generate future risk predictions using Groq AI
    """
    if not historical_data:
        return []
    
    prompt = f"""
    Based on this historical emergency incident data, predict high-risk zones for the next 24-48 hours.
    Consider:
    1. Historical patterns and hotspots
    2. Time of day trends
    3. Category-specific patterns
    4. Seasonal factors
    
    Historical data sample:
    {json.dumps(historical_data[:15], default=str)}
    
    Return a JSON array of prediction zones with this exact format:
    [
        {{
            "id": "pred_1",
            "lat": 40.7128,
            "lng": -74.0060,
            "risk_score": 0.85,
            "predicted_categories": ["fire", "medical_emergency"],
            "confidence": 0.75,
            "time_window": "18:00-22:00",
            "reason": "Historical high incident rate in this area during evening hours"
        }}
    ]
    
    Generate 5-8 prediction points covering different risk levels. Only respond with valid JSON.
    """
    
    try:
        completion = await client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.4,
        )
        
        response_text = completion.choices[0].message.content
        # Clean response to extract JSON
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
            
        predictions = json.loads(response_text.strip())
        return predictions
        
    except Exception as e:
        print(f"Error in risk prediction: {e}")
        return create_fallback_predictions(historical_data)

def create_simple_location_clusters(incidents_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Fallback clustering when AI fails"""
    if not incidents_data:
        return []
    
    # Simple geographic clustering by grouping nearby incidents
    clusters = []
    processed = set()
    
    for i, incident in enumerate(incidents_data):
        if i in processed or not incident.get('call', {}).get('location_lat'):
            continue
            
        cluster_incidents = [incident]
        base_lat = incident['call']['location_lat']
        base_lng = incident['call']['location_long']
        processed.add(i)
        
        # Find nearby incidents (within ~1km)
        for j, other_incident in enumerate(incidents_data):
            if j in processed or j == i:
                continue
            if not other_incident.get('call', {}).get('location_lat'):
                continue
                
            other_lat = other_incident['call']['location_lat']
            other_lng = other_incident['call']['location_long']
            
            # Simple distance check (rough approximation)
            if abs(base_lat - other_lat) < 0.01 and abs(base_lng - other_lng) < 0.01:
                cluster_incidents.append(other_incident)
                processed.add(j)
        
        if len(cluster_incidents) >= 2:  # Only create cluster if 2+ incidents
            clusters.append({
                "id": f"cluster_{len(clusters) + 1}",
                "name": f"Incident Cluster {len(clusters) + 1}",
                "centroid": {"lat": base_lat, "lng": base_lng},
                "radius": 500,
                "incident_count": len(cluster_incidents),
                "incident_ids": [inc['id'] for inc in cluster_incidents],
                "dominant_category": cluster_incidents[0].get('category', 'unknown'),
                "risk_level": "medium",
                "avg_severity": sum(inc.get('priority_score', 5) for inc in cluster_incidents) / len(cluster_incidents)
            })
    
    return clusters[:5]  # Limit to 5 clusters

def create_fallback_predictions(historical_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Fallback predictions when AI fails"""
    # Create some basic predictions based on historical hotspots
    predictions = []
    
    if historical_data:
        # Take locations from recent incidents and create risk zones
        recent_incidents = historical_data[:8]
        
        for i, incident in enumerate(recent_incidents):
            if incident.get('call', {}).get('location_lat'):
                predictions.append({
                    "id": f"pred_{i + 1}",
                    "lat": incident['call']['location_lat'],
                    "lng": incident['call']['location_long'],
                    "risk_score": min(0.9, (incident.get('priority_score', 5) / 10) + 0.3),
                    "predicted_categories": [incident.get('category', 'unknown')],
                    "confidence": 0.6,
                    "time_window": "All day",
                    "reason": f"Based on recent {incident.get('category', 'incident')} activity"
                })
    
    return predictions[:6]

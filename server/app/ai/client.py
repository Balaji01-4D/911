import json
from groq import AsyncGroq
from app.core.config import settings
from app.models.enums import IncidentCategory

client = AsyncGroq(
    api_key=settings.GROQ_API_KEY,
)

SYSTEM_PROMPT = f"""
You are an expert emergency response dispatcher AI. Your task is to analyze incoming incident descriptions and extract structured information.
You must output a JSON object with the following fields:
1. "priority_score": An integer from 1 to 10 indicating the severity (10 being most critical/life-threatening).
2. "category": The most appropriate category from the following list: {', '.join([c.value for c in IncidentCategory])}.
3. "summary": A concise, factual summary of the incident (max 15 words) suitable for a quick notification.

If the input is unclear or doesn't match a clear emergency, make a best guess but keep priority appropriate.
Ensure strict JSON format.
"""

async def analyze_incident_description(description: str) -> dict:
    try:
        completion = await client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": description,
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        
        response_content = completion.choices[0].message.content
        return json.loads(response_content)
    except Exception as e:
        print(f"Error analyzing incident: {e}")
        # Fallback values
        return {
            "priority_score": 5,
            "category": "suspicious_activity",
            "summary": "Processing failed, check details."
        }

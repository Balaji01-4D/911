import axios from 'axios';

export const BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
});

export const fetchIncidents = async () => {
  const response = await api.get('/incidents', { params: { limit: 100 } });
  return response.data;
};

export const fetchIncidentsGeoJSON = async (params?: { category?: string }) => {
  const response = await api.get('/incidents/geojson', { params });
  return response.data;
};

export const updateIncidentStatus = async (id: number, status: string) => {
  const response = await api.patch(`/incidents/${id}`, { status });
  return response.data;
};

export const fetchClusters = async (daysBack = 7) => {
  const response = await api.get('/analytics/clusters', { params: { days_back: daysBack } });
  return response.data; // Returns { clusters: [...] }
};

export const fetchPredictions = async (hoursAhead = 24) => {
   const response = await api.get('/analytics/predictions', { params: { hours_ahead: hoursAhead } });
   return response.data; // Returns { predictions: [...] }
};

export const fetchAnalyticsSummary = async () => {
   const response = await api.get('/analytics/summary');
   return response.data;
};

export const fetchNearbyResponders = async (lat: number, long: number, radius = 50) => {
    const response = await api.get('/responders/nearby', { 
        params: { latitude: lat, longitude: long, radius_km: radius } 
    });
    return response.data;
};

export const dispatchResponder = async (responderId: number, incidentId: number) => {
    const response = await api.post('/responders/dispatch', { 
        responder_id: responderId, 
        incident_id: incidentId 
    });
    return response.data;
};

export const getResponderRecommendation = async (incidentId: number) => {
    const response = await api.post('/responders/recommend', { incident_id: incidentId });
    return response.data; // { recommended_type: 'fire', reasoning: '...' }
};

export interface DetailedAnalysis {
    situation: string;
    equipment: string[];
    responders_count: Record<string, number>;
    rescue_type: string;
    instructions: string[];
}

export const getIncidentAnalysis = async (incidentId: number): Promise<DetailedAnalysis> => {
    const response = await api.get(`/incidents/${incidentId}/analysis`);
    return response.data;
};

export interface Responder {
    id: number;
    name: string;
    type: 'police' | 'fire' | 'medical';
    status: 'idle' | 'dispatched' | 'busy';
    latitude: number;
    longitude: number;
    current_incident_id?: number | null;
    distance?: number; // Added by backend helper
}

export interface EmergencyCall {
  call_id: number;
  timestamp: string;
  caller_phone?: string;
  raw_transcript: string;
  media_url?: string;
  image_url?: string;
  audio_url?: string;
  location_lat?: number;
  location_long?: number;
}

export interface Incident {
  id: number;
  call_id: number;
  status: 'pending' | 'dispatched' | 'resolved';
  priority_score: number; // 1-10
  created_at: string;
  category?: string;
  summary?: string;
  call: EmergencyCall;
}

export interface Cluster {
   id: string;
   name: string;
   centroid: { lat: number; lng: number };
   radius: number;
   incident_count: number;
   incident_ids: number[];
   dominant_category: string;
   risk_level: string;
   avg_severity: number;
}

export interface Prediction {
   id: string;
   lat: number;
   lng: number;
   risk_score: number;
   predicted_categories: string[];
   confidence: number;
   time_window: string;
   reason: string;
}

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

export const fetchIncidents = async () => {
  const response = await api.get('/incidents');
  return response.data;
};

export const updateIncidentStatus = async (id: number, status: string) => {
  const response = await api.patch(`/incidents/${id}`, { status });
  return response.data;
};

export interface Incident {
  id: number;
  call_id: number;
  status: 'pending' | 'dispatched' | 'resolved';
  priority_score: number; // 1-10
  created_at: string;
  category: string;
  summary: string;
  call: {
    raw_transcript: string;
    caller_phone: string;
    location_lat: number;
    location_long: number;
  }
}

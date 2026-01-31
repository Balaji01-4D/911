import { endpoints } from '@/constants/Api';

export type ReportPayload = {
  description: string;
  latitude: number | null;
  longitude: number | null;
  reporter_id: string | null;
  audioUri: string | null;
  imageUri: string | null;
};

export async function submitReport(payload: ReportPayload) {
  const formData = new FormData();

  formData.append('description', payload.description);
  
  if (payload.latitude) formData.append('latitude', payload.latitude.toString());
  if (payload.longitude) formData.append('longitude', payload.longitude.toString());
  if (payload.reporter_id) formData.append('reporter_id', payload.reporter_id);

  if (payload.audioUri) {
    const filename = payload.audioUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const type = match ? `audio/${match[1]}` : `audio`;
    
    // @ts-ignore
    formData.append('audio', {
      uri: payload.audioUri,
      name: filename || 'recording.m4a',
      type,
    });
  }

  if (payload.imageUri) {
    const filename = payload.imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const type = match ? `image/${match[1]}` : `image`;

    // @ts-ignore
    formData.append('image', {
      uri: payload.imageUri,
      name: filename || 'photo.jpg',
      type,
    });
  }

  try {
    const response = await fetch(endpoints.incidents, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

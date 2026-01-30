import { useMemo, useState, useEffect, useRef } from 'react';
import Map, { Marker, NavigationControl, Source, Layer, Popup, MapRef } from 'react-map-gl/maplibre';
import type { LayerProps } from 'react-map-gl/maplibre';
import { Incident, fetchPredictions, Prediction, Responder } from '@/lib/api';
import { MapPin, AlertTriangle, Flame, TrendingUp, Shield, Stethoscope, Car } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useNearbyResponders } from '@/hooks/useResponders';

interface IncidentMapProps {
  incidents: Incident[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const HEATMAP_LAYER: LayerProps = {
    id: 'heatmap',
    maxzoom: 15,
    type: 'heatmap',
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 0, 6, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(33,102,172,0)',
        0.2,
        'rgb(103,169,207)',
        0.4,
        'rgb(209,229,240)',
        0.6,
        'rgb(253,219,199)',
        0.8,
        'rgb(239,138,98)',
        1,
        'rgb(178,24,43)'
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 14, 1, 15, 0]
    }
  };

const PREDICTION_LAYER: LayerProps = {
    id: 'prediction-points',
    type: 'circle',
    paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 5, 15, 30],
        'circle-color': '#f38ba8',
        'circle-opacity': 0.4,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#f38ba8',
        'circle-blur': 0.2
    }
};


export default function IncidentMap({ incidents, selectedId, onSelect }: IncidentMapProps) {
  const mapRef = useRef<MapRef>(null);
  const hasCentered = useRef(false);
  const [viewMode, setViewMode] = useState<'standard' | 'heatmap' | 'prediction'>('standard');
  const [popupInfo, setPopupInfo] = useState<Incident | null>(null);

  // Active Incident Logic
  const activeIncident = useMemo(() => 
    incidents.find(i => i.id === selectedId), 
    [incidents, selectedId]
  );
  
  const { data: responders } = useNearbyResponders(
    activeIncident?.call?.location_lat, 
    activeIncident?.call?.location_long,
    !!activeIncident
  );

  // Fetch predictions
  const { data: predictionsData } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => fetchPredictions(24),
    enabled: viewMode === 'prediction'
  });

  // Filter incidents with location
  const mapIncidents = useMemo(() => {
    return incidents.filter(i => 
      i.call?.location_lat && i.call?.location_long
    );
  }, [incidents]);

  // Auto-center map when incidents load (only once)
  useEffect(() => {
    if (mapRef.current && mapIncidents.length > 0 && !hasCentered.current) {
        // If we have incidents, center on the first one or calculate simple bounds
        const { location_lat, location_long } = mapIncidents[0].call!;
        mapRef.current.flyTo({
            center: [location_long!, location_lat!],
            zoom: 12,
            duration: 2000
        });
        hasCentered.current = true;
    } else if (mapRef.current && !hasCentered.current && mapIncidents.length === 0) {
        // Fallback center
         mapRef.current.flyTo({
            center: [80.2707, 13.0827],
            zoom: 11
        });
        hasCentered.current = true;
    }
  }, [mapIncidents]);

  // GeoJSON for heatmap
  const heatmapData = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: mapIncidents.map(incident => ({
        type: 'Feature',
        properties: { mag: incident.priority_score, id: incident.id },
        geometry: {
          type: 'Point',
          coordinates: [incident.call!.location_long!, incident.call!.location_lat!]
        }
      }))
    };
  }, [mapIncidents]);

  // Real API Prediction Data
  const predictionGeoJSON = useMemo(() => {
     if (!predictionsData?.predictions) return null;
     return {
      type: 'FeatureCollection',
      features: predictionsData.predictions.map((p: Prediction) => ({
        type: 'Feature',
        properties: { ...p },
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat]
        }
      }))
    };
  }, [predictionsData]);

  const initialViewState = {
    longitude: 80.2707,
    latitude: 13.0827,
    zoom: 11
  };
  
  

  return (
    <div className="relative w-full h-full bg-cat-crust">
        {/* Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-cat-base/90 p-2 rounded-lg backdrop-blur-md border border-cat-surface0 shadow-xl">
            <button 
                onClick={() => setViewMode('standard')}
                className={`p-2 rounded-md transition-all flex items-center gap-2 ${viewMode === 'standard' ? 'bg-cat-blue text-cat-base' : 'text-cat-text hover:bg-cat-surface0'}`}
                title="Live Map"
            >
                <MapPin className="w-5 h-5" />
            </button>
            <button 
                onClick={() => setViewMode('heatmap')}
                className={`p-2 rounded-md transition-all flex items-center gap-2 ${viewMode === 'heatmap' ? 'bg-cat-red text-cat-base' : 'text-cat-text hover:bg-cat-surface0'}`}
                title="Heatmap"
            >
                <Flame className="w-5 h-5" />
            </button>
             <button 
                onClick={() => setViewMode('prediction')}
                className={`p-2 rounded-md transition-all flex items-center gap-2 ${viewMode === 'prediction' ? 'bg-cat-mauve text-cat-base' : 'text-cat-text hover:bg-cat-surface0'}`}
                title="Future Predictions"
            >
                <TrendingUp className="w-5 h-5" />
            </button>
        </div>

        {viewMode === 'prediction' && (
             <div className="absolute top-4 left-4 z-10 bg-cat-base/90 p-3 rounded border border-cat-mauve text-cat-mauve text-xs font-mono uppercase tracking-widest animate-pulse shadow-lg pointer-events-none">
                 AI Prediction Model: Active
             </div>
        )}

      <Map
        ref={mapRef}
        initialViewState={initialViewState}
        style={{width: '100%', height: '100%'}}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        // attributionControl={false}
      >
        <NavigationControl position="top-left" />

        {viewMode === 'standard' && mapIncidents.map(incident => (
          <Marker
            key={incident.id}
            longitude={incident.call!.location_long!}
            latitude={incident.call!.location_lat!}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelect(incident.id);
              setPopupInfo(incident);
            }}
          >
            <div className={`
                relative group cursor-pointer 
                ${selectedId === incident.id ? 'scale-125 z-20' : 'hover:scale-110 z-10'} 
                transition-all duration-300
            `}>
                 <div className={`
                    w-8 h-8 rounded-full shadow-lg flex items-center justify-center border-2 border-cat-base
                    ${incident.priority_score > 7 ? 'bg-cat-red animate-bounce' : 'bg-cat-blue'}
                 `}>
                    {incident.priority_score > 7 ? (
                        <AlertTriangle className="w-4 h-4 text-cat-base" />
                    ) : (
                        <MapPin className="w-4 h-4 text-cat-base" />
                    )}
                 </div>
                 {/* Tooltip on hover */}
                 <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-cat-base text-cat-text text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-cat-surface0">
                    ID: {incident.id} • Score: {incident.priority_score}
                 </div>
            </div>
          </Marker>
        ))}

        {viewMode === 'heatmap' && (
            <Source type="geojson" data={heatmapData as any}>
                <Layer {...HEATMAP_LAYER} />
            </Source>
        )}

        {viewMode === 'prediction' && (
             <Source type="geojson" data={predictionGeoJSON as any}>
                <Layer {...PREDICTION_LAYER} />
            </Source>
        )}

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.call!.location_long!}
            latitude={popupInfo.call!.location_lat!}
            onClose={() => setPopupInfo(null)}
            className="text-cat-text"
          >
            <div className="p-2 min-w-[200px]">
              <div className="font-bold text-sm mb-1">Incident #{popupInfo.id}</div>
              <div className="text-xs text-slate-500 mb-2">{format(new Date(popupInfo.created_at), 'HH:mm:ss')}</div>
              <p className="text-sm font-medium leading-snug">{popupInfo.summary || "No summary available"}</p>
              <div className="mt-2 flex gap-2">
                 <button onClick={() => { onSelect(popupInfo.id); setPopupInfo(null); }} className="text-xs bg-cat-blue text-cat-base px-2 py-1 rounded hover:opacity-90 w-full">
                    View Details
                 </button>
              </div>
            </div>
          </Popup>
        )}

        {/* Responder Markers */}
        {responders?.map((responder) => (
             <Marker
                key={`responder-${responder.id}`}
                longitude={responder.longitude}
                latitude={responder.latitude}
                anchor="center"
             >
                <div className={`
                    p-1.5 rounded-full border-2 shadow-sm transition-all
                    ${responder.status === 'idle' ? 'bg-cat-base border-cat-green' : 'bg-cat-surface0 border-cat-overlay0'}
                    ${responder.status === 'dispatched' ? 'animate-pulse' : ''}
                `}>
                    {responder.type === 'police' && <Shield className="w-4 h-4 text-blue-400" />}
                    {responder.type === 'fire' && <Flame className="w-4 h-4 text-red-400" />}
                    {responder.type === 'medical' && <Stethoscope className="w-4 h-4 text-emerald-400" />}
                </div>
             </Marker>
        ))}

        {/* Dispatch Lines */}
        {activeIncident && responders?.map((r) => (
            <Source 
                key={`line-${r.id}`} 
                type="geojson" 
                data={{
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [r.longitude, r.latitude],
                            [activeIncident.call!.location_long!, activeIncident.call!.location_lat!]
                        ]
                    }
                } as any}
            >
                <Layer
                    id={`route-${r.id}`}
                    type="line"
                    paint={{
                        'line-color': r.status === 'dispatched' ? '#a6e3a1' : '#45475a',
                        'line-width': 2,
                        'line-dasharray': [2, 2]
                    }}
                />
            </Source>
        ))}

      </Map>
    </div>
  );
}

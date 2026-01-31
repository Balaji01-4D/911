import { useRef, useMemo } from 'react';
import Map, { Marker, NavigationControl, MapRef } from 'react-map-gl/maplibre';
import { Shield, Flame, Stethoscope } from 'lucide-react';
import { useNearbyResponders } from '@/hooks/useResponders';

const CENTER_LAT = 13.0827;
const CENTER_LONG = 80.2707;

export default function RespondersMap() {
  const mapRef = useRef<MapRef>(null);

  // Fetch responders around the city center
  const { data: responders } = useNearbyResponders(CENTER_LAT, CENTER_LONG, true);

  const initialViewState = {
    longitude: CENTER_LONG,
    latitude: CENTER_LAT,
    zoom: 12
  };

  return (
    <div className="relative w-full h-full bg-cat-crust">
        {/* Title Overlay */}
         <div className="absolute top-4 left-4 z-10 bg-cat-base/90 p-3 rounded-lg border border-cat-surface0 shadow-xl backdrop-blur-md">
             <h2 className="text-cat-text font-bold flex items-center gap-2">
                 <Shield className="w-5 h-5 text-cat-blue" />
                 Active Responders
             </h2>
             <p className="text-xs text-cat-overlay0">Live tracking of all units</p>
         </div>

      <Map
        ref={mapRef}
        initialViewState={initialViewState}
        style={{width: '100%', height: '100%'}}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        {/* Responder Markers */}
        {responders?.map((responder) => (
             <Marker
                key={`responder-${responder.id}`}
                longitude={responder.longitude}
                latitude={responder.latitude}
                anchor="center"
             >
                <div className={`
                    p-2 rounded-full border-2 shadow-sm transition-all cursor-pointer group relative
                    ${responder.status === 'idle' ? 'bg-cat-base border-cat-green' : 'bg-cat-surface0 border-cat-overlay0'}
                    ${responder.status === 'dispatched' ? 'animate-pulse border-cat-yellow' : ''}
                    ${responder.status === 'busy' ? 'bg-cat-mantle border-cat-red' : ''}
                `}>
                    {responder.type === 'police' && <Shield className="w-5 h-5 text-blue-400" />}
                    {responder.type === 'fire' && <Flame className="w-5 h-5 text-red-400" />}
                    {responder.type === 'medical' && <Stethoscope className="w-5 h-5 text-emerald-400" />}
                    
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-cat-base text-cat-text text-xs px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-cat-surface0 shadow-lg z-50">
                        <div className="font-bold">{responder.name}</div>
                        <div className="text-[10px] uppercase text-cat-overlay0">{responder.status}</div>
                    </div>
                </div>
             </Marker>
        ))}
      </Map>
    </div>
  );
}

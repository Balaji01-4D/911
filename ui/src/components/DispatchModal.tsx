import { useState, useEffect, useRef } from 'react';
import { Incident, Responder, getResponderRecommendation } from '@/lib/api';
import { useNearbyResponders, useDispatcher } from '@/hooks/useResponders';
import { X, Shield, Flame, Stethoscope, Navigation, Zap, Radio, Bot } from 'lucide-react'; 
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl/maplibre';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';

interface DispatchModalProps {
    incident: Incident;
    onClose: () => void;
}

export default function DispatchModal({ incident, onClose }: DispatchModalProps) {
    const [aiMode, setAiMode] = useState(true);
    const [selectedResponderId, setSelectedResponderId] = useState<number | null>(null);
    const [hoveredResponderId, setHoveredResponderId] = useState<number | null>(null);
    
    // Fetch Responders
    const { data: respondersData, isLoading } = useNearbyResponders(
        incident.call?.location_lat, 
        incident.call?.location_long,
        true
    );
    
    // Fetch AI Recommendation
    const { data: recommendation, isLoading: isAiLoading } = useQuery({
        queryKey: ['recommendation', incident.id],
        queryFn: () => getResponderRecommendation(incident.id),
        enabled: aiMode,
        staleTime: Infinity
    });

    const responders = respondersData as Responder[] | undefined;
    
    // Filter responders based on AI recommendation if active
    const displayedResponders = aiMode && recommendation 
        ? responders?.filter(r => r.type === recommendation.recommended_type)
        : responders;

    const { mutate: dispatch, isPending: isDispatching } = useDispatcher();

    // AI Logic: Select top eligible responder when AI mode is active
    useEffect(() => {
        if (aiMode && displayedResponders && displayedResponders.length > 0) {
            // Logic: Closest IDLE unit of the recommended type
            const bestUnit = displayedResponders.find((r: Responder) => r.status === 'idle');
            if (bestUnit) {
                setSelectedResponderId(bestUnit.id);
            }
        }
    }, [aiMode, displayedResponders]);

    const handleDispatch = () => {
        if (selectedResponderId) {
            dispatch({ responderId: selectedResponderId, incidentId: incident.id });
            onClose();
        }
    };

    const mapRef = useRef<MapRef>(null);

    // Initial View State centered on incident
    const initialViewState = {
        longitude: incident.call?.location_long || 80.2707,
        latitude: incident.call?.location_lat || 13.0827,
        zoom: 13
    };

    // Auto-focus map to show both incident and selected/hovered responder
    useEffect(() => {
        const targetId = hoveredResponderId || selectedResponderId;
        const target = displayedResponders?.find((r: Responder) => r.id === targetId);

        if (target && mapRef.current && incident.call?.location_long && incident.call?.location_lat) {
            const minLng = Math.min(incident.call.location_long, target.longitude);
            const minLat = Math.min(incident.call.location_lat, target.latitude);
            const maxLng = Math.max(incident.call.location_long, target.longitude);
            const maxLat = Math.max(incident.call.location_lat, target.latitude);

            try {
                mapRef.current.fitBounds(
                    [[minLng, minLat], [maxLng, maxLat]], 
                    { 
                        padding: 100, 
                        duration: 1000,
                        maxZoom: 15
                    }
                );
            } catch (error) {
                console.error("Map bounds error:", error);
            }
        } else if (mapRef.current && incident.call?.location_long && incident.call?.location_lat) {
             // Reset if no target
             mapRef.current.flyTo({
                center: [incident.call.location_long, incident.call.location_lat],
                zoom: 13,
                duration: 1000
             });
        }
    }, [hoveredResponderId, selectedResponderId, displayedResponders]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-5xl h-[600px] bg-cat-base border border-cat-surface0 rounded-xl shadow-2xl flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Left Panel: List */}
                <div className="w-1/3 border-r border-cat-surface0 flex flex-col bg-cat-mantle">
                    <div className="p-4 border-b border-cat-surface0 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-cat-text">Dispatch Unit</h2>
                            <p className="text-xs text-cat-overlay0 font-mono">PRIORITY: {incident.priority_score}/10</p>
                        </div>
                        <button onClick={onClose} className="text-cat-overlay0 hover:text-cat-text transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* AI Toggle */}
                    <div className="p-3 bg-cat-crust border-b border-cat-surface0">
                        <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-cat-surface0 transition-colors">
                            <div className="flex items-center gap-2 text-sm font-bold text-cat-mauve">
                                <Zap className={clsx("w-4 h-4", aiMode && "fill-current")} />
                                AI AUTO-DISPATCH
                            </div>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={aiMode} onChange={(e) => setAiMode(e.target.checked)} />
                                <div className="w-9 h-5 bg-cat-surface1 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cat-mauve"></div>
                            </div>
                        </label>
                        {aiMode && <p className="text-[10px] text-cat-mauve/80 mt-1 px-2">System will analyze incident content to recommend appropriate unit types.</p>}
                        
                        {/* Recommendation Reasoning */}
                        {aiMode && recommendation && (
                            <div className="mt-2 mx-2 p-2 bg-cat-mauve/10 border border-cat-mauve/20 rounded text-xs text-cat-text flex gap-2 items-start animate-in fade-in slide-in-from-top-2">
                                <Bot className="w-4 h-4 text-cat-mauve shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-cat-mauve uppercase">AI Recommendation: {recommendation.recommended_type}</span>
                                    <p className="opacity-80 leading-snug">{recommendation.reasoning}</p>
                                </div>
                            </div>
                        )}
                        
                        {aiMode && isAiLoading && (
                             <div className="mt-2 mx-2 p-2 text-xs text-cat-overlay0 animate-pulse flex items-center gap-2">
                                <span className="w-2 h-2 bg-cat-mauve rounded-full"></span>
                                Analyzing incident context...
                             </div>
                        )}
                    </div>

                    {/* Responders List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {isLoading ? (
                            <div className="text-center py-10 text-cat-overlay0 text-sm">Scanning for nearby units...</div>
                        ) : displayedResponders?.length === 0 ? (
                            <div className="text-center py-10 text-cat-red text-sm font-bold">
                                {aiMode && recommendation ? `NO ${recommendation.recommended_type.toUpperCase()} UNITS IN RANGE` : "NO UNITS IN RANGE"}
                            </div>
                        ) : (
                            displayedResponders?.map((unit: Responder) => {
                                const isSelected = selectedResponderId === unit.id;
                                
                                return (
                                    <div 
                                        key={unit.id}
                                        onClick={() => !aiMode && setSelectedResponderId(unit.id)}
                                        onMouseEnter={() => setHoveredResponderId(unit.id)}
                                        onMouseLeave={() => setHoveredResponderId(null)}
                                        className={clsx(
                                            "p-3 rounded-lg border transition-all cursor-pointer relative group",
                                            isSelected ? "bg-cat-blue/10 border-cat-blue" : "bg-cat-base border-cat-surface0 hover:border-cat-surface1",
                                            unit.status !== 'idle' && "opacity-60 grayscale cursor-not-allowed"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                 <div className={clsx(
                                                    "p-2 rounded border",
                                                    unit.type === 'police' && "bg-blue-950/30 border-blue-900/50 text-blue-400",
                                                    unit.type === 'fire' && "bg-red-950/30 border-red-900/50 text-red-400",
                                                    unit.type === 'medical' && "bg-emerald-950/30 border-emerald-900/50 text-emerald-400",
                                                )}>
                                                    {unit.type === 'police' && <Shield className="w-4 h-4" />}
                                                    {unit.type === 'fire' && <Flame className="w-4 h-4" />}
                                                    {unit.type === 'medical' && <Stethoscope className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-cat-text">{unit.name}</div>
                                                    <div className={clsx("text-[10px] font-mono uppercase", 
                                                        unit.status === 'idle' ? "text-cat-green" : "text-cat-red"
                                                    )}>Status: {unit.status}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                 <div className="flex items-center gap-1 text-cat-blue font-mono text-xs font-bold">
                                                    <Navigation className="w-3 h-3" />
                                                    {unit.distance?.toFixed(1)}km
                                                </div>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute right-2 top-2">
                                                <div className="w-2 h-2 bg-cat-blue rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer Action */}
                    <div className="p-4 border-t border-cat-surface0 bg-cat-crust">
                        <button
                            onClick={handleDispatch}
                            disabled={!selectedResponderId || isDispatching}
                            className="w-full py-3 rounded-lg bg-cat-blue hover:bg-cat-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-cat-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                        >
                            {isDispatching ? (
                                <span className="animate-pulse">Transmitting...</span>
                            ) : (
                                <>
                                    <Radio className="w-4 h-4" />
                                    Confirm Dispatch
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Map Preview */}
                <div className="w-2/3 relative bg-cat-crust">
                    <Map
                        ref={mapRef}
                        initialViewState={initialViewState}
                        style={{width: '100%', height: '100%'}}
                        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                        attributionControl={false}
                        // interactive={true} // Default is true, enabled for zoom/pan
                    >
                        {/* Incident Marker */}
                        <Marker
                            longitude={incident.call!.location_long!}
                            latitude={incident.call!.location_lat!}
                            anchor="bottom"
                        >
                            <div className="relative">
                                <span className="flex h-4 w-4">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cat-red opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-4 w-4 bg-cat-red"></span>
                                </span>
                            </div>
                        </Marker>

                        {/* Responder Markers */}
                        {displayedResponders?.map((r: Responder) => (
                             <Marker
                                key={`r-${r.id}`}
                                longitude={r.longitude}
                                latitude={r.latitude}
                            >
                                <div className={clsx(
                                    "p-1.5 rounded-full border-2 transition-all duration-300",
                                    (hoveredResponderId === r.id || selectedResponderId === r.id) ? "scale-125 z-10" : "scale-100",
                                    r.status === 'idle' ? "bg-cat-base border-cat-green" : "bg-cat-surface0 border-gray-500 opacity-50"
                                )}>
                                    {r.type === 'police' && <Shield className="w-3 h-3 text-blue-400" />}
                                    {r.type === 'fire' && <Flame className="w-3 h-3 text-red-400" />}
                                    {r.type === 'medical' && <Stethoscope className="w-3 h-3 text-emerald-400" />}
                                </div>
                            </Marker>
                        ))}

                        {/* Visual Path for Hovered/Selected */}
                        {(hoveredResponderId || selectedResponderId) && (() => {
                            const targetId = hoveredResponderId || selectedResponderId;
                            const target = displayedResponders?.find((r: Responder) => r.id === targetId);
                            if (!target || !target.longitude) return null;

                            return (
                                <Source 
                                    key="route-line" 
                                    type="geojson" 
                                    data={{
                                        type: 'Feature',
                                        geometry: {
                                            type: 'LineString',
                                            coordinates: [
                                                [target.longitude, target.latitude],
                                                [incident.call!.location_long!, incident.call!.location_lat!]
                                            ]
                                        }
                                    } as any}
                                >
                                    <Layer
                                        id="route-line-layer"
                                        type="line"
                                        paint={{
                                            'line-color': '#f9e2af', // Yellow/Gold for better visibility
                                            'line-width': 4,
                                            'line-opacity': 1
                                        }}
                                    />
                                </Source>
                            );
                        })()}

                    </Map>

                    {/* Map Overlay Text */}
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-cat-text text-xs font-mono p-2 rounded border border-white/10">
                        EST. DISTANCE: {((hoveredResponderId || selectedResponderId) ? displayedResponders?.find((r: Responder) => r.id === (hoveredResponderId || selectedResponderId))?.distance?.toFixed(2) + " km" : "--")}
                    </div>
                </div>
            </div>
        </div>
    );
}

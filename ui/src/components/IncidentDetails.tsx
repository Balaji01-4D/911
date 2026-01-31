import { useState, useEffect } from 'react';
import { Incident, BASE_URL, getIncidentAnalysis, DetailedAnalysis } from '@/lib/api';
import { Phone, MapPin, ClipboardList, CheckCircle2, AlertTriangle, Clock, ImageIcon, Volume2, Brain, Wrench, Users, Shield, ListChecks, Loader2 } from 'lucide-react';
import SeverityBadge from './SeverityBadge';
import { format } from 'date-fns';
import DispatchModal from './DispatchModal';

interface IncidentDetailsProps {
  incident: Incident | null;
  onUpdateStatus: (id: number, status: string) => void;
}

export default function IncidentDetails({ incident, onUpdateStatus }: IncidentDetailsProps) {
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DetailedAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    if (incident?.call?.location_lat && incident?.call?.location_long) {
        setAddress(null); // Reset address while loading
        const { location_lat: lat, location_long: lon } = incident.call;
        
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            .then(res => res.json())
            .then(data => {
                if (data.display_name) {
                    // Simplify address: Take first 3 parts or full if short
                    const parts = data.display_name.split(', ');
                    setAddress(parts.slice(0, 3).join(', '));
                }
            })
            .catch(() => setAddress(null));
    }
  }, [incident]);

  // Fetch AI analysis
  useEffect(() => {
    if (incident?.id) {
        setAnalysis(null);
        setAnalysisLoading(true);
        getIncidentAnalysis(incident.id)
            .then(data => setAnalysis(data))
            .catch(() => setAnalysis(null))
            .finally(() => setAnalysisLoading(false));
    }
  }, [incident?.id]);

  if (!incident) {
    return (
      <div className="bg-cat-base/50 backdrop-blur-md border-l border-cat-surface0 h-full flex items-center justify-center text-cat-overlay0">
        <div className="text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-mono text-sm">SELECT AN INCIDENT TO VIEW DETAILS</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="bg-cat-base/50 backdrop-blur-md border-l border-cat-surface0 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-cat-surface0 space-y-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold leading-tight text-cat-text">
                {incident.summary || incident.call?.raw_transcript || "Incident Details"}
            </h2>
            <SeverityBadge score={incident.priority_score} />
        </div>
        
        <div className="flex items-center gap-4 text-xs font-mono text-cat-subtext0">
            <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(incident.created_at), 'MMM dd, HH:mm:ss')}
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cat-surface0 border border-cat-surface1 uppercase tracking-wider">
                ID: #{incident.id.toString().padStart(4, '0')}
            </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={() => setShowDispatchModal(true)}
                disabled={incident.status === 'dispatched'}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-cat-blue hover:bg-cat-blue/80 disabled:bg-cat-surface0 disabled:text-cat-overlay0 disabled:cursor-not-allowed rounded-md text-cat-base text-sm font-medium transition-colors"
                >
                <AlertTriangle className="w-4 h-4" />
                {incident.status === 'dispatched' ? 'UNIT DISPATCHED' : 'DISPATCH UNIT'}
             </button>
             <button 
                onClick={() => onUpdateStatus(incident.id, 'resolved')}
                disabled={incident.status === 'resolved'}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-cat-surface0 hover:bg-cat-green/20 hover:text-cat-green border border-cat-surface1 hover:border-cat-green/50 disabled:opacity-50 transition-all rounded-md text-sm font-medium text-cat-text"
                >
                <CheckCircle2 className="w-4 h-4" />
                MARK RESOLVED
             </button>
        </div>

        {/* Media */}
        {(incident.call?.image_url || incident.call?.audio_url) && (
            <div className="grid grid-cols-1 gap-4">
                {incident.call.image_url && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-mono uppercase text-cat-subtext0 tracking-wider flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5" /> Attached Image
                        </h3>
                        <div className="rounded-lg overflow-hidden border border-cat-surface0 bg-cat-mantle">
                             <img 
                                src={`${BASE_URL}/${incident.call.image_url}`} 
                                alt="Incident Evidence" 
                                className="w-full h-auto max-h-64 object-contain"
                             />
                        </div>
                    </div>
                )}
                
                {incident.call.audio_url && (
                    <div className="space-y-2">
                         <h3 className="text-xs font-mono uppercase text-cat-subtext0 tracking-wider flex items-center gap-2">
                            <Volume2 className="w-3.5 h-3.5" /> Audio Recording
                        </h3>
                        <div className="p-3 rounded-lg bg-cat-mantle border border-cat-surface0">
                            <audio 
                                controls 
                                src={`${BASE_URL}/${incident.call.audio_url}`} 
                                className="w-full h-8"
                            />
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Transcript */}
        <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-cat-subtext0 tracking-wider">Call Transcript</h3>
            <div className="p-4 rounded-lg bg-cat-crust border border-cat-surface0 font-mono text-sm leading-relaxed text-cat-text">
                "{incident.call?.raw_transcript || "No transcript available."}"
            </div>
        </div>

        {/* Caller Info */}
        <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-cat-subtext0 tracking-wider">Caller Information</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded bg-cat-mantle border border-cat-surface0/50 flex items-start gap-3">
                    <Phone className="w-4 h-4 text-cat-overlay0 mt-0.5" />
                    <div>
                        <div className="text-xs text-cat-overlay0 mb-0.5">PHONE NUMBER</div>
                        <div className="font-mono text-sm text-cat-text">{incident.call?.caller_phone || 'UNKNOWN'}</div>
                    </div>
                </div>
                <div className="p-3 rounded bg-cat-mantle border border-cat-surface0/50 flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-cat-overlay0 mt-0.5" />
                    <div>
                        <div className="text-xs text-cat-overlay0 mb-0.5">LOCATION</div>
                        <div className="font-mono text-sm text-cat-text break-words pr-2">
                            {address ? (
                                <span className="text-cat-blue">{address}</span>
                            ) : (
                                <>
                                    {incident.call?.location_lat?.toFixed(6) ?? 'N/A'}, <br/>
                                    {incident.call?.location_long?.toFixed(6) ?? 'N/A'}
                                </>
                            )}
                        </div>
                    </div>
                </div>
             </div>
        </div>

        {/* AI Analysis */}
        <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-cat-subtext0 tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cat-lavender"></span>
                AI Analysis
            </h3>
            
            {analysisLoading ? (
                <div className="p-6 rounded-lg bg-cat-crust border border-cat-surface0 flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 text-cat-lavender animate-spin" />
                    <span className="text-sm text-cat-overlay0">Analyzing incident...</span>
                </div>
            ) : analysis ? (
                <div className="p-4 rounded-lg bg-cat-crust border border-cat-surface0 space-y-4">
                    {/* Situation */}
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded bg-cat-blue/10 border border-cat-blue/20">
                            <Brain className="w-4 h-4 text-cat-blue" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] text-cat-overlay0 uppercase">What is Happening</div>
                            <div className="text-sm text-cat-text leading-relaxed">
                                {analysis.situation}
                            </div>
                        </div>
                    </div>

                    {/* Rescue Type */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-cat-red/10 border border-cat-red/20">
                            <Shield className="w-4 h-4 text-cat-red" />
                        </div>
                        <div>
                            <div className="text-[10px] text-cat-overlay0 uppercase">Rescue Type Required</div>
                            <div className="text-sm font-bold text-cat-text">
                                {analysis.rescue_type}
                            </div>
                        </div>
                    </div>

                    {/* Responders Count */}
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded bg-cat-green/10 border border-cat-green/20">
                            <Users className="w-4 h-4 text-cat-green" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] text-cat-overlay0 uppercase">Responders Needed</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {Object.entries(analysis.responders_count).map(([type, count]) => (
                                    <span key={type} className="px-2 py-1 rounded bg-cat-surface0 text-xs font-mono text-cat-text capitalize">
                                        {type}: <span className="font-bold text-cat-green">{count}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Equipment */}
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded bg-cat-peach/10 border border-cat-peach/20">
                            <Wrench className="w-4 h-4 text-cat-peach" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] text-cat-overlay0 uppercase">Equipment Required</div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {analysis.equipment.map((item, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-full bg-cat-surface0 border border-cat-surface1 text-xs text-cat-subtext0">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded bg-cat-mauve/10 border border-cat-mauve/20">
                            <ListChecks className="w-4 h-4 text-cat-mauve" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] text-cat-overlay0 uppercase mb-2">Response Instructions</div>
                            <ol className="space-y-1.5">
                                {analysis.instructions.map((instruction, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-cat-text">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cat-mauve/20 text-cat-mauve text-xs font-bold flex items-center justify-center">
                                            {idx + 1}
                                        </span>
                                        <span>{instruction}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-4 rounded-lg bg-cat-crust border border-cat-surface0 text-sm text-cat-overlay0 italic">
                    Unable to load AI analysis
                </div>
            )}
        </div>
      </div>
    </div>

    {showDispatchModal && (
        <DispatchModal 
            incident={incident} 
            onClose={() => setShowDispatchModal(false)} 
        />
    )}
    </>
  );
}

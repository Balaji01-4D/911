import { useState } from 'react';
import { Incident, BASE_URL } from '@/lib/api';
import { Phone, MapPin, ClipboardList, CheckCircle2, AlertTriangle, Clock, ImageIcon, Volume2 } from 'lucide-react';
import SeverityBadge from './SeverityBadge';
import { format } from 'date-fns';
import DispatchModal from './DispatchModal';

interface IncidentDetailsProps {
  incident: Incident | null;
  onUpdateStatus: (id: number, status: string) => void;
}

export default function IncidentDetails({ incident, onUpdateStatus }: IncidentDetailsProps) {
  const [showDispatchModal, setShowDispatchModal] = useState(false);

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
    <div className="bg-cat-base/50 backdrop-blur-md border-l border-cat-surface0 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-cat-surface0 space-y-4">
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
                        <div className="font-mono text-sm text-cat-text">
                            {incident.call?.location_lat?.toFixed(6) ?? 'N/A'}, <br/>
                            {incident.call?.location_long?.toFixed(6) ?? 'N/A'}
                        </div>
                    </div>
                </div>
             </div>
        </div>

        {/* AI Analysis Placeholder */}
        <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-cat-subtext0 tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cat-lavender animate-pulse"></span>
                AI Analysis
            </h3>
            <div className="text-sm text-cat-overlay0 italic">
                Waiting for AI processing...
            </div>
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

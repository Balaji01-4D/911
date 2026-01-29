import { Incident } from '@/lib/api';
import { Phone, MapPin, ClipboardList, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import SeverityBadge from './SeverityBadge';
import { format } from 'date-fns';

interface IncidentDetailsProps {
  incident: Incident | null;
  onUpdateStatus: (id: number, status: string) => void;
}

export default function IncidentDetails({ incident, onUpdateStatus }: IncidentDetailsProps) {
  if (!incident) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md border-l border-white/10 h-full flex items-center justify-center text-slate-500">
        <div className="text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-mono text-sm">SELECT AN INCIDENT TO VIEW DETAILS</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border-l border-white/10 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/5 space-y-4">
        <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold leading-tight text-white">{incident.summary || incident.call.raw_transcript}</h2>
            <SeverityBadge score={incident.priority_score} />
        </div>
        
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(incident.created_at), 'MMM dd, HH:mm:ss')}
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 uppercase tracking-wider">
                ID: #{incident.id.toString().padStart(4, '0')}
            </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={() => onUpdateStatus(incident.id, 'dispatched')}
                disabled={incident.status === 'dispatched'}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors"
                >
                <AlertTriangle className="w-4 h-4" />
                DISPATCH UNIT
             </button>
             <button 
                onClick={() => onUpdateStatus(incident.id, 'resolved')}
                disabled={incident.status === 'resolved'}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-500 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-700 disabled:opacity-50 transition-all rounded-md text-sm font-medium"
                >
                <CheckCircle2 className="w-4 h-4" />
                MARK RESOLVED
             </button>
        </div>

        {/* Transcript */}
        <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-slate-500 tracking-wider">Call Transcript</h3>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sm leading-relaxed text-slate-300">
                "{incident.call.raw_transcript}"
            </div>
        </div>

        {/* Caller Info */}
        <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-slate-500 tracking-wider">Caller Information</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded bg-slate-900 border border-slate-800/50 flex items-start gap-3">
                    <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                        <div className="text-xs text-slate-500 mb-0.5">PHONE NUMBER</div>
                        <div className="font-mono text-sm">{incident.call.caller_phone || 'UNKNOWN'}</div>
                    </div>
                </div>
                <div className="p-3 rounded bg-slate-900 border border-slate-800/50 flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                        <div className="text-xs text-slate-500 mb-0.5">LOCATION</div>
                        <div className="font-mono text-sm">
                            {incident.call.location_lat?.toFixed(6)}, <br/>
                            {incident.call.location_long?.toFixed(6)}
                        </div>
                    </div>
                </div>
             </div>
        </div>

        {/* AI Analysis Placeholder */}
        <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                AI Analysis
            </h3>
            <div className="text-sm text-slate-400 italic">
                Waiting for AI processing...
            </div>
        </div>
      </div>
    </div>
  );
}

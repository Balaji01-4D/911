import { Incident } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import SeverityBadge from './SeverityBadge';

interface IncidentFeedProps {
  incidents: Incident[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function IncidentFeed({ incidents, selectedId, onSelect }: IncidentFeedProps) {
  
  return (
    <div className="flex-1 h-full overflow-y-auto p-4 space-y-2">
      <AnimatePresence>
        {incidents.map((incident) => (
          <motion.div
            key={incident.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={() => onSelect(incident.id)}
            className={clsx(
              "group relative p-4 rounded-lg border cursor-pointer transition-all hover:bg-slate-800/50",
              selectedId === incident.id 
                ? "bg-slate-800/80 border-slate-600 shadow-lg" 
                : "bg-slate-900/40 border-slate-800/50 hover:border-slate-700"
            )}
          >
            {/* Left accent bar for status */}
            <div className={clsx(
                "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-colors",
                incident.status === 'resolved' ? 'bg-emerald-500/50' :
                incident.priority_score >= 8 ? 'bg-red-500' : 
                incident.priority_score >= 5 ? 'bg-amber-500' : 'bg-blue-500'
            )} />

            <div className="pl-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={clsx(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                            incident.status === 'pending' ? "bg-slate-800 text-slate-400 border-slate-700" :
                            incident.status === 'dispatched' ? "bg-blue-900/30 text-blue-400 border-blue-800" :
                            "bg-emerald-900/30 text-emerald-400 border-emerald-800"
                        )}>
                            {incident.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                        </span>
                    </div>
                    <h3 className="font-medium text-slate-200 text-sm leading-snug group-hover:text-white transition-colors">
                        {incident.summary || incident.call.raw_transcript}
                    </h3>
                </div>
                
                <SeverityBadge score={incident.priority_score} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {incidents.length === 0 && (
        <div className="text-center py-20 text-slate-600 font-mono text-sm">
            NO ACTIVE INCIDENTS
        </div>
      )}
    </div>
  );
}

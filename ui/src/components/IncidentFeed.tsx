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
              "group relative p-4 rounded-lg border cursor-pointer transition-all hover:bg-cat-surface0/50",
              selectedId === incident.id 
                ? "bg-cat-surface0/80 border-cat-surface1 shadow-lg" 
                : "bg-cat-mantle/40 border-cat-surface0/50 hover:border-cat-surface0"
            )}
          >
            {/* Left accent bar for status */}
            <div className={clsx(
                "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-colors",
                incident.status === 'resolved' ? 'bg-cat-green/50' :
                incident.priority_score >= 8 ? 'bg-cat-red' : 
                incident.priority_score >= 5 ? 'bg-cat-peach' : 'bg-cat-blue'
            )} />

            <div className="pl-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={clsx(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                            incident.status === 'pending' ? "bg-cat-surface0 text-cat-subtext0 border-cat-surface1" :
                            incident.status === 'dispatched' ? "bg-cat-blue/20 text-cat-blue border-cat-blue/30" :
                            "bg-cat-green/20 text-cat-green border-cat-green/30"
                        )}>
                            {incident.status}
                        </span>
                        <span className="text-[10px] font-mono text-cat-overlay0 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                        </span>
                    </div>
                    <h3 className="font-medium text-cat-text text-sm leading-snug group-hover:text-cat-lavender transition-colors">
                        {incident.summary || incident.call?.raw_transcript || "No details available"}
                    </h3>
                </div>
                
                <SeverityBadge score={incident.priority_score} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {incidents.length === 0 && (
        <div className="text-center py-20 text-cat-overlay0 font-mono text-sm">
            NO ACTIVE INCIDENTS
        </div>
      )}
    </div>
  );
}

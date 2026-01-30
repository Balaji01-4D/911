import { Responder } from "@/lib/api";
import { Shield, Flame, Stethoscope, Navigation, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";

interface DispatchPanelProps {
    responders: Responder[];
    onDispatch: (responderId: number) => void;
    isDispatching: boolean;
}

export default function DispatchPanel({ responders, onDispatch, isDispatching }: DispatchPanelProps) {
    if (responders.length === 0) {
        return (
            <div className="absolute top-20 right-4 w-80 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-lg p-4 shadow-2xl z-20">
                <div className="text-center text-slate-500 py-8 font-mono text-sm">
                    NO UNITS IN RANGE
                </div>
            </div>
        );
    }

    return (
        <div className="absolute top-20 right-4 w-80 bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-lg shadow-2xl z-20 overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
            <div className="p-3 border-b border-cyan-900/50 bg-cyan-950/30 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-cyan-400 tracking-wider">DISPATCH RECOMMENDATIONS</h3>
                    <p className="text-[10px] text-cyan-600 font-mono">NEAREST IDLE UNITS</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
            </div>

            <div className="overflow-y-auto p-2 space-y-2">
                {responders.map((unit) => (
                    <div key={unit.id} className="bg-slate-950/50 border border-slate-800 hover:border-cyan-700/50 rounded p-3 transition-all group">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className={clsx(
                                    "p-2 rounded border",
                                    unit.type === 'police' && "bg-blue-950/50 border-blue-900 text-blue-400",
                                    unit.type === 'fire' && "bg-red-950/50 border-red-900 text-red-400",
                                    unit.type === 'medical' && "bg-emerald-950/50 border-emerald-900 text-emerald-400",
                                )}>
                                    {unit.type === 'police' && <Shield className="w-4 h-4" />}
                                    {unit.type === 'fire' && <Flame className="w-4 h-4" />}
                                    {unit.type === 'medical' && <Stethoscope className="w-4 h-4" />}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-200 text-sm">{unit.name}</div>
                                    <div className="font-mono text-xs text-slate-500 uppercase">{unit.type} UNIT</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-cyan-400 font-mono text-xs font-bold">
                                    <Navigation className="w-3 h-3" />
                                    {unit.distance?.toFixed(1)}km
                                </div>
                                <div className="text-[10px] text-slate-600">ERA: ~{Math.ceil((unit.distance || 0) * 1.5)}m</div>
                            </div>
                        </div>

                        <button 
                            onClick={() => onDispatch(unit.id)}
                            disabled={isDispatching}
                            className="w-full flex items-center justify-center gap-2 py-1.5 rounded bg-slate-800 hover:bg-cyan-600/20 hover:text-cyan-400 hover:border-cyan-500/50 border border-transparent transition-all text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:bg-cyan-900/20"
                        >
                            {isDispatching ? (
                                <span className="animate-pulse">TRANSMITTING...</span>
                            ) : (
                                <>
                                    <span>DISPATCH NOW</span>
                                    <CheckCircle2 className="w-3 h-3" />
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

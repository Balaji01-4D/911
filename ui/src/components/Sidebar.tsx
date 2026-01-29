import { LayoutDashboard, Map, Settings, Radio } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-16 flex flex-col items-center py-6 gap-8 bg-slate-900 border-r border-slate-800">
      <div className="p-2 bg-red-500/10 rounded-lg">
        <Radio className="w-6 h-6 text-red-500 animate-pulse" />
      </div>

      <nav className="flex flex-col gap-6 w-full px-2">
        <button className="p-3 rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors group relative">
            <LayoutDashboard className="w-5 h-5" />
            <div className="absolute left-14 bg-slate-800 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700 pointer-events-none">Dashboard</div>
        </button>
        <button className="p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors group relative">
            <Map className="w-5 h-5" />
            <div className="absolute left-14 bg-slate-800 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700 pointer-events-none">Map View</div>
        </button>
        <button className="p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors group relative">
            <Settings className="w-5 h-5" />
            <div className="absolute left-14 bg-slate-800 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700 pointer-events-none">Settings</div>
        </button>
      </nav>

      <div className="mt-auto">
        <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600"></div>
      </div>
    </div>
  );
}

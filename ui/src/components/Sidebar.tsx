import { LayoutDashboard, Map as MapIcon, Settings, Radio, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div className="w-16 flex flex-col items-center py-6 gap-8 bg-cat-mantle border-r border-cat-surface0">
      <div className="p-2 bg-cat-red/10 rounded-lg">
        <Radio className="w-6 h-6 text-cat-red animate-pulse" />
      </div>

      <nav className="flex flex-col gap-6 w-full px-2">
        <NavLink 
          to="/" 
          className={({ isActive }) => `p-3 rounded-lg transition-colors group relative ${isActive ? 'bg-cat-surface0 text-cat-text' : 'text-cat-overlay0 hover:bg-cat-surface0 hover:text-cat-text'}`}
        >
            <LayoutDashboard className="w-5 h-5" />
            <div className="absolute left-14 bg-cat-surface0 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-cat-surface1 pointer-events-none text-cat-text z-50">Dashboard</div>
        </NavLink>
        
        <NavLink 
          to="/map" 
          className={({ isActive }) => `p-3 rounded-lg transition-colors group relative ${isActive ? 'bg-cat-surface0 text-cat-text' : 'text-cat-overlay0 hover:bg-cat-surface0 hover:text-cat-text'}`}
        >
            <MapIcon className="w-5 h-5" />
            <div className="absolute left-14 bg-cat-surface0 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-cat-surface1 pointer-events-none text-cat-text z-50">Map View</div>
        </NavLink>

        <NavLink 
          to="/responders" 
          className={({ isActive }) => `p-3 rounded-lg transition-colors group relative ${isActive ? 'bg-cat-surface0 text-cat-text' : 'text-cat-overlay0 hover:bg-cat-surface0 hover:text-cat-text'}`}
        >
            <Users className="w-5 h-5" />
            <div className="absolute left-14 bg-cat-surface0 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-cat-surface1 pointer-events-none text-cat-text z-50">Responders</div>
        </NavLink>

        <button className="p-3 rounded-lg text-cat-overlay0 hover:bg-cat-surface0 hover:text-cat-text transition-colors group relative">
            <Settings className="w-5 h-5" />
            <div className="absolute left-14 bg-cat-surface0 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-cat-surface1 pointer-events-none text-cat-text z-50">Settings</div>
        </button>
      </nav>

      <div className="mt-auto">
        <div className="w-8 h-8 rounded-full bg-cat-surface0 border border-cat-surface1"></div>
      </div>
    </div>
  );
}

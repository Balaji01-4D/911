import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { fetchIncidents, updateIncidentStatus, Incident } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import IncidentFeed from '@/components/IncidentFeed';
import IncidentDetails from '@/components/IncidentDetails';
import IncidentMap from '@/components/IncidentMap';

// Create a client
const queryClient = new QueryClient();

// Wrapper to handle full map view logic
function FullMapController({ incidents, onSelect }: { incidents: Incident[], onSelect: (id: number) => void }) {
    const { id } = useParams();
    const incidentId = id ? parseInt(id) : null;
    
    return (
        <div className="flex-1 h-full relative">
            <IncidentMap 
                incidents={incidents} 
                selectedId={incidentId}
                onSelect={onSelect}
            />
        </div>
    );
}

function Dashboard() {
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Poll for incidents every 5 seconds
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: fetchIncidents,
    refetchInterval: 5000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateIncidentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });

  const handleUpdateStatus = (id: number, status: string) => {
    updateMutation.mutate({ id, status });
  };

  const selectedIncident = incidents.find((i: Incident) => i.id === selectedIncidentId) || null;

  const handleSelectIncident = (id: number) => {
      setSelectedIncidentId(id);
      // If we are on the dashboard (root), we just select it.
      // If we were on map, we might want to stay there or show details popover? 
      // For now, details view is part of the main dashboard route structure
  };
  
  const handleMapSelect = (id: number) => {
      navigate(`/map/incident/${id}`);
  };

  return (
    <div className="flex h-screen bg-cat-crust text-cat-text font-sans overflow-hidden selection:bg-cat-lavender/30">
        <Sidebar />
        
        <main className="flex-1 h-full overflow-hidden">
            <Routes>
                {/* Default Dashboard View: Feed + Details */}
                <Route path="/" element={
                     <div className="grid grid-cols-12 h-full">
                        {/* Feed Column */}
                        <div className="col-span-5 border-r border-cat-surface0 flex flex-col h-full bg-cat-base/50 relative">
                             <div className="p-4 border-b border-cat-surface0 flex items-center justify-between backdrop-blur-sm sticky top-0 z-10 bg-cat-crust/80">
                                <div>
                                    <h1 className="text-lg font-bold text-cat-text tracking-tight">Incoming Feed</h1>
                                    <p className="text-xs text-cat-overlay0 font-mono">LIVE MONITORING ACTIVE</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full bg-cat-green animate-pulse"></div>
                                     <span className="text-[10px] font-mono text-cat-green">SYSTEM ONLINE</span>
                                </div>
                            </div>
                         
                            {isLoading ? (
                                <div className="p-10 text-center text-cat-overlay0 font-mono text-sm">LOADING FEED...</div>
                            ) : (
                                <IncidentFeed 
                                    incidents={incidents} 
                                    selectedId={selectedIncidentId} 
                                    onSelect={handleSelectIncident} 
                                />
                            )}
                        </div>

                         {/* Details Column */}
                        <div className="col-span-7 h-full">
                            <IncidentDetails 
                                incident={selectedIncident} 
                                onUpdateStatus={handleUpdateStatus}
                            />
                        </div>
                     </div>
                } />

                {/* Map Views */}
                <Route path="/map" element={<FullMapController incidents={incidents} onSelect={handleMapSelect} />} />
                <Route path="/map/incident/:id" element={<FullMapController incidents={incidents} onSelect={handleMapSelect} />} />
                <Route path="/map/category/:category" element={<FullMapController incidents={incidents} onSelect={handleMapSelect} />} />
                <Route path="/map/cluster" element={<FullMapController incidents={incidents} onSelect={handleMapSelect} />} />
            </Routes>
        </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  )
}

export default App

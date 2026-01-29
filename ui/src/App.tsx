import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchIncidents, updateIncidentStatus, Incident } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import IncidentFeed from '@/components/IncidentFeed';
import IncidentDetails from '@/components/IncidentDetails';

// Create a client
const queryClient = new QueryClient();

function Dashboard() {
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const queryClient = useQueryClient();

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

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden selection:bg-purple-500/30">
        <Sidebar />
        
        <main className="flex-1 grid grid-cols-12 h-full">
            {/* Feed Column */}
            <div className="col-span-5 border-r border-slate-800 flex flex-col h-full bg-slate-950/50 relative">
                <div className="p-4 border-b border-white/5 flex items-center justify-between backdrop-blur-sm sticky top-0 z-10 bg-slate-950/80">
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-tight">Incoming Feed</h1>
                        <p className="text-xs text-slate-500 font-mono">LIVE MONITORING ACTIVE</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                         <span className="text-[10px] font-mono text-emerald-500">SYSTEM ONLINE</span>
                    </div>
                </div>
                
                {isLoading ? (
                    <div className="p-10 text-center text-slate-500 font-mono text-sm">LOADING FEED...</div>
                ) : (
                    <IncidentFeed 
                        incidents={incidents} 
                        selectedId={selectedIncidentId} 
                        onSelect={setSelectedIncidentId} 
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

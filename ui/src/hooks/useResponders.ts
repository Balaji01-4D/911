import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNearbyResponders, dispatchResponder, Responder } from '@/lib/api';

export const useNearbyResponders = (lat?: number, long?: number, enabled = false) => {
    return useQuery({
        queryKey: ['responders', lat, long],
        queryFn: () => fetchNearbyResponders(lat!, long!),
        enabled: enabled && !!lat && !!long,
        refetchInterval: 10000, // Poll positions every 10s
    });
};

export const useDispatcher = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ responderId, incidentId }: { responderId: number; incidentId: number }) => 
            dispatchResponder(responderId, incidentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['responders'] });
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
        }
    });
};

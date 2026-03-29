import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type TimeEntry = {
    _id: string;
    category: string;
    startTime: string;
    endTime?: string;
    description?: string;
};

type TodayData = {
    totals: Record<string, number>;
    runningEntry: TimeEntry | null;
    entries: TimeEntry[];
};

async function fetchToday(userId: string): Promise<TodayData> {
    const res = await fetch(`${API_URL}/api/track/today?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch today data');
    return res.json();
}

async function startTracking({ userId, category, description }: { userId: string; category: string; description?: string }) {
    const res = await fetch(`${API_URL}/api/track/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, category, description }),
    });
    if (!res.ok) throw new Error('Failed to start tracking');
    return res.json();
}

async function stopTracking(userId: string) {
    const res = await fetch(`${API_URL}/api/track/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to stop tracking');
    return res.json();
}

export function useToday(userId: string | undefined) {
    return useQuery({
        queryKey: ['today', userId],
        queryFn: () => fetchToday(userId!),
        enabled: !!userId,
        staleTime: 5000,
        refetchInterval: (query) => {
            const data = query.state.data as TodayData | undefined;
            return data?.runningEntry ? 5000 : 30000;
        },
        refetchIntervalInBackground: false,
    });
}

export function useStartTracking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: startTracking,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['today', variables.userId] });
            queryClient.invalidateQueries({ queryKey: ['history', variables.userId] });
        },
    });
}

export function useStopTracking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: stopTracking,
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: ['today', userId] });
            queryClient.invalidateQueries({ queryKey: ['history', userId] });
        },
    });
}

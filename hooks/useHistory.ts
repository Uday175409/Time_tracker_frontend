import { useQuery } from '@tanstack/react-query';
import { throwApiError } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchHistory(userId: string, days: number) {
    const res = await fetch(`${API_URL}/api/track/history?userId=${userId}&days=${days}`);
    if (!res.ok) await throwApiError(res, 'Failed to fetch history');
    const data = await res.json();
    return data.history;
}

export function useHistory(userId: string | undefined, days: number = 7) {
    return useQuery({
        queryKey: ['history', userId, days],
        queryFn: () => fetchHistory(userId!, days),
        enabled: !!userId,
        staleTime: 60_000,
        refetchOnMount: false,
    });
}

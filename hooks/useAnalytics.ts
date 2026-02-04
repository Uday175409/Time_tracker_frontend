import { useQuery } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchAnalytics(userId: string, range: 'day' | 'week' | 'month') {
    const res = await fetch(`${API_URL}/api/analytics/productivity?userId=${userId}&range=${range}`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    const json = await res.json();
    return json.data;
}

export function useAnalytics(userId: string | undefined, range: 'day' | 'week' | 'month' = 'day') {
    return useQuery({
        queryKey: ['analytics', userId, range],
        queryFn: () => fetchAnalytics(userId!, range),
        enabled: !!userId,
    });
}

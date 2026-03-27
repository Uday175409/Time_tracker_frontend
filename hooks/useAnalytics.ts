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

// ─── Daily trend data ──────────────────────────────────────

export type TrendPoint = {
    date: string;
    totalHours: number;
    productiveHours: number;
    sessions: number;
    avgSessionMinutes: number;
};

async function fetchTrend(userId: string, days: number): Promise<TrendPoint[]> {
    const res = await fetch(`${API_URL}/api/analytics/trend?userId=${userId}&days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch trend');
    const json = await res.json();
    return json.data;
}

export function useTrend(userId: string | undefined, days: number = 30) {
    return useQuery({
        queryKey: ['trend', userId, days],
        queryFn: () => fetchTrend(userId!, days),
        enabled: !!userId,
    });
}

// ─── Weekly category comparison ─────────────────────────────

export type WeeklyCategoryPoint = {
    week: string;
    category: string;
    hours: number;
};

async function fetchWeeklyCategories(userId: string, weeks: number): Promise<WeeklyCategoryPoint[]> {
    const res = await fetch(`${API_URL}/api/analytics/weekly-categories?userId=${userId}&weeks=${weeks}`);
    if (!res.ok) throw new Error('Failed to fetch weekly categories');
    const json = await res.json();
    return json.data;
}

export function useWeeklyCategories(userId: string | undefined, weeks: number = 4) {
    return useQuery({
        queryKey: ['weeklyCategories', userId, weeks],
        queryFn: () => fetchWeeklyCategories(userId!, weeks),
        enabled: !!userId,
    });
}

// ─── Heatmap data ───────────────────────────────────────────

export type HeatmapPoint = {
    date: string;
    hours: number;
};

async function fetchHeatmap(userId: string, days: number): Promise<HeatmapPoint[]> {
    const res = await fetch(`${API_URL}/api/analytics/heatmap?userId=${userId}&days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch heatmap');
    const json = await res.json();
    return json.data;
}

export function useHeatmap(userId: string | undefined, days: number = 365) {
    return useQuery({
        queryKey: ['heatmap', userId, days],
        queryFn: () => fetchHeatmap(userId!, days),
        enabled: !!userId,
    });
}

// ─── Insights ───────────────────────────────────────────────

export type Insights = {
    mostProductiveDay: string;
    mostProductiveDayHours: number;
    avgSessionMinutes: number;
    topCategory: { name: string; hours: number } | null;
    totalSessions: number;
    dailyAvgHours: number;
    productivityRate: number;
    daysTracked: number;
};

async function fetchInsights(userId: string): Promise<Insights> {
    const res = await fetch(`${API_URL}/api/analytics/insights?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch insights');
    const json = await res.json();
    return json.data;
}

export function useInsights(userId: string | undefined) {
    return useQuery({
        queryKey: ['insights', userId],
        queryFn: () => fetchInsights(userId!),
        enabled: !!userId,
    });
}

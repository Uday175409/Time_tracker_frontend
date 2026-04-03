import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiUrl, throwApiError } from '@/lib/api';

const API_URL = getApiUrl();

export type TimeEntryAuditHistory = {
    oldStartTime: string;
    oldEndTime?: string | null;
    oldCategory: string;
    oldDescription?: string;
    changedAt: string;
    reason: string;
};

export type TimeEntry = {
    _id: string;
    category: string;
    startTime: string;
    endTime?: string | null;
    description?: string;
    durationSeconds?: number;
    status?: 'running' | 'completed' | 'paused';
    source?: 'auto' | 'manual';
    isRegularized?: boolean;
    regularizationReason?: string;
    regularizationStatus?: 'pending' | 'approved' | 'rejected';
    auditHistory?: TimeEntryAuditHistory[];
};

type TodayData = {
    totals: Record<string, number>;
    runningEntry: TimeEntry | null;
    entries: TimeEntry[];
};

async function fetchToday(userId: string): Promise<TodayData> {
    const res = await fetch(`${API_URL}/api/track/today?userId=${userId}`);
    if (!res.ok) await throwApiError(res, 'Failed to fetch today data');
    return res.json();
}

async function startTracking({ userId, category, description }: { userId: string; category: string; description?: string }) {
    const res = await fetch(`${API_URL}/api/track/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, category, description }),
    });
    if (!res.ok) await throwApiError(res, 'Failed to start tracking');
    return res.json();
}

async function stopTracking(userId: string) {
    const res = await fetch(`${API_URL}/api/track/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
    });
    if (!res.ok) await throwApiError(res, 'Failed to stop tracking');
    return res.json();
}

async function createManualEntry(data: {
    userId: string;
    category: string;
    description?: string;
    startTime: string;
    endTime: string;
    overwrite?: boolean;
}) {
    const res = await fetch(`${API_URL}/api/track/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) await throwApiError(res, 'Failed to create manual entry');
    return res.json();
}

async function regularizeEntry(data: {
    entryId: string;
    userId: string;
    startTime?: string;
    endTime?: string;
    category?: string;
    description?: string;
    reason: string;
}) {
    const { entryId, ...payload } = data;
    const res = await fetch(`${API_URL}/api/track/regularize/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) await throwApiError(res, 'Failed to regularize entry');
    return res.json();
}

async function reviewRegularization(data: {
    entryId: string;
    userId: string;
    status: 'approved' | 'rejected';
}) {
    const { entryId, ...payload } = data;
    const res = await fetch(`${API_URL}/api/track/regularize/${entryId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) await throwApiError(res, 'Failed to update regularization status');
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

export function useCreateManualEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createManualEntry,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['today', variables.userId] });
            queryClient.invalidateQueries({ queryKey: ['history', variables.userId] });
            queryClient.invalidateQueries({ queryKey: ['analytics', variables.userId] });
        },
    });
}

export function useRegularizeEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: regularizeEntry,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['today', variables.userId] });
            queryClient.invalidateQueries({ queryKey: ['history', variables.userId] });
            queryClient.invalidateQueries({ queryKey: ['analytics', variables.userId] });
        },
    });
}

export function useReviewRegularization() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: reviewRegularization,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['today', variables.userId] });
            queryClient.invalidateQueries({ queryKey: ['history', variables.userId] });
            queryClient.invalidateQueries({ queryKey: ['analytics', variables.userId] });
        },
    });
}

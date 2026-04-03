import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiUrl, throwApiError } from '@/lib/api';

const API_URL = getApiUrl();

// --- Types ---

export type EODSummary = {
  _id: string;
  userId: string;
  date: string;
  totalHours: number;
  productiveHours: number;
  categoryBreakdown: Record<string, number>;
  summary: string;
  highlights: string[];
  blockers: string[];
  versions: {
    summary: string;
    highlights: string[];
    blockers: string[];
    editedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

export type CurrentEODResponse = {
  date: string;
  eod: EODSummary;
};

// --- Fetch helpers ---

async function fetchEOD(userId: string, date: string): Promise<EODSummary> {
  const res = await fetch(`${API_URL}/api/eod/${date}?userId=${userId}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch EOD summary');
  const json = await res.json();
  return json.eod;
}

async function fetchCurrentEOD(userId: string): Promise<CurrentEODResponse> {
  const res = await fetch(`${API_URL}/api/eod/current?userId=${userId}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch current EOD summary');
  return res.json();
}

async function updateEOD(data: {
  userId: string;
  date: string;
  summary?: string;
  highlights?: string[];
  blockers?: string[];
}) {
  const { date, ...body } = data;
  const res = await fetch(`${API_URL}/api/eod/${date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) await throwApiError(res, 'Failed to update EOD summary');
  return res.json();
}

// --- Hooks ---

/**
 * Fetch (or auto-generate) the EOD summary for a specific date.
 * Metrics are always recalculated server-side from real time entries.
 */
export function useEOD(userId: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: ['eod', userId, date],
    queryFn: () => fetchEOD(userId!, date!),
    enabled: !!userId && !!date,
  });
}

/** Fetch the canonical current-date EOD summary from the server. */
export function useCurrentEOD(userId: string | undefined) {
  return useQuery({
    queryKey: ['eod', userId, 'current'],
    queryFn: () => fetchCurrentEOD(userId!),
    enabled: !!userId,
  });
}

/** Save user-editable EOD fields (summary, highlights, blockers) */
export function useUpdateEOD() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateEOD,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['eod', variables.userId, variables.date] });
    },
  });
}

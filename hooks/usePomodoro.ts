import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type PomodoroSession = {
  _id: string;
  userId: string;
  date: string;
  completedPomodoros: number;
  completedBreaks: number;
  mode: '25/5' | '50/10' | 'custom';
  customWorkMinutes: number;
  customBreakMinutes: number;
  /** Persisted phase state — survives page reloads */
  activePhase: 'idle' | 'work' | 'break';
  phaseStartedAt: string | null;
  phaseCategory: string;
  pausedAt: string | null;
  totalPausedSeconds: number;
};

async function fetchPomodoroToday(userId: string): Promise<PomodoroSession> {
  const res = await fetch(`${API_URL}/api/pomodoro/today?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch pomodoro session');
  const json = await res.json();
  return json.session;
}

async function startWorkApi(data: { userId: string; category: string }) {
  const res = await fetch(`${API_URL}/api/pomodoro/start-work`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to start work pomodoro');
  return res.json();
}

async function completeWork(data: { userId: string; category: string }) {
  const res = await fetch(`${API_URL}/api/pomodoro/complete-work`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to complete pomodoro');
  return res.json();
}

async function completeBreak(userId: string) {
  const res = await fetch(`${API_URL}/api/pomodoro/complete-break`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to complete break');
  return res.json();
}

async function cancelPomodoroApi(userId: string) {
  const res = await fetch(`${API_URL}/api/pomodoro/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to cancel pomodoro');
  return res.json();
}

async function pausePomodoroApi(userId: string) {
  const res = await fetch(`${API_URL}/api/pomodoro/pause`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to pause pomodoro');
  return res.json();
}

async function resumePomodoroApi(userId: string) {
  const res = await fetch(`${API_URL}/api/pomodoro/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to resume pomodoro');
  return res.json();
}

async function setMode(data: {
  userId: string;
  mode: '25/5' | '50/10' | 'custom';
  customWorkMinutes?: number;
  customBreakMinutes?: number;
}) {
  const res = await fetch(`${API_URL}/api/pomodoro/mode`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to set mode');
  return res.json();
}

/** Fetch today's pomodoro session (count, mode, active phase) */
export function usePomodoroToday(userId: string | undefined) {
  return useQuery({
    queryKey: ['pomodoro', userId],
    queryFn: () => fetchPomodoroToday(userId!),
    enabled: !!userId,
    staleTime: 5000,
    refetchInterval: (query) => {
      const phase = (query.state.data as PomodoroSession | undefined)?.activePhase;
      return phase && phase !== 'idle' ? 4000 : 45000;
    },
    refetchIntervalInBackground: false,
  });
}

/** Start a work pomodoro — creates TimeEntry and persists phase */
export function useStartWork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: startWorkApi,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['pomodoro', variables.userId] });
      qc.invalidateQueries({ queryKey: ['today', variables.userId] });
    },
  });
}

/** Mark a work pomodoro as complete → auto-starts break */
export function useCompleteWork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completeWork,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['pomodoro', variables.userId] });
      qc.invalidateQueries({ queryKey: ['today', variables.userId] });
    },
  });
}

/** Mark a break as complete */
export function useCompleteBreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completeBreak,
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ['pomodoro', userId] });
      qc.invalidateQueries({ queryKey: ['today', userId] });
    },
  });
}

/** Cancel an active pomodoro */
export function useCancelPomodoro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelPomodoroApi,
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ['pomodoro', userId] });
      qc.invalidateQueries({ queryKey: ['today', userId] });
    },
  });
}

/** Pause the active pomodoro */
export function usePausePomodoro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pausePomodoroApi,
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ['pomodoro', userId] });
    },
  });
}

/** Resume a paused pomodoro */
export function useResumePomodoro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resumePomodoroApi,
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ['pomodoro', userId] });
    },
  });
}

/** Switch pomodoro mode (25/5, 50/10, or custom) */
export function useSetPomodoroMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setMode,
    onMutate: async (variables) => {
      const key = ['pomodoro', variables.userId] as const;
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<PomodoroSession>(key);

      if (previous) {
        qc.setQueryData<PomodoroSession>(key, {
          ...previous,
          mode: variables.mode,
          customWorkMinutes:
            variables.mode === 'custom'
              ? (variables.customWorkMinutes !== undefined && variables.customWorkMinutes !== null ? variables.customWorkMinutes : previous.customWorkMinutes ?? 25)
              : previous.customWorkMinutes,
          customBreakMinutes:
            variables.mode === 'custom'
              ? (variables.customBreakMinutes !== undefined && variables.customBreakMinutes !== null ? variables.customBreakMinutes : previous.customBreakMinutes ?? 5)
              : previous.customBreakMinutes,
        });
      }

      return { previous, key };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        qc.setQueryData(context.key, context.previous);
      }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['pomodoro', variables.userId] });
    },
  });
}

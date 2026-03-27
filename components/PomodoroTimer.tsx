'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  usePomodoroToday,
  useStartWork,
  useCompleteWork,
  useCompleteBreak,
  useCancelPomodoro,
  usePausePomodoro,
  useResumePomodoro,
  useSetPomodoroMode,
} from '@/hooks/usePomodoro';
import {
  Timer as TimerIcon,
  Coffee,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Settings,
  Check,
  SkipForward,
  Bell,
  BellOff,
} from 'lucide-react';
import { useNotification } from '@/hooks/useNotification';

// ─── Mode configs ───────────────────────────────────────────
type ModeKey = '25/5' | '50/10' | 'custom';

function getModeConfig(
  mode: ModeKey,
  customWork = 25,
  customBreak = 5
): { work: number; break: number; label: string } {
  switch (mode) {
    case '25/5':
      return { work: 25 * 60, break: 5 * 60, label: '25 / 5' };
    case '50/10':
      return { work: 50 * 60, break: 10 * 60, label: '50 / 10' };
    case 'custom':
      return {
        work: customWork * 60,
        break: customBreak * 60,
        label: `${customWork} / ${customBreak}`,
      };
  }
}

type Phase = 'idle' | 'work' | 'break';

interface PomodoroTimerProps {
  userId: string;
  activeCategory: string | undefined;
  onStartWork: (category: string) => void;
  onPhaseChange?: (phase: Phase) => void;
}

export type { Phase as PomodoroPhase };

// ─── SVG progress ring ──────────────────────────────────────
function ProgressRing({
  progress,
  phase,
  paused,
  size = 200,
  strokeWidth = 6,
}: {
  progress: number;
  phase: Phase;
  paused: boolean;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  const strokeColor =
    phase === 'work'
      ? paused
        ? 'stroke-blue-500/50'
        : 'stroke-blue-500'
      : phase === 'break'
        ? paused
          ? 'stroke-green-400/50'
          : 'stroke-green-400'
        : 'stroke-gray-700';

  const bgColor = phase === 'idle' ? 'stroke-gray-800' : 'stroke-gray-800/40';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        className={bgColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        className={`${strokeColor} transition-[stroke-dashoffset] duration-1000 ease-linear`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Pomodoro dots ──────────────────────────────────────────
function PomodoroDots({ count, max = 8 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {Array.from({ length: Math.min(count, max) }).map((_, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-red-500 animate-in fade-in"
        />
      ))}
      {count === 0 && (
        <span className="text-[11px] text-gray-600">No pomodoros yet</span>
      )}
      {count > max && (
        <span className="text-[11px] text-gray-500 ml-1">+{count - max}</span>
      )}
    </div>
  );
}

// ─── Custom Mode Form ───────────────────────────────────────
function CustomModeForm({
  initialWork,
  initialBreak,
  onSave,
  onCancel,
}: {
  initialWork: number;
  initialBreak: number;
  onSave: (work: number, brk: number) => void;
  onCancel: () => void;
}) {
  const [workMin, setWorkMin] = useState(initialWork);
  const [breakMin, setBreakMin] = useState(initialBreak);

  return (
    <div className="bg-gray-800/60 rounded-lg p-4 space-y-3 border border-gray-700">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        Custom Timer
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-gray-500 block mb-1">
            Work (min)
          </label>
          <input
            type="number"
            min={1}
            max={180}
            value={workMin}
            onChange={(e) => setWorkMin(Math.max(1, Math.min(180, Number(e.target.value))))}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] text-gray-500 block mb-1">
            Break (min)
          </label>
          <input
            type="number"
            min={1}
            max={60}
            value={breakMin}
            onChange={(e) => setBreakMin(Math.max(1, Math.min(60, Number(e.target.value))))}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:border-green-500 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-400 text-xs">
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(workMin, breakMin)}
          className="gap-1 text-xs"
        >
          <Check size={12} /> Apply
        </Button>
      </div>
    </div>
  );
}

// ─── localStorage persistence for timer state ──────────────
const STORAGE_KEY = 'pomodoro_timer_state';
const SAVED_WORK_KEY = 'pomodoro_saved_work';

interface PersistedState {
  phase: 'work' | 'break';
  startedAt: number;       // timestamp when this phase started
  category: string;
  totalDuration: number;   // phase duration in seconds
  pausedAt: number | null;  // timestamp when paused (null = running)
  totalPausedMs: number;    // accumulated paused time in ms
}

interface SavedWorkState {
  remaining: number;       // seconds left when work was paused
  total: number;           // total work duration in seconds
  category: string;
  breakRemaining?: number; // seconds left in break (preserved across cycles)
  breakTotal?: number;     // original break duration in seconds
}

function saveSavedWork(state: SavedWorkState) {
  try { localStorage.setItem(SAVED_WORK_KEY, JSON.stringify(state)); } catch {}
}
function loadSavedWork(): SavedWorkState | null {
  try {
    const raw = localStorage.getItem(SAVED_WORK_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedWorkState;
  } catch { return null; }
}
function clearSavedWork() {
  try { localStorage.removeItem(SAVED_WORK_KEY); } catch {}
}

// ─── Phase transition toast ────────────────────────────────
interface Toast {
  message: string;
  type: 'work' | 'break';
  id: number;
}

function saveTimerState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota / private mode */ }
}

function loadTimerState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as PersistedState;
    // Basic validation
    if (!state.phase || !state.startedAt || !state.totalDuration) return null;
    return state;
  } catch {
    return null;
  }
}

function clearTimerState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

function calcRemaining(state: PersistedState): number {
  const now = state.pausedAt ?? Date.now();
  const elapsed = (now - state.startedAt - state.totalPausedMs) / 1000;
  return Math.max(0, Math.floor(state.totalDuration - elapsed));
}

// ─── Main component ─────────────────────────────────────────
export function PomodoroTimer({ userId, activeCategory, onStartWork, onPhaseChange }: PomodoroTimerProps) {
  const { data: session } = usePomodoroToday(userId);
  const startWorkMut = useStartWork();
  const completeWorkMut = useCompleteWork();
  const completeBreakMut = useCompleteBreak();
  const cancelMut = useCancelPomodoro();
  const pauseMut = usePausePomodoro();
  const resumeMut = useResumePomodoro();
  const setModeMut = useSetPomodoroMode();

  // Notification support
  const {
    permission: notifPermission,
    requestPermission,
    notifyPomodoroComplete,
    notifyBreakOver,
    notifyBreakStarted,
    notifyWorkStarted,
  } = useNotification();
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('pomodoro_notifications');
    return saved !== 'false';
  });

  // ── Restore initial state from localStorage synchronously ──
  const initialState = useRef(loadTimerState());
  const initPhase: Phase = (() => {
    const s = initialState.current;
    if (!s) return 'idle';
    const rem = calcRemaining(s);
    if (rem <= 0) { clearTimerState(); return 'idle'; }
    return s.phase;
  })();
  const initRemaining = (() => {
    const s = initialState.current;
    if (!s || initPhase === 'idle') return 0;
    return calcRemaining(s);
  })();

  const [phase, setPhase] = useState<Phase>(initPhase);
  const [paused, setPaused] = useState(initialState.current?.pausedAt != null && initPhase !== 'idle');
  const [secondsLeft, setSecondsLeft] = useState(initRemaining);
  const [totalSeconds, setTotalSeconds] = useState(
    initPhase !== 'idle' ? (initialState.current?.totalDuration ?? 0) : 0
  );
  const [workCategory, setWorkCategory] = useState(
    initPhase !== 'idle' ? (initialState.current?.category ?? '') : ''
  );
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [savedWork, setSavedWork] = useState<SavedWorkState | null>(loadSavedWork);
  const [toast, setToast] = useState<Toast | null>(null);

  // Show a toast message that auto-dismisses
  const showToast = useCallback((message: string, type: 'work' | 'break') => {
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 4000);
  }, []);

  // Notify parent whenever phase changes
  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  // Prevent the zero-handler from firing on mount when secondsLeft is already 0
  const hasStartedRef = useRef(initPhase !== 'idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const mode: ModeKey = (session?.mode as ModeKey) || '25/5';
  const customWork = session?.customWorkMinutes ?? 25;
  const customBreak = session?.customBreakMinutes ?? 5;
  const config = useMemo(
    () => getModeConfig(mode, customWork, customBreak),
    [mode, customWork, customBreak]
  );

  // Keep config in a ref so the zero-handler effect always has the latest value
  const configRef = useRef(config);
  configRef.current = config;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Handle expired timer found in localStorage on mount ──
  useEffect(() => {
    // If we initialized as idle because localStorage had an expired timer,
    // tell the backend to reset its phase too (fire-and-forget)
    const s = initialState.current;
    if (s && calcRemaining(s) <= 0) {
      cancelMut.mutate(userId);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tick (only when running and not paused) ──
  useEffect(() => {
    if (phase === 'idle' || paused) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, paused]);

  // ── Handle timer reaching zero ──
  useEffect(() => {
    if (secondsLeft > 0 || phase === 'idle' || paused || !hasStartedRef.current) return;

    // Play notification sound
    try {
      audioRef.current?.play();
    } catch {
      /* browser may block autoplay */
    }

    const cfg = configRef.current;

    if (phase === 'work') {
      completeWorkMut.mutate(
        { userId, category: workCategory },
        {
          onSuccess: () => {
            // Transition to break phase
            const breakDuration = cfg.break;
            setPhase('break');
            setSecondsLeft(breakDuration);
            setTotalSeconds(breakDuration);
            showToast(`☕ Work complete! Take a ${Math.floor(breakDuration / 60)} min break`, 'break');
            if (notificationsEnabled) {
              notifyPomodoroComplete(workCategory, Math.floor(breakDuration / 60));
            }
            saveTimerState({
              phase: 'break',
              startedAt: Date.now(),
              category: workCategory,
              totalDuration: breakDuration,
              pausedAt: null,
              totalPausedMs: 0,
            });
          },
        }
      );
    } else if (phase === 'break') {
      // Break fully consumed — resume work (no leftover break) or go idle
      const sw = savedWork ?? loadSavedWork();
      if (sw) {
        resumeMut.mutate(userId);
        setPhase('work');
        setSecondsLeft(sw.remaining);
        setTotalSeconds(sw.total);
        setWorkCategory(sw.category);
        setPaused(false);
        showToast('🔥 Break over! Back to work!', 'work');
        if (notificationsEnabled) {
          notifyBreakOver(sw.category);
        }
        saveTimerState({
          phase: 'work',
          startedAt: Date.now(),
          category: sw.category,
          totalDuration: sw.remaining,
          pausedAt: null,
          totalPausedMs: 0,
        });
        // Clear saved work — break is fully consumed, next pause starts fresh
        setSavedWork(null);
        clearSavedWork();
      } else {
        completeBreakMut.mutate(userId, {
          onSuccess: () => {
            setPhase('idle');
            setSecondsLeft(0);
            setTotalSeconds(0);
            hasStartedRef.current = false;
            clearTimerState();
          },
        });
      }
    }
  }, [secondsLeft, phase, paused, userId, workCategory, completeWorkMut, completeBreakMut]);

  // ── Start work pomodoro ──
  const startWork = useCallback(() => {
    const category = activeCategory || 'Python';
    const cfg = getModeConfig(mode, customWork, customBreak);

    setWorkCategory(category);
    setPhase('work');
    setPaused(false);
    hasStartedRef.current = true;
    setSecondsLeft(cfg.work);
    setTotalSeconds(cfg.work);
    setSavedWork(null);
    clearSavedWork();

    showToast(`🔥 Focus time! ${Math.floor(cfg.work / 60)} min on ${category}`, 'work');
    if (notificationsEnabled) {
      notifyWorkStarted(category, Math.floor(cfg.work / 60));
    }

    saveTimerState({
      phase: 'work',
      startedAt: Date.now(),
      category,
      totalDuration: cfg.work,
      pausedAt: null,
      totalPausedMs: 0,
    });

    startWorkMut.mutate({ userId, category });
  }, [activeCategory, mode, customWork, customBreak, userId, startWorkMut, showToast, notificationsEnabled, notifyWorkStarted]);

  // ── Pause / Resume (persisted to localStorage + backend) ──
  const togglePause = useCallback(() => {
    if (phase === 'work' && !paused) {
      // Pausing WORK → save work state and auto-start BREAK timer
      const cfg = getModeConfig(mode, customWork, customBreak);

      // Check if we have leftover break time from a previous pause cycle
      const prevSaved = savedWork ?? loadSavedWork();
      const breakDuration = (prevSaved?.breakRemaining != null && prevSaved.breakRemaining > 0)
        ? prevSaved.breakRemaining
        : cfg.break;
      const breakTotal = (prevSaved?.breakTotal != null && prevSaved.breakTotal > 0)
        ? prevSaved.breakTotal
        : cfg.break;

      const workState: SavedWorkState = {
        remaining: secondsLeft,
        total: totalSeconds,
        category: workCategory,
        breakRemaining: breakDuration,
        breakTotal: breakTotal,
      };
      setSavedWork(workState);
      saveSavedWork(workState);

      pauseMut.mutate(userId);

      // Switch to break phase
      setPhase('break');
      setSecondsLeft(breakDuration);
      setTotalSeconds(breakTotal);
      setPaused(false);
      const mins = Math.floor(breakDuration / 60);
      const secs = breakDuration % 60;
      const timeStr = secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
      showToast(`☕ Break time! ${timeStr} remaining`, 'break');
      if (notificationsEnabled) {
        notifyBreakStarted(mins);
      }

      saveTimerState({
        phase: 'break',
        startedAt: Date.now(),
        category: workCategory,
        totalDuration: breakDuration,
        pausedAt: null,
        totalPausedMs: 0,
      });
    } else if (phase === 'break' && !paused) {
      // Pausing BREAK → just pause the break timer
      pauseMut.mutate(userId);
      setPaused(true);
      const saved = loadTimerState();
      if (saved) {
        saved.pausedAt = Date.now();
        saveTimerState(saved);
      }
    } else if (paused) {
      // Resume whatever is paused
      resumeMut.mutate(userId);
      setPaused(false);
      const saved = loadTimerState();
      if (saved && saved.pausedAt) {
        saved.totalPausedMs += Date.now() - saved.pausedAt;
        saved.pausedAt = null;
        saveTimerState(saved);
      }
    }
  }, [phase, paused, secondsLeft, totalSeconds, workCategory, mode, customWork, customBreak, userId, pauseMut, resumeMut, showToast]);

  // ── Skip break early → resume work if we have saved state ──
  const skipBreak = () => {
    const sw = savedWork ?? loadSavedWork();
    if (sw) {
      // Save remaining break time so next pause continues from here
      const updatedWork: SavedWorkState = {
        remaining: sw.remaining,
        total: sw.total,
        category: sw.category,
        breakRemaining: secondsLeft,  // current break time left
        breakTotal: sw.breakTotal,
      };
      setSavedWork(updatedWork);
      saveSavedWork(updatedWork);

      // Resume work from where it was paused
      resumeMut.mutate(userId);
      setPhase('work');
      setSecondsLeft(sw.remaining);
      setTotalSeconds(sw.total);
      setWorkCategory(sw.category);
      setPaused(false);
      showToast('🔥 Back to work!', 'work');
      saveTimerState({
        phase: 'work',
        startedAt: Date.now(),
        category: sw.category,
        totalDuration: sw.remaining,
        pausedAt: null,
        totalPausedMs: 0,
      });
    } else {
      completeBreakMut.mutate(userId, {
        onSuccess: () => {
          setPhase('idle');
          setSecondsLeft(0);
          setTotalSeconds(0);
          hasStartedRef.current = false;
          clearTimerState();
        },
      });
    }
  };

  // ── Reset / cancel (persisted to localStorage + backend) ──
  const reset = () => {
    cancelMut.mutate(userId);
    setPhase('idle');
    setPaused(false);
    setSecondsLeft(0);
    setTotalSeconds(0);
    hasStartedRef.current = false;
    clearTimerState();
    setSavedWork(null);
    clearSavedWork();
  };

  // ── Select a preset mode ──
  const selectMode = (m: '25/5' | '50/10') => {
    if (phase !== 'idle') return;
    setModeMut.mutate({ userId, mode: m });
    setShowCustomForm(false);
  };

  // ── Save custom mode ──
  const saveCustomMode = (work: number, brk: number) => {
    setModeMut.mutate({
      userId,
      mode: 'custom',
      customWorkMinutes: work,
      customBreakMinutes: brk,
    });
    setShowCustomForm(false);
  };

  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;

  return (
    <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-700 relative overflow-hidden">
      {/* ── Toast notification ── */}
      {toast && (
        <div
          className={`absolute top-0 inset-x-0 z-10 text-center text-sm font-medium py-2 px-4 animate-in slide-in-from-top fade-in duration-300 ${
            toast.type === 'break'
              ? 'bg-green-600/90 text-white'
              : 'bg-blue-600/90 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-gray-300">
          <TimerIcon size={16} />
          Pomodoro Mode
          <button
            onClick={async () => {
              if (notifPermission !== 'granted') {
                const result = await requestPermission();
                if (result === 'granted') setNotificationsEnabled(true);
              } else {
                const next = !notificationsEnabled;
                setNotificationsEnabled(next);
                localStorage.setItem('pomodoro_notifications', String(next));
              }
            }}
            className={`ml-auto p-1 rounded-full transition-colors ${
              notificationsEnabled && notifPermission === 'granted'
                ? 'text-blue-400 hover:bg-blue-900/30'
                : 'text-gray-600 hover:bg-gray-800'
            }`}
            title={notificationsEnabled ? 'Notifications on' : 'Notifications off'}
          >
            {notificationsEnabled && notifPermission === 'granted' ? (
              <Bell size={14} />
            ) : (
              <BellOff size={14} />
            )}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          {/* ── Mode selector (only in idle) ── */}
          {phase === 'idle' && (
            <div className="w-full space-y-2">
              <div className="flex gap-1.5 justify-center">
                {(['25/5', '50/10'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => selectMode(m)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      mode === m
                        ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                        : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'
                    }`}
                  >
                    {m === '25/5' ? '25 / 5' : '50 / 10'}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustomForm((v) => !v)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                    mode === 'custom'
                      ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                      : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'
                  }`}
                >
                  <Settings size={11} />
                  {mode === 'custom' ? `${customWork} / ${customBreak}` : 'Custom'}
                </button>
              </div>

              {showCustomForm && (
                <CustomModeForm
                  initialWork={customWork}
                  initialBreak={customBreak}
                  onSave={saveCustomMode}
                  onCancel={() => setShowCustomForm(false)}
                />
              )}
            </div>
          )}

          {/* ── Progress ring with time overlay ── */}
          <div className="relative">
            <ProgressRing
              progress={progress}
              phase={phase}
              paused={paused}
              size={180}
              strokeWidth={6}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {phase === 'idle' ? (
                <>
                  <Play size={28} className="text-gray-600 mb-1" />
                  <p className="text-sm text-gray-500">Ready</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {config.label} min
                  </p>
                </>
              ) : (
                <>
                  {phase === 'break' ? (
                    <Coffee size={18} className="text-green-400 mb-1" />
                  ) : (
                    <Flame size={18} className="text-blue-400 mb-1" />
                  )}
                  <p className="text-4xl font-mono font-bold text-white tracking-wider">
                    {formatTime(secondsLeft)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                    {phase === 'work' ? workCategory : 'Break'}
                  </p>
                  {paused && (
                    <p className="text-[10px] text-yellow-500 mt-0.5 animate-pulse">
                      PAUSED
                    </p>
                  )}
                  {phase === 'break' && savedWork && (
                    <p className="text-[10px] text-blue-400/60 mt-0.5">
                      {formatTime(savedWork.remaining)} work left
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Controls ── */}
          <div className="flex gap-2 items-center">
            {phase === 'idle' ? (
              <Button
                onClick={startWork}
                className="gap-2 px-6"
                disabled={startWorkMut.isPending}
              >
                <Play size={14} />
                Start Pomodoro
              </Button>
            ) : (
              <>
                {/* Pause / Resume */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePause}
                  className="gap-1"
                >
                  {paused ? (
                    <>
                      <Play size={14} /> Resume
                    </>
                  ) : (
                    <>
                      <Pause size={14} /> Pause
                    </>
                  )}
                </Button>

                {phase === 'work' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reset}
                    className="gap-1 text-gray-400"
                  >
                    <RotateCcw size={14} /> Cancel
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipBreak}
                      className="gap-1 text-gray-400"
                    >
                      <SkipForward size={14} />
                      {savedWork ? 'Resume Work' : 'Skip Break'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={reset}
                      className="gap-1 text-gray-400"
                    >
                      <RotateCcw size={14} /> Cancel
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {/* ── Pomodoro count for today ── */}
          <div className="w-full pt-2 border-t border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Today&apos;s Pomodoros</span>
              <span className="text-sm font-bold text-red-400">
                {session?.completedPomodoros || 0}
              </span>
            </div>
            <PomodoroDots count={session?.completedPomodoros || 0} />
          </div>
        </div>

        {/* Hidden audio for notification beep */}
        <audio ref={audioRef} preload="none">
          <source
            src="data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQBAABkAGkAbQBmAFUAOAAVAPD/yP+k/4j/dv9w/3b/h/+j/8b/7P8RADQAUgBnAHAAawBZADsAFgDu/8T/oP+E/3P/bP9z/4T/n//C/+n/DgAxAE8AZQBuAGkAVwA5ABQA7P/D/5//g/9y/2z/cv+D/57/wf/o/w0AMABPAGQAZQA="
            type="audio/wav"
          />
        </audio>
      </CardContent>
    </Card>
  );
}

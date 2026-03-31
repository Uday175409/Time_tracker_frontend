'use client';

import { useState, useEffect, useCallback } from 'react';
import { Login } from '@/components/Login';
import { Timer } from '@/components/Timer';
import { CategoryGrid } from '@/components/CategoryGrid';
import { HistoryList } from '@/components/HistoryList';
import { useToday, useStartTracking, useStopTracking } from '@/hooks/useTime';
import { useIdle } from '@/hooks/useIdle';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart3, LogOut, FileText, TimerIcon, Clock } from 'lucide-react';
import { SessionNotes } from '@/components/SessionNotes';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import type { PomodoroPhase } from '@/components/PomodoroTimer';
import { useCategories, Category } from '@/hooks/useCategories';
import { TimeDistributionChart } from '@/components/TimeDistributionChart';
import { getErrorMessage } from '@/lib/api';

export default function Home() {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (u: { id: string; name: string }) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return <Dashboard user={user} onLogout={handleLogout} />;
}

function Dashboard({ user, onLogout }: { user: { id: string; name: string }, onLogout: () => void }) {
  const { data: today, isLoading } = useToday(user.id);
  const startMutation = useStartTracking();
  const stopMutation = useStopTracking();
  const { data: categories } = useCategories(user.id);
  // Idle detection — only used for visual indicator, NOT auto-stopping.
  // Auto-stopping caused sessions to silently vanish when the user
  // was working outside the browser for more than 10 minutes.
  const isIdle = useIdle(600);

  // Build a map from category name to color for color-coded display
  const categoryColorMap: Record<string, string> = {};
  categories?.forEach((c: Category) => { categoryColorMap[c.name] = c.color; });

  // Track whether a pomodoro is active to prevent conflicting actions
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('idle');
  const pomodoroActive = pomodoroPhase !== 'idle';

  const handlePomodoroPhaseChange = useCallback((phase: PomodoroPhase) => {
    setPomodoroPhase(phase);
  }, []);

  const handleStart = (category: string) => {
    // Block starting a new entry while pomodoro is active
    if (pomodoroActive) {
      alert('A Pomodoro is currently active. Cancel or finish it before switching tasks.');
      return;
    }
    const desc = prompt(`What are you working on in ${category}?`);
    startMutation.mutate(
      { userId: user.id, category, description: desc || '' },
      {
        onError: (error) => {
          alert(getErrorMessage(error, 'Unable to start tracking'));
        },
      }
    );
  };

    return (
      <main className="min-h-screen p-4 md:p-8 bg-[#020617] text-gray-100 dark relative overflow-hidden font-sans">
        {/* Animated Background Blobs */}
        <div className="fixed w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] -top-32 -left-32 animate-blob mix-blend-screen pointer-events-none"></div>
        <div className="fixed w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] top-1/4 right-0 animate-blob animation-delay-2000 mix-blend-screen pointer-events-none"></div>
        <div className="fixed w-[700px] h-[700px] bg-emerald-600/10 rounded-full blur-[100px] -bottom-32 left-1/4 animate-blob animation-delay-4000 mix-blend-screen pointer-events-none"></div>

        <div className="max-w-6xl mx-auto space-y-8 relative z-10 animate-fade-in-up">
          <header className="flex justify-between items-center pb-6 border-b border-white/10">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">
                Flow State
              </h1>
              <p className="text-gray-400 mt-1">Welcome back, <span className="text-gray-200 font-medium">{user.name}</span></p>
            </div>
            <div className="flex gap-3">
              <Link href="/eod">
                <Button variant="outline" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10 transition-all rounded-xl">
                  <FileText size={16} /> EOD
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="outline" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10 transition-all rounded-xl">
                  <BarChart3 size={16} /> Analytics
                </Button>
              </Link>
              <Button variant="ghost" onClick={onLogout} className="text-gray-400 hover:text-white hover:bg-red-500/20 transition-colors rounded-xl">
                <LogOut size={18} />
              </Button>
            </div>
          </header>
  
          <section className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-8">
              <Timer
                runningEntry={today?.runningEntry || null}
                onStop={() => {
                  if (pomodoroActive) {
                    alert('A Pomodoro is currently active. Cancel or finish it first.');
                    return;
                  }
                  stopMutation.mutate(user.id, {
                    onError: (error) => {
                      alert(getErrorMessage(error, 'Unable to stop tracking'));
                    },
                  });
                }}
                isLoading={stopMutation.isPending}
              />
              <CategoryGrid
                userId={user.id}
                onStart={handleStart}
                activeCategory={today?.runningEntry?.category}
                isLoading={startMutation.isPending || pomodoroActive}
              />
  
              {/* Pomodoro Timer */}
              <PomodoroTimer
                userId={user.id}
                activeCategory={today?.runningEntry?.category}
                onStartWork={handleStart}
                onPhaseChange={handlePomodoroPhaseChange}
              />
  
              {/* Session-linked notes — only visible when a timer is running */}
              {today?.runningEntry && (
                <SessionNotes
                  userId={user.id}
                  sessionId={today.runningEntry._id}
                  category={today.runningEntry.category}
                />
              )}
            </div>
  
            <div className="space-y-8">
              {/* Daily Summary */}
              <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                <h3 className="text-lg font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">Today&apos;s Focus</h3>
                {/* Total hours worked badge */}
                {today?.totals && Object.keys(today.totals).length > 0 && (
                <div className="flex items-center gap-2 mb-4 p-2 rounded-md bg-gray-800/50 border border-gray-700/40">
                  <Clock size={16} className="text-green-400" />
                  <span className="text-sm text-gray-400">Total worked:</span>
                  <span className="font-mono font-bold text-green-400">
                    {(Object.values(today.totals).reduce((a: number, b: number) => a + b, 0) / 3600).toFixed(2)}h
                  </span>
                </div>
              )}
              <div className="space-y-3">
                {Object.entries(today?.totals || {}).map(([cat, seconds]) => {
                  const color = categoryColorMap[cat] || 'gray';
                  const totalSecs = Object.values(today?.totals || {}).reduce((a, b) => a + b, 0);
                  const pct = totalSecs > 0 ? ((seconds / totalSecs) * 100) : 0;
                  const colorBar: Record<string, string> = {
                    blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500',
                    orange: 'bg-orange-500', red: 'bg-red-500', gray: 'bg-gray-500',
                    pink: 'bg-pink-500', teal: 'bg-teal-500', cyan: 'bg-cyan-500',
                    yellow: 'bg-yellow-500', indigo: 'bg-indigo-500', emerald: 'bg-emerald-500',
                  };
                  return (
                    <div key={cat} className="p-2 rounded hover:bg-gray-800 transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${colorBar[color] || 'bg-gray-500'}`} />
                          {cat}
                        </span>
                        <span className="font-mono text-gray-300">{(seconds / 3600).toFixed(2)}h</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${colorBar[color] || 'bg-gray-500'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time distribution pie chart */}
            <TimeDistributionChart
              totals={today?.totals || {}}
              colorMap={categoryColorMap}
            />

            <HistoryList userId={user.id} />
          </div>
        </section>
      </div>
    </main>
  );
}

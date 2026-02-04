'use client';

import { useState, useEffect } from 'react';
import { Login } from '@/components/Login';
import { Timer } from '@/components/Timer';
import { CategoryGrid } from '@/components/CategoryGrid';
import { HistoryList } from '@/components/HistoryList';
import { useToday, useStartTracking, useStopTracking } from '@/hooks/useTime';
import { useIdle } from '@/hooks/useIdle';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart3, LogOut } from 'lucide-react';

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
  const isIdle = useIdle(600); // 10 minutes

  useEffect(() => {
    if (isIdle && today?.runningEntry) {
      stopMutation.mutate(user.id);
      // Ideally show a toast here
      console.log('Auto-stopped due to inactivity');
    }
  }, [isIdle, today?.runningEntry, user.id]);

  const handleStart = (category: string) => {
    // Simple prompt for description for now
    const desc = prompt(`What are you working on in ${category}?`);
    startMutation.mutate({ userId: user.id, category, description: desc || '' });
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-black text-gray-100 dark">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Flow State
            </h1>
            <p className="text-gray-400">Welcome back, {user.name}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/analytics">
              <Button variant="outline" className="gap-2">
                <BarChart3 size={16} /> Analytics
              </Button>
            </Link>
            <Button variant="ghost" onClick={onLogout}>
              <LogOut size={16} />
            </Button>
          </div>
        </header>

        <section className="grid gap-8 md:grid-cols-2">
          <div className="space-y-8">
            <Timer
              runningEntry={today?.runningEntry || null}
              onStop={() => stopMutation.mutate(user.id)}
              isLoading={stopMutation.isPending}
            />
            <CategoryGrid
              onStart={handleStart}
              activeCategory={today?.runningEntry?.category}
              isLoading={startMutation.isPending}
            />
          </div>

          <div className="space-y-8">
            {/* Daily Summary */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-xl font-semibold mb-4 text-gray-200">Today's Focus</h3>
              <div className="space-y-3">
                {Object.entries(today?.totals || {}).map(([cat, seconds]) => (
                  <div key={cat} className="flex justify-between items-center p-2 rounded hover:bg-gray-800 transition-colors">
                    <span className="font-medium">{cat}</span>
                    <span className="font-mono text-gray-300">{(seconds / 3600).toFixed(2)}h</span>
                  </div>
                ))}
              </div>
            </div>

            <HistoryList userId={user.id} />
          </div>
        </section>
      </div>
    </main>
  );
}

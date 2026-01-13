'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const CATEGORIES = ['Python', 'SQL', 'Datasetu', 'Break', 'TT'];

interface RunningEntry {
  _id: string;
  category: string;
  startTime: string;
}

interface TodayData {
  totals: Record<string, number>;
  runningEntry: RunningEntry | null;
}

interface HistoryEntry {
  _id: string;
  category: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  description: string;
}

interface DailyHistory {
  date: string;
  entries: HistoryEntry[];
  totals: Record<string, number>;
  totalSeconds: number;
}

export default function Home() {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [todayData, setTodayData] = useState<TodayData>({
    totals: { Python: 0, SQL: 0, Datasetu: 0, Break: 0, TT: 0 },
    runningEntry: null,
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [history, setHistory] = useState<DailyHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleLogin = async () => {
    if (!loginName || !loginPassword) {
      alert('Please enter both name and password');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: loginName, password: loginPassword }),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        // Store with 10 day expiration
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 10);
        const userWithExpiry = {
          ...data.user,
          expiry: expiryDate.getTime()
        };
        localStorage.setItem('user', JSON.stringify(userWithExpiry));
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    }
  };

  const fetchTodayData = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URL}/api/track/today?userId=${user.id}`);
      const data = await response.json();
      if (data.success) {
        setTodayData(data);
      }
    } catch (error) {
      console.error('Error fetching today data:', error);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URL}/api/track/history?userId=${user.id}&days=30`);
      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Check if user data has expired (10 days)
        if (userData.expiry && userData.expiry > Date.now()) {
          setUser({ id: userData.id, name: userData.name });
        } else {
          // Expired, remove from storage
          localStorage.removeItem('user');
        }
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    
    fetchTodayData();
    fetchHistory();
    const interval = setInterval(fetchTodayData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (todayData.runningEntry) {
      const timer = setInterval(() => {
        const start = new Date(todayData.runningEntry!.startTime).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - start) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setElapsedTime(0);
    }
  }, [todayData.runningEntry]);

  const handleCategoryClick = (category: string) => {
    // Show description modal for all categories
    setSelectedCategory(category);
    setDescription('');
    setShowDescriptionModal(true);
  };

  const handleStartCategory = async (category: string, desc: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/track/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, userId: user.id, description: desc }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchTodayData();
        await fetchHistory();
        setShowDescriptionModal(false);
        setDescription('');
      }
    } catch (error) {
      console.error('Error starting tracking:', error);
    }
    setLoading(false);
  };

  const handleStop = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/track/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchTodayData();
        await fetchHistory();
      }
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    if (dateString === today) return 'Today';
    if (dateString === yesterdayString) return 'Yesterday';
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric'
    };
    
    if (date.getFullYear() !== new Date().getFullYear()) {
      options.year = 'numeric';
    }
    
    return date.toLocaleDateString('en-US', options);
  };

  const formatTimeRange = (start: string, end: string) => {
    const startTime = new Date(start).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const endTime = new Date(end).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `${startTime} - ${endTime}`;
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 md:mb-8">Internship Time Tracker</h1>

        {/* Login Form */}
        {!user ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Login</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Name</label>
                  <input
                    type="text"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md bg-background text-foreground"
                    placeholder="Enter your name"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md bg-background text-foreground"
                    placeholder="Enter password"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                <Button onClick={handleLogin} className="w-full" size="lg">
                  Login
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  New user? Just enter a name and password to create an account
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* User Info */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-lg md:text-xl">Welcome, <span className="font-bold">{user.name}</span>!</p>
              <div className="flex gap-2">
                <Button 
                  variant={showHistory ? 'default' : 'outline'} 
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? 'Hide History' : 'Show History'}
                </Button>
                <Button variant="outline" onClick={() => { setUser(null); localStorage.removeItem('user'); }}>
                  Logout
                </Button>
              </div>
            </div>

            {/* Current Running Task */}
            <Card>
              <CardHeader>
                <CardTitle>Current Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {todayData.runningEntry ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <p className="text-xl md:text-2xl font-bold">{todayData.runningEntry.category}</p>
                      <p className="text-3xl md:text-4xl font-mono mt-2">{formatTime(elapsedTime)}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={handleStop}
                      disabled={loading}
                      className="w-full sm:w-auto"
                    >
                      Stop
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-base md:text-lg text-center sm:text-left">No activity running. Click a category to start.</p>
                )}
              </CardContent>
            </Card>

            {/* Category Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Start Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {CATEGORIES.map((category) => (
                    <Button
                      key={category}
                      size="lg"
                      variant={todayData.runningEntry?.category === category ? 'default' : 'outline'}
                      onClick={() => {
                        if (todayData.runningEntry?.category === category) {
                          handleStop();
                        } else {
                          handleCategoryClick(category);
                        }
                      }}
                      disabled={loading}
                      className="h-16 md:h-20 text-base md:text-lg"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Today's Totals */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Totals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 md:space-y-3">
                  {CATEGORIES.map((category) => {
                    const seconds = todayData.totals[category] || 0;
                    const displaySeconds = 
                      todayData.runningEntry?.category === category 
                        ? seconds + elapsedTime 
                        : seconds;
                    
                    return (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-base md:text-lg font-medium">{category}</span>
                        <span className="text-lg md:text-xl font-mono">{formatTime(displaySeconds)}</span>
                      </div>
                    );
                  })}
                  <div className="pt-2 md:pt-3 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-lg md:text-xl font-bold">Total</span>
                      <span className="text-xl md:text-2xl font-mono font-bold">
                        {formatTime(
                          Object.values(todayData.totals).reduce((a, b) => a + b, 0) +
                          elapsedTime
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* History Section */}
            {showHistory && (
              <Card>
                <CardHeader>
                  <CardTitle>History (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No history data available</p>
                  ) : (
                    <div className="space-y-6">
                      {history.map((day) => (
                        <div key={day.date} className="border-b border-border pb-4 last:border-0">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold">{formatDate(day.date)}</h3>
                            <span className="text-lg font-mono font-bold">{formatTime(day.totalSeconds)}</span>
                          </div>
                          
                          {/* Daily Totals */}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3 text-sm">
                            {CATEGORIES.map((category) => (
                              <div key={category} className="flex justify-between bg-muted/50 px-2 py-1 rounded">
                                <span className="font-medium">{category}</span>
                                <span className="font-mono">{formatTime(day.totals[category] || 0)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Individual Entries */}
                          <div className="space-y-2">
                            {day.entries.map((entry) => (
                              <div key={entry._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm bg-muted/30 px-3 py-2 rounded">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{entry.category}</span>
                                  <span className="text-muted-foreground">{formatTimeRange(entry.startTime, entry.endTime)}</span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4">
                                  {entry.description && (
                                    <span className="text-muted-foreground italic truncate max-w-xs">{entry.description}</span>
                                  )}
                                  <span className="font-mono font-semibold">{formatTime(entry.durationSeconds)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Description Modal */}
        {showDescriptionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md mx-4 relative">
              <button
                onClick={() => {
                  setShowDescriptionModal(false);
                  setDescription('');
                }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl pr-8">What are you doing with {selectedCategory}?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md min-h-[100px] bg-background text-foreground resize-none"
                    placeholder="Describe what you're working on (optional)..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStartCategory(selectedCategory, description)}
                      disabled={loading}
                      className="flex-1"
                    >
                      Start with Description
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStartCategory(selectedCategory, '')}
                      disabled={loading}
                      className="flex-1"
                    >
                      Start without Description
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    useAnalytics,
    useTrend,
    useWeeklyCategories,
    useHeatmap,
    useInsights,
} from '@/hooks/useAnalytics';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendChart } from '@/components/analytics/TrendChart';
import { CategoryComparisonChart } from '@/components/analytics/CategoryComparisonChart';
import { ActivityHeatmap } from '@/components/analytics/ActivityHeatmap';
import { InsightCards } from '@/components/analytics/InsightCards';
import { SessionLengthChart } from '@/components/analytics/SessionLengthChart';

export default function AnalyticsPage() {
    const [user, setUser] = useState<{ id: string; name: string } | null>(null);
    const [range, setRange] = useState<'day' | 'week' | 'month'>('week');
    const [trendDays, setTrendDays] = useState(30);

    useEffect(() => {
        const saved = localStorage.getItem('user');
        if (saved) setUser(JSON.parse(saved));
    }, []);

    const { data: stats, isLoading } = useAnalytics(user?.id, range);
    const { data: trendData } = useTrend(user?.id, trendDays);
    const { data: weeklyData } = useWeeklyCategories(user?.id, 4);
    const { data: heatmapData } = useHeatmap(user?.id, 365);
    const { data: insights } = useInsights(user?.id);

    if (!user) return <div className="p-8 text-gray-400">Please login first</div>;

    const productivityData = [
        { name: 'Productive', value: parseFloat(stats?.productiveHours || '0'), color: '#4ade80' },
        { name: 'Total', value: parseFloat(stats?.totalHours || '0'), color: '#3b82f6' },
    ];

    return (
        <main className="min-h-screen p-4 md:p-8 bg-black text-gray-100 dark">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex items-center gap-4 pb-4 border-b border-gray-800">
                    <Link href="/">
                        <Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                            Analytics Dashboard
                        </h1>
                        <p className="text-sm text-gray-500">Insights into your work patterns</p>
                    </div>
                </header>

                {/* Insight cards row */}
                {insights && <InsightCards data={insights} />}

                {/* Productivity summary — range selector + overview bar chart */}
                <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-500 mr-2">Period:</span>
                    {(['day', 'week', 'month'] as const).map(r => (
                        <Button
                            key={r}
                            variant={range === r ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setRange(r)}
                            className="capitalize text-xs"
                        >
                            {r}
                        </Button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="text-gray-500">Loading...</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader className="text-gray-400 text-sm pb-1">Productivity Score</CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-green-400">{stats?.productivityScore}%</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader className="text-gray-400 text-sm pb-1">Focus Streak</CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-blue-400">{stats?.maxFocusStreak}</div>
                                <p className="text-xs text-gray-600">consecutive sessions</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader className="text-gray-400 text-sm pb-1">Total Hours</CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{stats?.totalHours}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader className="text-gray-400 text-sm pb-1">Productive Hours</CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-purple-400">{stats?.productiveHours}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Trend line chart */}
                {trendData && (
                    <div>
                        <div className="flex gap-2 mb-2 items-center">
                            <span className="text-xs text-gray-500 mr-1">Trend:</span>
                            {[7, 14, 30, 60].map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setTrendDays(d)}
                                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                                        trendDays === d
                                            ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                                            : 'border-gray-700 text-gray-500 hover:border-gray-600'
                                    }`}
                                >
                                    {d}d
                                </button>
                            ))}
                        </div>
                        <TrendChart data={trendData} title={`Daily Trend (${trendDays} days)`} />
                    </div>
                )}

                {/* Two-column: Category comparison + Avg session length */}
                <div className="grid gap-4 md:grid-cols-2">
                    {weeklyData && <CategoryComparisonChart data={weeklyData} />}
                    {trendData && <SessionLengthChart data={trendData} />}
                </div>

                {/* Heatmap — full width */}
                {heatmapData && <ActivityHeatmap data={heatmapData} />}

                {/* Hours overview bar (kept from original) */}
                <Card className="bg-gray-900 border-gray-800 h-80">
                    <CardHeader><CardTitle className="text-base">Hours Overview</CardTitle></CardHeader>
                    <CardContent className="h-full pb-16">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productivityData}>
                                <XAxis dataKey="name" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                    {productivityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

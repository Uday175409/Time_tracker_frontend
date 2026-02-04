'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAnalytics } from '@/hooks/useAnalytics';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AnalyticsPage() {
    const [user, setUser] = useState<{ id: string; name: string } | null>(null);
    const [range, setRange] = useState<'day' | 'week' | 'month'>('week');

    useEffect(() => {
        const saved = localStorage.getItem('user');
        if (saved) setUser(JSON.parse(saved));
    }, []);

    const { data: stats, isLoading } = useAnalytics(user?.id, range);

    if (!user) return <div className="p-8">Please login first</div>;

    const productivityData = [
        { name: 'Productive', value: parseFloat(stats?.productiveHours || '0'), color: '#4ade80' },
        { name: 'Total', value: parseFloat(stats?.totalHours || '0'), color: '#3b82f6' },
    ];

    return (
        <main className="min-h-screen p-8 bg-black text-gray-100 dark">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost"><ArrowLeft /></Button>
                    </Link>
                    <h1 className="text-3xl font-bold">Analytics</h1>
                </header>

                <div className="flex gap-2 mb-6">
                    {(['day', 'week', 'month'] as const).map(r => (
                        <Button
                            key={r}
                            variant={range === r ? 'default' : 'outline'}
                            onClick={() => setRange(r)}
                            className="capitalize"
                        >
                            {r}
                        </Button>
                    ))}
                </div>

                {isLoading ? <div>Loading...</div> : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader className="text-gray-400 text-sm">Productivity Score</CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-green-400">{stats?.productivityScore}%</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader className="text-gray-400 text-sm">Focus Streak (Sessions)</CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-blue-400">{stats?.maxFocusStreak}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader className="text-gray-400 text-sm">Total Hours</CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{stats?.totalHours}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader className="text-gray-400 text-sm">Productive Hours</CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-purple-400">{stats?.productiveHours}</div>
                            </CardContent>
                        </Card>

                        {/* Chart */}
                        <Card className="col-span-full bg-gray-900 border-gray-800 h-96">
                            <CardHeader><CardTitle>Hours Overview</CardTitle></CardHeader>
                            <CardContent className="h-full pb-12">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={productivityData}>
                                        <XAxis dataKey="name" stroke="#888888" />
                                        <YAxis stroke="#888888" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Bar dataKey="value" fill="#8884d8">
                                            {productivityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </main>
    );
}

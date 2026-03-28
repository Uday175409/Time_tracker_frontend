'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';

interface TimerProps {
    runningEntry: {
        category: string;
        startTime: string;
    } | null;
    onStop: () => void;
    isLoading?: boolean;
}

export function Timer({ runningEntry, onStop, isLoading }: TimerProps) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!runningEntry) {
            setElapsed(0);
            return;
        }

        const interval = setInterval(() => {
            const start = new Date(runningEntry.startTime).getTime();
            const now = Date.now();
            setElapsed(Math.floor((now - start) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [runningEntry]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card className={`relative overflow-hidden backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500 ${runningEntry ? 'bg-indigo-950/40 shadow-indigo-500/20' : 'bg-white/[0.02]'}`}>
            {runningEntry && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 animate-pulse pointer-events-none" />
            )}
            <CardHeader className="relative z-10 pb-2">
                <CardTitle className="text-gray-400 text-sm tracking-widest uppercase font-semibold">
                    {runningEntry ? 'Running Session' : 'Current Activity'}
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
                {runningEntry ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-2">
                        <div className="text-center sm:text-left">
                            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                                {runningEntry.category}
                            </h2>
                            <p className="text-6xl font-mono font-bold tracking-tight text-white drop-shadow-md">
                                {formatTime(elapsed)}
                            </p>
                        </div>
                        <Button
                            onClick={onStop}
                            disabled={isLoading}
                            className="w-full sm:w-auto h-20 px-10 text-xl font-bold rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95 border border-red-400/20"
                        >
                            <Square className="mr-3 h-7 w-7" fill="currentColor" /> {isLoading ? 'Stopping...' : 'Stop Tracking'}
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <div className="p-4 bg-white/5 rounded-full mb-4 group-hover:bg-white/10 transition-colors">
                            <Play className="h-10 w-10 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium">Ready to flow.</p>
                        <p className="text-sm">Select a category below to start.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

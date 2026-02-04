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
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader>
                <CardTitle className="text-gray-200">Current Activity</CardTitle>
            </CardHeader>
            <CardContent>
                {runningEntry ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="text-center sm:text-left">
                            <p className="text-2xl font-bold text-primary mb-2">{runningEntry.category}</p>
                            <p className="text-5xl font-mono font-bold tracking-wider text-white">
                                {formatTime(elapsed)}
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            size="lg"
                            onClick={onStop}
                            disabled={isLoading}
                            className="w-full sm:w-auto h-16 px-8 text-lg hover:scale-105 transition-transform"
                        >
                            <Square className="mr-2 h-6 w-6" fill="currentColor" /> Stop
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <Play className="h-12 w-12 mb-4 opacity-20" />
                        <p className="text-lg">No activity running. Start a task below.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

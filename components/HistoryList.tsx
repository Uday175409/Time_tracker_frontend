'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useHistory } from '@/hooks/useHistory';

export function HistoryList({ userId }: { userId: string }) {
    const { data: history, isLoading } = useHistory(userId);

    if (isLoading) return <div>Loading history...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {history?.map((day: any) => (
                    <div key={day.date} className="border-b pb-4 last:border-0">
                        <h3 className="font-bold mb-2">{day.date} - {(day.totalSeconds / 3600).toFixed(2)} hrs</h3>
                        <div className="space-y-2 pl-4">
                            {day.entries.map((entry: any) => (
                                <div key={entry._id} className="flex justify-between text-sm">
                                    <span>{entry.category}</span>
                                    <span className="text-muted-foreground">
                                        {new Date(entry.startTime).toLocaleTimeString()} -
                                        {new Date(entry.endTime).toLocaleTimeString()}
                                    </span>
                                    <span className="font-mono">{(entry.durationSeconds / 60).toFixed(0)}m</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

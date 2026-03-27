'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useHistory } from '@/hooks/useHistory';
import { useNotes } from '@/hooks/useNotes';
import { useCategories, Category } from '@/hooks/useCategories';
import { MessageSquare, Clock, Tag } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

const colorBadge: Record<string, string> = {
    blue: 'bg-blue-900/40 text-blue-400 border-blue-800/50',
    green: 'bg-green-900/40 text-green-400 border-green-800/50',
    purple: 'bg-purple-900/40 text-purple-400 border-purple-800/50',
    orange: 'bg-orange-900/40 text-orange-400 border-orange-800/50',
    red: 'bg-red-900/40 text-red-400 border-red-800/50',
    gray: 'bg-gray-800/40 text-gray-400 border-gray-700/50',
    pink: 'bg-pink-900/40 text-pink-400 border-pink-800/50',
    teal: 'bg-teal-900/40 text-teal-400 border-teal-800/50',
    cyan: 'bg-cyan-900/40 text-cyan-400 border-cyan-800/50',
    yellow: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50',
    indigo: 'bg-indigo-900/40 text-indigo-400 border-indigo-800/50',
    emerald: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50',
};

const colorDotMap: Record<string, string> = {
    blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500',
    orange: 'bg-orange-500', red: 'bg-red-500', gray: 'bg-gray-500',
    pink: 'bg-pink-500', teal: 'bg-teal-500', cyan: 'bg-cyan-500',
    yellow: 'bg-yellow-500', indigo: 'bg-indigo-500', emerald: 'bg-emerald-500',
};

/** Inline badge showing note count for a session entry */
function SessionNoteBadge({ userId, entryId }: { userId: string; entryId: string }) {
    const { data: notes } = useNotes(userId, 'SESSION', entryId);
    if (!notes || notes.length === 0) return null;
    return (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-400 bg-blue-900/30 rounded px-1.5 py-0.5">
            <MessageSquare size={9} /> {notes.length}
        </span>
    );
}

export function HistoryList({ userId }: { userId: string }) {
    const { data: history, isLoading } = useHistory(userId);
    const { data: categories } = useCategories(userId);
    const [filterTag, setFilterTag] = useState<string | null>(null);

    const categoryMap = useMemo(() => {
        const map: Record<string, Category> = {};
        categories?.forEach(c => { map[c.name] = c; });
        return map;
    }, [categories]);

    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        categories?.forEach(c => { if (c.tag) tags.add(c.tag); });
        return Array.from(tags);
    }, [categories]);

    if (isLoading) return <div>Loading history...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock size={18} />
                    History
                </CardTitle>
                {/* Tag filter */}
                {availableTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        <button
                            onClick={() => setFilterTag(null)}
                            className={cn(
                                'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                                !filterTag
                                    ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                                    : 'border-gray-700 text-gray-500 hover:border-gray-600'
                            )}
                        >
                            All
                        </button>
                        {availableTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                                className={cn(
                                    'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                                    filterTag === tag
                                        ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                                        : 'border-gray-700 text-gray-500 hover:border-gray-600'
                                )}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {history?.map((day: any) => {
                    const filteredEntries = filterTag
                        ? day.entries.filter((e: any) => categoryMap[e.category]?.tag === filterTag)
                        : day.entries;
                    if (filteredEntries.length === 0) return null;
                    const totalSeconds = filteredEntries.reduce((sum: number, e: any) => sum + (e.durationSeconds || 0), 0);

                    return (
                        <div key={day.date} className="border-b pb-4 last:border-0">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold">{day.date}</h3>
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-800 text-green-400 border border-gray-700">
                                    {(totalSeconds / 3600).toFixed(2)}h total
                                </span>
                            </div>
                            <div className="space-y-2 pl-4">
                                {filteredEntries.map((entry: any) => {
                                    const cat = categoryMap[entry.category];
                                    const color = cat?.color || 'gray';
                                    const startStr = new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const endStr = entry.endTime
                                        ? new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : 'running';
                                    const durMin = Math.round((entry.durationSeconds || 0) / 60);
                                    const durHrs = (entry.durationSeconds / 3600).toFixed(2);
                                    return (
                                        <div key={entry._id} className="flex justify-between items-center text-sm gap-2">
                                            <span className="flex items-center gap-1.5">
                                                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', colorDotMap[color] || 'bg-gray-500')} />
                                                <span className={cn(
                                                    'px-1.5 py-0.5 rounded text-xs border',
                                                    colorBadge[color] || colorBadge.gray
                                                )}>
                                                    {entry.category}
                                                </span>
                                                {cat?.tag && (
                                                    <span className="text-[9px] text-gray-500 bg-gray-800 rounded px-1 py-0.5">
                                                        {cat.tag}
                                                    </span>
                                                )}
                                                <SessionNoteBadge userId={userId} entryId={entry._id} />
                                            </span>
                                            <span className="text-gray-400 text-xs font-mono whitespace-nowrap">
                                                {startStr} → {endStr}
                                            </span>
                                            <span className="font-mono text-xs whitespace-nowrap">
                                                {durMin >= 60 ? `${durHrs}h` : `${durMin}m`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

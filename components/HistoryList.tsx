'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useHistory } from '@/hooks/useHistory';
import { useNotes } from '@/hooks/useNotes';
import { useCategories, Category } from '@/hooks/useCategories';
import { MessageSquare, Clock, Tag, PencilLine, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api';
import { TimeEntry, useRegularizeEntry, useReviewRegularization } from '@/hooks/useTime';

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
    const regularizeMutation = useRegularizeEntry();
    const reviewMutation = useReviewRegularization();
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
    const [reason, setReason] = useState('');
    const [regularizeError, setRegularizeError] = useState<string | null>(null);
    const [expandedAuditFor, setExpandedAuditFor] = useState<string | null>(null);
    const [formCategory, setFormCategory] = useState('');
    const [formStart, setFormStart] = useState('');
    const [formEnd, setFormEnd] = useState('');
    const [formDescription, setFormDescription] = useState('');

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

    const toLocalInput = (iso?: string | null): string => {
        if (!iso) return '';
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const openRegularize = (entry: TimeEntry) => {
        setEditingEntry(entry);
        setFormCategory(entry.category);
        setFormStart(toLocalInput(entry.startTime));
        setFormEnd(toLocalInput(entry.endTime || undefined));
        setFormDescription(entry.description || '');
        setReason('');
        setRegularizeError(null);
    };

    const closeRegularize = () => {
        setEditingEntry(null);
        setRegularizeError(null);
        setReason('');
    };

    const submitRegularize = () => {
        if (!editingEntry) return;
        if (!reason.trim()) {
            setRegularizeError('Reason is required.');
            return;
        }
        if (!formStart || !formEnd || new Date(formStart) >= new Date(formEnd)) {
            setRegularizeError('Start time must be before end time.');
            return;
        }

        setRegularizeError(null);
        regularizeMutation.mutate(
            {
                entryId: editingEntry._id,
                userId,
                category: formCategory,
                description: formDescription,
                startTime: new Date(formStart).toISOString(),
                endTime: new Date(formEnd).toISOString(),
                reason: reason.trim(),
            },
            {
                onSuccess: () => closeRegularize(),
                onError: (err) => setRegularizeError(getErrorMessage(err, 'Failed to regularize entry')),
            }
        );
    };

    const review = (entry: TimeEntry, status: 'approved' | 'rejected') => {
        reviewMutation.mutate({ entryId: entry._id, userId, status });
    };

    const statusBadge = (entry: TimeEntry) => {
        if (!entry.isRegularized) return null;
        const current = entry.regularizationStatus || 'pending';
        if (current === 'approved') {
            return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-green-900/40 text-green-300 border border-green-800/50"><CheckCircle2 size={10} /> Approved</span>;
        }
        if (current === 'rejected') {
            return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-800/50"><XCircle size={10} /> Rejected</span>;
        }
        return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-800/50"><AlertCircle size={10} /> Pending</span>;
    };

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
                {history?.map((day) => {
                    const filteredEntries = filterTag
                        ? day.entries.filter((e) => categoryMap[e.category]?.tag === filterTag)
                        : day.entries;
                    if (filteredEntries.length === 0) return null;
                    const totalSeconds = filteredEntries.reduce((sum, e) => sum + (e.durationSeconds || 0), 0);

                    return (
                        <div key={day.date} className="border-b pb-4 last:border-0">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold">{day.date}</h3>
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-800 text-green-400 border border-gray-700">
                                    {(totalSeconds / 3600).toFixed(2)}h total
                                </span>
                            </div>
                            <div className="space-y-2 pl-4">
                                {filteredEntries.map((entry) => {
                                    const cat = categoryMap[entry.category];
                                    const color = cat?.color || 'gray';
                                    const startStr = new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const endStr = entry.endTime
                                        ? new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : 'running';
                                    const durMin = Math.round((entry.durationSeconds || 0) / 60);
                                    const durHrs = ((entry.durationSeconds || 0) / 3600).toFixed(2);
                                    return (
                                        <div key={entry._id} className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5">
                                            <div className="flex justify-between items-center text-sm gap-2">
                                                <span className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', colorDotMap[color] || 'bg-gray-500')} />
                                                    <span className={cn(
                                                        'px-1.5 py-0.5 rounded text-xs border',
                                                        colorBadge[color] || colorBadge.gray
                                                    )}>
                                                        {entry.category}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 bg-gray-800 rounded px-1 py-0.5 border border-gray-700/50">
                                                        {entry.source === 'manual' ? 'Manual' : 'Auto'}
                                                    </span>
                                                    {entry.isRegularized && (
                                                        <span className="text-[9px] text-blue-300 bg-blue-900/40 rounded px-1 py-0.5 border border-blue-800/60">
                                                            Regularized
                                                        </span>
                                                    )}
                                                    {statusBadge(entry)}
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
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => openRegularize(entry)}
                                                    className="text-[10px] px-2 py-0.5 rounded border border-blue-700/50 text-blue-300 hover:bg-blue-500/10 inline-flex items-center gap-1"
                                                >
                                                    <PencilLine size={10} /> Regularize
                                                </button>
                                                <button
                                                    onClick={() => setExpandedAuditFor(expandedAuditFor === entry._id ? null : entry._id)}
                                                    className="text-[10px] px-2 py-0.5 rounded border border-gray-700 text-gray-300 hover:bg-white/5"
                                                >
                                                    {expandedAuditFor === entry._id ? 'Hide Audit' : 'View Audit'}
                                                </button>
                                                {entry.regularizationStatus === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => review(entry, 'approved')}
                                                            className="text-[10px] px-2 py-0.5 rounded border border-green-700/50 text-green-300 hover:bg-green-500/10"
                                                            disabled={reviewMutation.isPending}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => review(entry, 'rejected')}
                                                            className="text-[10px] px-2 py-0.5 rounded border border-red-700/50 text-red-300 hover:bg-red-500/10"
                                                            disabled={reviewMutation.isPending}
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                            {expandedAuditFor === entry._id && (
                                                <div className="mt-2 p-2 rounded bg-black/30 border border-gray-800 text-xs text-gray-300 space-y-1">
                                                    {(entry.auditHistory || []).length === 0 ? (
                                                        <p className="text-gray-500">No audit history.</p>
                                                    ) : (
                                                        (entry.auditHistory || []).slice().reverse().map((a, idx) => (
                                                            <div key={`${entry._id}-audit-${idx}`} className="border-b border-gray-800 pb-1 last:border-b-0">
                                                                <p className="text-gray-400">{new Date(a.changedAt).toLocaleString()}</p>
                                                                <p>Reason: {a.reason}</p>
                                                                <p>Old: {new Date(a.oldStartTime).toLocaleString()} → {a.oldEndTime ? new Date(a.oldEndTime).toLocaleString() : 'N/A'} ({a.oldCategory})</p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </CardContent>

            {editingEntry && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-xl rounded-xl border border-white/10 bg-[#0b1220] p-5 space-y-3">
                        <h3 className="text-lg font-semibold text-gray-100">Regularize Entry</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Start Time</label>
                                <input
                                    type="datetime-local"
                                    value={formStart}
                                    onChange={(e) => setFormStart(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">End Time</label>
                                <input
                                    type="datetime-local"
                                    value={formEnd}
                                    onChange={(e) => setFormEnd(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Category</label>
                                <select
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200"
                                >
                                    {(categories || []).map((c) => (
                                        <option key={c._id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Duration</label>
                                <div className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 flex items-center text-sm text-green-400 font-mono">
                                    {(formStart && formEnd && new Date(formEnd) > new Date(formStart))
                                        ? `${((new Date(formEnd).getTime() - new Date(formStart).getTime()) / 3600000).toFixed(2)}h`
                                        : 'Invalid'}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Description</label>
                            <textarea
                                rows={2}
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Reason for change</label>
                            <textarea
                                rows={2}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200"
                                placeholder="Required for audit trail"
                            />
                        </div>
                        {regularizeError && <p className="text-xs text-red-400">{regularizeError}</p>}
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={closeRegularize}>Cancel</Button>
                            <Button onClick={submitRegularize} disabled={regularizeMutation.isPending}>
                                {regularizeMutation.isPending ? 'Saving...' : 'Submit Regularization'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEOD, useUpdateEOD } from '@/hooks/useEOD';
import {
  FileText,
  Save,
  Plus,
  X,
  Clock,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

interface EODSummaryPanelProps {
  userId: string;
  date: string; // YYYY-MM-DD
}

/**
 * End-of-Day summary panel. Shows auto-generated metrics from tracked time
 * and lets the user add qualitative context (summary, highlights, blockers).
 * Every save creates a version snapshot on the backend for audit.
 */
export function EODSummaryPanel({ userId, date }: EODSummaryPanelProps) {
  const { data: eod, isLoading } = useEOD(userId, date);
  const updateMutation = useUpdateEOD();

  // Local editable state — synced from server data on load
  const [summary, setSummary] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState('');
  const [newBlocker, setNewBlocker] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Populate local state when server data arrives
  useEffect(() => {
    if (eod) {
      setSummary(eod.summary || '');
      setHighlights(eod.highlights || []);
      setBlockers(eod.blockers || []);
      setIsDirty(false);
    }
  }, [eod]);

  const handleSave = useCallback(() => {
    updateMutation.mutate(
      { userId, date, summary, highlights, blockers },
      { onSuccess: () => setIsDirty(false) }
    );
  }, [userId, date, summary, highlights, blockers, updateMutation]);

  // Mark as dirty when user edits anything
  const markDirty = () => setIsDirty(true);

  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setHighlights((prev) => [...prev, newHighlight.trim()]);
    setNewHighlight('');
    markDirty();
  };

  const removeHighlight = (index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  };

  const addBlocker = () => {
    if (!newBlocker.trim()) return;
    setBlockers((prev) => [...prev, newBlocker.trim()]);
    setNewBlocker('');
    markDirty();
  };

  const removeBlocker = (index: number) => {
    setBlockers((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <p className="text-gray-500 text-sm">Loading EOD summary...</p>
        </CardContent>
      </Card>
    );
  }

  if (!eod) return null;

  const productivityPct =
    eod.totalHours > 0
      ? Math.round((eod.productiveHours / eod.totalHours) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Auto-generated metrics — read-only, computed from time entries */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-gray-200">
            <FileText size={18} />
            End-of-Day Summary
            <span className="text-xs text-gray-500 font-normal ml-auto">{date}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <Clock size={16} className="mx-auto mb-1 text-blue-400" />
              <p className="text-2xl font-bold text-white">{eod.totalHours}h</p>
              <p className="text-[11px] text-gray-500">Total Tracked</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <TrendingUp size={16} className="mx-auto mb-1 text-green-400" />
              <p className="text-2xl font-bold text-green-400">{eod.productiveHours}h</p>
              <p className="text-[11px] text-gray-500">Productive</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <Sparkles size={16} className="mx-auto mb-1 text-purple-400" />
              <p className="text-2xl font-bold text-purple-400">{productivityPct}%</p>
              <p className="text-[11px] text-gray-500">Score</p>
            </div>
          </div>

          {/* Category breakdown */}
          {eod.categoryBreakdown && Object.keys(eod.categoryBreakdown).length > 0 && (
            <div className="space-y-1.5 mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Categories</p>
              {Object.entries(eod.categoryBreakdown).map(([cat, seconds]) => (
                <div key={cat} className="flex justify-between text-sm px-2 py-1 rounded hover:bg-gray-800/50">
                  <span className="text-gray-300">{cat}</span>
                  <span className="font-mono text-gray-400">
                    {(seconds / 3600).toFixed(2)}h
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User-editable section */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4 space-y-4">
          {/* Summary */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">
              Summary
            </label>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-2.5 text-sm text-gray-200 resize-none placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="What did you accomplish today?"
              rows={3}
              value={summary}
              onChange={(e) => { setSummary(e.target.value); markDirty(); }}
            />
          </div>

          {/* Highlights */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <CheckCircle size={11} className="text-green-500" /> Highlights
            </label>
            <div className="space-y-1 mb-2">
              {highlights.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-green-900/20 border border-green-800/30 rounded px-2 py-1 text-sm text-green-300"
                >
                  <span className="flex-1">{h}</span>
                  <button onClick={() => removeHighlight(i)} className="text-green-600 hover:text-green-300">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Add a highlight..."
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addHighlight(); }}
              />
              <Button size="sm" variant="ghost" onClick={addHighlight} disabled={!newHighlight.trim()}>
                <Plus size={14} />
              </Button>
            </div>
          </div>

          {/* Blockers */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <AlertTriangle size={11} className="text-orange-500" /> Blockers
            </label>
            <div className="space-y-1 mb-2">
              {blockers.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-orange-900/20 border border-orange-800/30 rounded px-2 py-1 text-sm text-orange-300"
                >
                  <span className="flex-1">{b}</span>
                  <button onClick={() => removeBlocker(i)} className="text-orange-600 hover:text-orange-300">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="Add a blocker..."
                value={newBlocker}
                onChange={(e) => setNewBlocker(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addBlocker(); }}
              />
              <Button size="sm" variant="ghost" onClick={addBlocker} disabled={!newBlocker.trim()}>
                <Plus size={14} />
              </Button>
            </div>
          </div>

          {/* Save bar */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <span className="text-[11px] text-gray-500">
              {eod.versions.length > 0
                ? `${eod.versions.length} previous version${eod.versions.length > 1 ? 's' : ''} saved`
                : 'No edits yet'}
            </span>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || updateMutation.isPending}
              className="gap-1"
            >
              <Save size={14} />
              {updateMutation.isPending ? 'Saving...' : isDirty ? 'Save EOD' : 'Saved'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
